export function generateProductSlug(title: string, id: string): string {
  const trMap: { [key: string]: string } = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
  };
  
  const slug = title
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, match => trMap[match])
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric (except spaces and dashes)
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-'); // Remove consecutive dashes

  return `${slug}-${id}`;
}

export function extractIdFromSlug(slugId: string): string {
    // Proje UUID tabanlı olduğu için (8-4-4-4-12 = 36 karakter)
    // Eğer slug sonunda bir UUID varsa onu ayıklar.
    // Örnek: "apple-iphone-15-uuid-1234..." -> "1234..."
    
    if (!slugId) return '';

    // UUID regex pattern (36 characters)
    const uuidRegex = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    const match = slugId.match(uuidRegex);
    
    if (match) {
        return match[0];
    }

    // Eğer regex bulamazsa ama uzunluk 36 ise direkt kendisidir (legacy support)
    if (slugId.length === 36) {
        return slugId;
    }

    // fallback: sondan 36 karakteri dene (UUID formatında değilse bile)
    return slugId.length > 36 ? slugId.slice(-36) : slugId;
}

export function appendAffiliateTag(url: string, tag: string = 'piinti-21'): string {
  if (!url || !url.startsWith('http')) return url;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes('amazon.')) {
      parsedUrl.searchParams.set('tag', tag);
    }
    return parsedUrl.toString();
  } catch (e) {
    return url;
  }
}
