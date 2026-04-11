export const MOCK_PRODUCTS = [
  {
    id: "p1",
    title: "iPhone 15 Pro Max 256GB",
    brand: "Apple",
    category: "Akıllı Telefon",
    image: "📱",
    basePrice: 54799,
    rating: 4.8,
    reviewsCount: 3400,
    isTrend: true,
    specs: {
      "Ekran": "6.7 inç OLED",
      "Kamera": "48 MP + 12 MP + 12 MP",
      "Hafıza": "256 GB",
      "RAM": "8 GB"
    },
    prices: [
      { vendor: "GittiGidiyor", price: 54799, shipping: "Ücretsiz Kargo", link: "#" },
      { vendor: "Hepsiburada", price: 55200, shipping: "Ücretsiz Kargo", link: "#" },
      { vendor: "Trendyol", price: 55500, shipping: "39.99 TL", link: "#" },
      { vendor: "Amazon", price: 55999, shipping: "Prime ile Ücretsiz", link: "#" }
    ],
    priceHistory: [
      { month: "Ocak", price: 58000 },
      { month: "Şubat", price: 57500 },
      { month: "Mart", price: 56000 },
      { month: "Nisan", price: 54799 }
    ]
  },
  {
    id: "p2",
    title: "MacBook Air M2 13 inç 256GB",
    brand: "Apple",
    category: "Bilgisayar",
    image: "💻",
    basePrice: 42999,
    rating: 4.9,
    reviewsCount: 2800,
    isTrend: false,
    specs: {
      "Ekran": "13.6 inç Liquid Retina",
      "İşlemci": "Apple M2",
      "Hafıza": "256 GB SSD",
      "RAM": "8 GB"
    },
    prices: [
      { vendor: "Pozitif Teknoloji", price: 42999, shipping: "Ücretsiz Kargo", link: "#" },
      { vendor: "Amazon", price: 43200, shipping: "Prime ile Ücretsiz", link: "#" },
      { vendor: "Troy", price: 43500, shipping: "Ücretsiz Kargo", link: "#" }
    ],
    priceHistory: [
      { month: "Ocak", price: 45000 },
      { month: "Şubat", price: 44200 },
      { month: "Mart", price: 43500 },
      { month: "Nisan", price: 42999 }
    ]
  },
  {
    id: "p3",
    title: "Samsung Galaxy S24 Ultra 512GB",
    brand: "Samsung",
    category: "Akıllı Telefon",
    image: "📱",
    basePrice: 62499,
    rating: 4.7,
    reviewsCount: 1900,
    isTrend: false,
    specs: {
      "Ekran": "6.8 inç Dynamic AMOLED 2X",
      "Kamera": "200 MP",
      "Hafıza": "512 GB",
      "RAM": "12 GB"
    },
    prices: [
      { vendor: "Samsung Shop", price: 62499, shipping: "Ücretsiz Kargo", link: "#" },
      { vendor: "Teknosa", price: 63000, shipping: "Ücretsiz Kargo", link: "#" },
      { vendor: "Vatan", price: 63500, shipping: "Ücretsiz Kargo", link: "#" }
    ],
    priceHistory: [
      { month: "Ocak", price: 65000 },
      { month: "Şubat", price: 64000 },
      { month: "Mart", price: 63200 },
      { month: "Nisan", price: 62499 }
    ]
  }
];

export const MOCK_CATEGORIES = [
  "Akıllı Telefon", "Bilgisayar", "Televizyon", "Kulaklık", "Ev Aletleri", "Kozmetik"
];

export const MOCK_BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Sony", "Philips", "Dyson"
];
