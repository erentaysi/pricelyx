const axios = require('axios');

async function testTrendyolApi() {
    try {
        const response = await axios.get('https://public.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?q=iphone', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        
        const products = response.data.result.products;
        console.log(`Found ${products.length} products via API!`);
        console.log(products[0].name, products[0].price.sellingPrice);
        
    } catch (e) {
        console.error("API Error:", e.message);
    }
}

testTrendyolApi();
