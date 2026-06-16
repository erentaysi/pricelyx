import crypto from 'crypto';

const AMAZON_ACCESS_KEY = process.env.AMAZON_ACCESS_KEY || 'mock';
const AMAZON_SECRET_KEY = process.env.AMAZON_SECRET_KEY || 'mock';
const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'mock-20';
const AMAZON_REGION = process.env.AMAZON_REGION || 'eu-west-1'; // TR is under eu-west-1
const HOST = 'webservices.amazon.com.tr';

function signV4(method: string, uri: string, headers: Record<string, string>, payload: string) {
  // AWS Signature V4 Implementation
  // Note: This is a basic implementation for PA API 5.0
  const amzDate = headers['x-amz-date'];
  const dateStamp = amzDate.substring(0, 8);
  const service = 'ProductAdvertisingAPI';

  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k.toLowerCase()}:${headers[k].trim()}`)
    .join('\n') + '\n';
  const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';');

  const payloadHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  const canonicalRequest = `${method}\n${uri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${AMAZON_REGION}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  const kDate = crypto.createHmac('sha256', `AWS4${AMAZON_SECRET_KEY}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(AMAZON_REGION).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return `${algorithm} Credential=${AMAZON_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

export async function getAmazonProductsByAsins(asins: string[]) {
  // If we don't have real keys, return mock data!
  if (AMAZON_ACCESS_KEY === 'mock') {
    console.log('[Mock PA API] Returning mock data for ASINs:', asins);
    return asins.map(asin => ({
      asin,
      price: Math.floor(Math.random() * 5000) + 500, // Random price 500 - 5500
      url: `https://www.amazon.com.tr/dp/${asin}?tag=${AMAZON_ASSOCIATE_TAG}`,
      inStock: Math.random() > 0.2 // 80% chance in stock
    }));
  }

  // REAL API CALL LOGIC
  const payload = JSON.stringify({
    ItemIds: asins,
    Resources: [
      'Offers.Listings.Price',
      'Offers.Listings.Availability.Message'
    ],
    PartnerTag: AMAZON_ASSOCIATE_TAG,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.com.tr'
  });

  const amzDate = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const headers: Record<string, string> = {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    'host': HOST,
    'x-amz-date': amzDate,
    'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems'
  };

  headers['Authorization'] = signV4('POST', '/paapi5/getitems', headers, payload);

  try {
    const response = await fetch(`https://${HOST}/paapi5/getitems`, {
      method: 'POST',
      headers,
      body: payload
    });

    if (!response.ok) {
      console.error('Amazon PA API Error:', await response.text());
      return [];
    }

    const data = await response.json();
    const items = data?.ItemsResult?.Items || [];
    
    return items.map((item: any) => {
      const listing = item.Offers?.Listings?.[0];
      return {
        asin: item.ASIN,
        price: listing?.Price?.Amount || null,
        url: item.DetailPageURL,
        inStock: listing?.Availability?.Message === 'In Stock.' // simplify
      };
    });
  } catch (err) {
    console.error('Amazon PA API Fetch Error:', err);
    return [];
  }
}
