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
    // Format is "apple-iphone-15-pro-max-[UUID]"
    // UUID format is 8-4-4-4-12, total 36 chars.
    if (slugId.length > 36) {
        return slugId.slice(-36);
    }
    return slugId; // Fallback if it's just the ID
}
