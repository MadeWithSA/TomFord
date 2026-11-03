// Каталог TomFord: 24 аромата, два объёма (50 / 100 мл)
(function () {
  // family: woody | floral | leather | fresh | gourmand | oriental
  const RAW = [
    ['Tobacco Vanille', 'unisex', 'oriental', 2890000, ['Tobacco Leaf', 'Vanilla', 'Tonka Bean'], 28],
    ['Oud Wood', 'unisex', 'woody', 2790000, ['Rosewood', 'Oud', 'Sandalwood'], 35],
    ['Black Orchid', 'unisex', 'floral', 2590000, ['Black Truffle', 'Orchid', 'Patchouli'], 200],
    ['Lost Cherry', 'unisex', 'gourmand', 3190000, ['Black Cherry', 'Almond', 'Tonka Bean'], 350],
    ['Noir de Noir', 'unisex', 'floral', 2990000, ['Saffron', 'Black Rose', 'Vanilla'], 12],
    ['Tuscan Leather', 'unisex', 'leather', 2840000, ['Raspberry', 'Leather', 'Amber'], 22],
    ['Ombré Leather', 'unisex', 'leather', 2390000, ['Cardamom', 'Leather', 'Jasmine'], 25],
    ['Fucking Fabulous', 'unisex', 'leather', 3390000, ['Almond', 'Lavender', 'Cashmeran'], 330],
    ['Soleil Blanc', 'women', 'floral', 2740000, ['Bergamot', 'Tuberose', 'Amber'], 48],
    ['Bitter Peach', 'unisex', 'gourmand', 3240000, ['Blood Orange', 'Peach', 'Rum'], 355],
    ['Café Rose', 'women', 'floral', 2940000, ['Coffee', 'Rose', 'Sandalwood'], 340],
    ['Neroli Portofino', 'unisex', 'fresh', 2690000, ['Neroli', 'Lemon', 'Amber'], 190],
    ['Vanille Fatale', 'women', 'gourmand', 2840000, ['Mandarin', 'Vanilla', 'Sandalwood'], 38],
    ['Rose Prick', 'women', 'floral', 2790000, ['Rose', 'Pink Pepper', 'Patchouli'], 345],
    ['Electric Cherry', 'women', 'gourmand', 3090000, ['Cherry', 'Jasmine', 'Musk'], 320],
    ['Costa Azzurra', 'men', 'fresh', 2440000, ['Juniper', 'Sea Salt', 'Cedar'], 205],
    ['Grey Vetiver', 'men', 'woody', 2290000, ['Grapefruit', 'Vetiver', 'Oakmoss'], 150],
    ['Noir Extreme', 'men', 'oriental', 2540000, ['Nutmeg', 'Amber', 'Vanilla'], 24],
    ['Santal Blush', 'women', 'woody', 2640000, ['Cardamom', 'Sandalwood', 'Ylang'], 30],
    ['Jasmin Rouge', 'women', 'floral', 2690000, ['Jasmine', 'Chili', 'Heliotrope'], 5],
    ['Sahara Noir', 'men', 'oriental', 3040000, ['Incense', 'Saffron', 'Leather'], 18],
    ['Italian Cypress', 'men', 'fresh', 2490000, ['Cypress', 'Bergamot', 'Musk'], 160],
    ['Fougère d\'Argent', 'men', 'woody', 2590000, ['Lavender', 'Cedar', 'Moss'], 170],
    ['Amber Absolu', 'unisex', 'oriental', 3140000, ['Labdanum', 'Amber', 'Benzoin'], 32]
  ];
  const PALETTE = {
    oriental: ['#b5651d', '#2a1a0e'],
    woody: ['#8a5a2b', '#1f1810'],
    floral: ['#8e2b4a', '#1a0d12'],
    leather: ['#6b3a1e', '#140d09'],
    fresh: ['#3b8fa0', '#0e1a1d'],
    gourmand: ['#a3202e', '#1c0b0d']
  };
  window.TF_PRODUCTS = RAW.map((r, i) => ({
    id: i + 1,
    name: r[0],
    gender: r[1],
    family: r[2],
    price50: r[3],
    price100: Math.round(r[3] * 1.62 / 10000) * 10000,
    notes: r[4],
    hue: r[5],
    liquid: PALETTE[r[2]][0],
    dark: PALETTE[r[2]][1],
    hit: i < 4 || i === 5 || i === 11
  }));
  window.TF_PALETTE = PALETTE;
})();
