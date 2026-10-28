/**
 * data.js - Initial seed data for the Local Market Online Store
 * Includes demo users, 5 local vendors, 20 products, promotions, sample orders, reviews, and notifications.
 */

// SVG generator for offline artisan product illustrations
function makeProductSvg(title, bg, iconSvg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
    <rect width="400" height="300" fill="${bg}"/>
    <g transform="translate(140, 80) scale(1.5)">
      ${iconSvg}
    </g>
    <rect x="0" y="260" width="400" height="40" fill="rgba(0,0,0,0.06)"/>
    <text x="200" y="284" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="600" fill="#374151" text-anchor="middle" letter-spacing="0.5">${title.toUpperCase()}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Icon paths for SVGs
const ICONS = {
  tomato: `<path d="M40,25 C15,25 5,45 5,65 C5,85 20,95 40,95 C60,95 75,85 75,65 C75,45 65,25 40,25 Z" fill="#dc2626"/>
           <path d="M40,20 C42,10 46,6 50,4" stroke="#15803d" stroke-width="3" stroke-linecap="round" fill="none"/>
           <path d="M40,24 L34,18 M40,24 L46,18 M40,24 L30,26 M40,24 L50,26" stroke="#15803d" stroke-width="2.5" stroke-linecap="round"/>
           <circle cx="28" cy="48" r="4" fill="rgba(255,255,255,0.3)"/>`,
  spinach: `<path d="M40,15 C20,25 15,55 25,75 C35,95 40,95 40,95 C40,95 45,95 55,75 C65,55 60,25 40,15 Z" fill="#16a34a"/>
            <path d="M40,15 L40,95" stroke="#15803d" stroke-width="2" stroke-linecap="round"/>
            <path d="M40,35 L28,45 M40,50 L26,62 M40,65 L30,75 M40,35 L52,45 M40,50 L54,62 M40,65 L50,75" stroke="#15803d" stroke-width="1.5" stroke-linecap="round"/>`,
  chard: `<path d="M38,20 C22,25 18,50 25,70 C30,85 36,92 38,94 C40,92 46,85 51,70 C58,50 54,25 38,20 Z" fill="#059669"/>
          <path d="M38,25 L38,98" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
          <path d="M38,40 L28,48 M38,55 L26,65 M38,40 L48,48 M38,55 L50,65" stroke="#f43f5e" stroke-width="1.8"/>`,
  bread: `<ellipse cx="40" cy="55" rx="34" ry="22" fill="#d97706"/>
          <path d="M12,52 Q40,30 68,52 Q40,76 12,52 Z" fill="#b45309"/>
          <path d="M22,46 Q28,42 34,44 M34,48 Q40,44 46,46 M46,50 Q52,46 58,48" stroke="#fef3c7" stroke-width="2.5" stroke-linecap="round"/>`,
  buns: `<circle cx="30" cy="55" r="18" fill="#d97706"/>
         <circle cx="50" cy="55" r="18" fill="#b45309"/>
         <path d="M30,42 C36,42 40,48 40,55 C40,62 34,66 28,66 C22,66 18,60 20,54" fill="none" stroke="#fde68a" stroke-width="2.5"/>
         <path d="M50,42 C56,42 60,48 60,55 C60,62 54,66 48,66" fill="none" stroke="#fde68a" stroke-width="2.5"/>`,
  batard: `<path d="M10,60 C10,35 70,35 70,60 C70,75 10,75 10,60 Z" fill="#92400e"/>
           <path d="M24,45 L32,65 M36,43 L44,65 M48,43 L56,65" stroke="#fef3c7" stroke-width="2.5" stroke-linecap="round"/>`,
  eggs: `<ellipse cx="32" cy="58" rx="14" ry="20" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
         <ellipse cx="48" cy="62" rx="13" ry="18" fill="#fed7aa" stroke="#c2410c" stroke-width="2"/>
         <ellipse cx="40" cy="48" rx="12" ry="17" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>`,
  cheese: `<polygon points="12,70 68,70 68,45 12,55" fill="#f59e0b"/>
           <polygon points="12,55 45,30 68,45" fill="#fbbf24"/>
           <circle cx="30" cy="62" r="3" fill="#d97706"/>
           <circle cx="48" cy="60" r="4" fill="#d97706"/>
           <circle cx="60" cy="52" r="2.5" fill="#d97706"/>`,
  butter: `<rect x="15" y="45" width="50" height="25" rx="3" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
           <polygon points="15,45 28,32 78,32 65,45" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/>
           <polygon points="65,45 78,32 78,57 65,70" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>`,
  honey: `<path d="M25,35 L55,35 L58,75 C58,82 52,88 40,88 C28,88 22,82 22,75 Z" fill="#f59e0b" stroke="#b45309" stroke-width="2"/>
          <rect x="23" y="28" width="34" height="7" rx="2" fill="#d97706"/>
          <ellipse cx="40" cy="28" rx="14" ry="3" fill="#92400e"/>
          <rect x="27" y="48" width="26" height="20" rx="2" fill="#fff" opacity="0.85"/>
          <path d="M40,52 L42,56 L47,56 L43,59 L45,63 L40,60 L35,63 L37,59 L33,56 L38,56 Z" fill="#d97706"/>`,
  oil: `<path d="M34,20 L46,20 L46,32 L56,45 L56,80 C56,86 51,90 40,90 C29,90 24,86 24,80 L24,45 L34,32 Z" fill="#65a30d" stroke="#3f6212" stroke-width="2"/>
        <rect x="35" y="14" width="10" height="6" fill="#78350f"/>
        <rect x="28" y="52" width="24" height="24" rx="2" fill="#fef9c3" opacity="0.9"/>
        <circle cx="40" cy="64" r="5" fill="#4d7c0f"/>`,
  mustard: `<path d="M26,38 L54,38 L56,76 C56,82 50,86 40,86 C30,86 24,82 24,76 Z" fill="#eab308" stroke="#a16207" stroke-width="2"/>
            <rect x="28" y="30" width="24" height="8" rx="2" fill="#ca8a04"/>
            <rect x="28" y="50" width="24" height="18" fill="#fef08a"/>
            <circle cx="36" cy="58" r="2" fill="#713f12"/>
            <circle cx="44" cy="56" r="1.5" fill="#713f12"/>
            <circle cx="40" cy="62" r="1.8" fill="#713f12"/>`,
  mug: `<path d="M22,35 L54,35 L52,80 C52,86 46,90 38,90 C30,90 24,86 24,80 Z" fill="#e2e8f0" stroke="#475569" stroke-width="2.5"/>
        <path d="M53,44 C63,44 67,52 67,60 C67,68 62,74 52,74" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="50" r="1.5" fill="#94a3b8"/>
        <circle cx="42" cy="62" r="2" fill="#94a3b8"/>
        <circle cx="36" cy="74" r="1.5" fill="#94a3b8"/>`,
  candle: `<rect x="26" y="38" width="28" height="50" rx="3" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
           <line x1="40" y1="38" x2="40" y2="28" stroke="#78350f" stroke-width="2"/>
           <path d="M40,16 C43,22 44,26 40,28 C36,26 37,22 40,16 Z" fill="#f97316"/>
           <circle cx="40" cy="24" r="2.5" fill="#fef08a"/>`,
  knife: `<path d="M15,70 L35,50 L40,55 L20,75 Z" fill="#78350f"/>
          <path d="M35,50 C45,40 68,26 72,28 C74,32 60,55 40,55 Z" fill="#ca8a04" stroke="#854d0e" stroke-width="1.5"/>`,
  apples: `<circle cx="32" cy="62" r="18" fill="#dc2626"/>
           <circle cx="50" cy="62" r="16" fill="#b91c1c"/>
           <path d="M32,44 C34,36 38,32 40,30" stroke="#15803d" stroke-width="2.5" fill="none"/>
           <path d="M40,33 C45,32 48,36 46,38 C43,39 40,35 40,33 Z" fill="#16a34a"/>`,
  focaccia: `<rect x="15" y="42" width="54" height="34" rx="6" fill="#d97706" stroke="#92400e" stroke-width="2"/>
             <circle cx="28" cy="52" r="3" fill="#713f12"/>
             <circle cx="44" cy="50" r="3" fill="#713f12"/>
             <circle cx="34" cy="64" r="2.5" fill="#713f12"/>
             <circle cx="54" cy="62" r="3" fill="#713f12"/>
             <path d="M26,50 L32,54 M42,48 L48,52" stroke="#15803d" stroke-width="1.5"/>`,
  jam: `<path d="M26,38 L54,38 L56,76 C56,82 50,86 40,86 C30,86 24,82 24,76 Z" fill="#be123c" stroke="#881337" stroke-width="2"/>
        <rect x="24" y="30" width="32" height="8" rx="2" fill="#fda4af"/>
        <rect x="28" y="48" width="24" height="20" fill="#fff" opacity="0.9"/>
        <circle cx="40" cy="58" r="4" fill="#e11d48"/>`,
  milk: `<path d="M32,24 L48,24 L52,40 L54,82 C54,87 49,90 40,90 C31,90 26,87 26,82 L28,40 Z" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
         <rect x="34" y="18" width="12" height="6" rx="1" fill="#3b82f6"/>
         <rect x="30" y="52" width="20" height="22" rx="2" fill="#bfdbfe" opacity="0.8"/>
         <text x="40" y="66" font-size="8" font-family="sans-serif" font-weight="bold" fill="#1e40af" text-anchor="middle">MILK</text>`,
  towels: `<rect x="20" y="35" width="40" height="48" rx="2" fill="#e0e7ff" stroke="#4338ca" stroke-width="2"/>
           <line x1="20" y1="45" x2="60" y2="45" stroke="#6366f1" stroke-width="1.5"/>
           <line x1="20" y1="70" x2="60" y2="70" stroke="#6366f1" stroke-width="1.5"/>
           <line x1="20" y1="83" x2="60" y2="83" stroke="#4338ca" stroke-width="2" stroke-dasharray="2 2"/>`
};

const MarketplaceSeedData = {
  // Demo Users
  users: [
    {
      id: 'u_customer',
      name: 'Sarah Jenkins',
      email: 'customer@demo.com',
      password: 'demo123',
      role: 'customer',
      phone: '+1 (555) 901-2244',
      address: '42 Maple Street, Apt 3B',
      locality: 'Northwood Hills',
      joinedDate: '2026-09-12'
    },
    {
      id: 'u_vendor',
      name: 'David Miller',
      email: 'vendor@demo.com',
      password: 'demo123',
      role: 'vendor',
      phone: '+1 (555) 234-8891',
      vendorId: 'v1',
      joinedDate: '2026-08-01'
    },
    {
      id: 'u_admin',
      name: 'Eleanor Vance',
      email: 'admin@demo.com',
      password: 'demo123',
      role: 'admin',
      phone: '+1 (555) 111-9900',
      joinedDate: '2026-07-15'
    }
  ],

  // 5 Real-world themed local vendors
  vendors: [
    {
      id: 'v1',
      name: 'Green Valley Organics',
      ownerEmail: 'vendor@demo.com',
      locality: 'Northwood Hills',
      category: 'Fresh Produce',
      bio: 'Family-owned sustainable micro-farm bringing crisp seasonal greens, heirloom fruits, and pesticide-free vegetables directly from soil to your table within 24 hours of harvest.',
      contactEmail: 'contact@greenvalley.local',
      phone: '+1 (555) 234-8891',
      status: 'approved',
      isOpen: true,
      rating: 4.9,
      reviewCount: 42,
      establishedYear: 2018
    },
    {
      id: 'v2',
      name: 'The Artisan Sourdough Bakery',
      ownerEmail: 'bakery@demo.com',
      locality: 'Historic Downtown',
      category: 'Bakery',
      bio: 'Naturally wild-fermented breads, hand-rolled brioche pastries, and focaccias baked fresh at 4:00 AM daily with organic stoneground flours and no artificial preservatives.',
      contactEmail: 'orders@artisanbakery.local',
      phone: '+1 (555) 762-1102',
      status: 'approved',
      isOpen: true,
      rating: 4.8,
      reviewCount: 58,
      establishedYear: 2020
    },
    {
      id: 'v3',
      name: 'Meadow Brook Dairy & Creamery',
      ownerEmail: 'dairy@demo.com',
      locality: 'Riverdale Valley',
      category: 'Dairy & Eggs',
      bio: 'Grass-fed cow’s milk, small-batch clothbound cheddar, churned salted butter, and pasture-raised golden yolk eggs from happy, ethically cared-for livestock.',
      contactEmail: 'hello@meadowbrook.local',
      phone: '+1 (555) 433-2981',
      status: 'approved',
      isOpen: true,
      rating: 4.7,
      reviewCount: 31,
      establishedYear: 2016
    },
    {
      id: 'v4',
      name: 'Heritage Pantry & Spices',
      ownerEmail: 'pantry@demo.com',
      locality: 'Old Town Market',
      category: 'Pantry & Groceries',
      bio: 'Cold-pressed single-estate extra virgin olive oils, coarse stoneground mustards, unfiltered mountain wildflower honeys, and handcrafted fruit preserves.',
      contactEmail: 'info@heritagepantry.local',
      phone: '+1 (555) 892-5541',
      status: 'approved',
      isOpen: true,
      rating: 4.9,
      reviewCount: 27,
      establishedYear: 2019
    },
    {
      id: 'v5',
      name: 'Cedar & Stone Craft Co.',
      ownerEmail: 'crafts@demo.com',
      locality: 'East Arts District',
      category: 'Handmade Crafts',
      bio: 'Hand-thrown speckled stoneware ceramics, carved olive wood utensils, beeswax pillar candles, and pure linen home goods made by local neighbourhood artisans.',
      contactEmail: 'studio@cedarandstone.local',
      phone: '+1 (555) 601-3342',
      status: 'approved',
      isOpen: true,
      rating: 4.8,
      reviewCount: 19,
      establishedYear: 2021
    }
  ],

  // Product categories
  categories: [
    'Fresh Produce',
    'Bakery',
    'Dairy & Eggs',
    'Pantry & Groceries',
    'Handmade Crafts'
  ],

  // 20 High-fidelity Products
  products: [
    {
      id: 'p1',
      vendorId: 'v1',
      name: 'Heirloom Beefsteak Tomatoes (1 kg)',
      category: 'Fresh Produce',
      price: 80.00,
      stock: 18,
      description: 'Sun-ripened heritage tomatoes with rich, sweet-tangy flavor. Hand-picked each morning, perfect for fresh caprese salads or rustic rustic pasta sauces.',
      image: makeProductSvg('Heirloom Tomatoes', '#fee2e2', ICONS.tomato),
      rating: 4.9,
      reviewCount: 14,
      featured: true,
      status: 'active'
    },
    {
      id: 'p2',
      vendorId: 'v1',
      name: 'Crisp Organic Baby Spinach (250g)',
      category: 'Fresh Produce',
      price: 50.00,
      stock: 24,
      description: 'Tender, triple-washed organic young spinach leaves packed with nutrients, iron, and natural sweet earthiness. Excellent raw in bowls or lightly sautéed.',
      image: makeProductSvg('Baby Spinach', '#dcfce7', ICONS.spinach),
      rating: 4.7,
      reviewCount: 8,
      featured: false,
      status: 'active'
    },
    {
      id: 'p3',
      vendorId: 'v1',
      name: 'Rainbow Swiss Chard Bunch',
      category: 'Fresh Produce',
      price: 60.00,
      stock: 4, // Low stock demo!
      description: 'Vibrant yellow, ruby crimson, and ivory-stemmed chard freshly cut from our regenerative beds. Adds gorgeous color and tender greens to any dinner table.',
      image: makeProductSvg('Swiss Chard', '#d1fae5', ICONS.chard),
      rating: 4.8,
      reviewCount: 5,
      featured: false,
      status: 'active'
    },
    {
      id: 'p4',
      vendorId: 'v2',
      name: 'Country Sourdough Loaf (800g)',
      category: 'Bakery',
      price: 140.00,
      stock: 15,
      description: '36-hour cold-fermented country bread with a deeply caramelized blistered crust, complex mild sourness, and an airy, custard-like open crumb.',
      image: makeProductSvg('Sourdough Bread', '#fef3c7', ICONS.bread),
      rating: 5.0,
      reviewCount: 22,
      featured: true,
      status: 'active'
    },
    {
      id: 'p5',
      vendorId: 'v2',
      name: 'Cardamom & Cinnamon Morning Buns (Box of 4)',
      category: 'Bakery',
      price: 180.00,
      stock: 10,
      description: 'Flaky laminated croissant dough hand-twisted with freshly ground green cardamom pods, sweet Ceylon cinnamon, and organic dark brown sugar crystals.',
      image: makeProductSvg('Morning Buns', '#fef9c3', ICONS.buns),
      rating: 4.9,
      reviewCount: 18,
      featured: true,
      status: 'active'
    },
    {
      id: 'p6',
      vendorId: 'v2',
      name: 'Seeded Whole Rye Artisan Batard',
      category: 'Bakery',
      price: 160.00,
      stock: 8,
      description: 'Hearty northern European style rye loaf packed with toasted pumpkin seeds, organic flax, and golden sesame. Stays moist and flavorful for over a week.',
      image: makeProductSvg('Seeded Rye Batard', '#f5ebe0', ICONS.batard),
      rating: 4.6,
      reviewCount: 7,
      featured: false,
      status: 'active'
    },
    {
      id: 'p7',
      vendorId: 'v3',
      name: 'Pasture-Raised Farm Eggs (Dozen)',
      category: 'Dairy & Eggs',
      price: 110.00,
      stock: 30,
      description: 'Deep golden-orange yolks from heritage breed hens roaming freely on certified organic grass pastures. Gathered by hand each dawn.',
      image: makeProductSvg('Farm Eggs', '#fef3c7', ICONS.eggs),
      rating: 4.9,
      reviewCount: 19,
      featured: true,
      status: 'active'
    },
    {
      id: 'p8',
      vendorId: 'v3',
      name: 'Aged Farmhouse Raw Milk Cheddar (250g)',
      category: 'Dairy & Eggs',
      price: 320.00,
      stock: 12,
      description: 'Traditional clothbound cheddar cave-aged for 14 months. Rich, savory, and nutty with satisfying crunchy tyrosine crystallization throughout.',
      image: makeProductSvg('Aged Cheddar', '#fef08a', ICONS.cheese),
      rating: 4.8,
      reviewCount: 11,
      featured: false,
      status: 'active'
    },
    {
      id: 'p9',
      vendorId: 'v3',
      name: 'Cultured Sea Salt Farm Butter (200g)',
      category: 'Dairy & Eggs',
      price: 180.00,
      stock: 16,
      description: 'Slow-churned European-style creamery butter boasting 84% butterfat and flecked with hand-harvested Atlantic sea salt. Velvety and decadent.',
      image: makeProductSvg('Cultured Butter', '#fef9c3', ICONS.butter),
      rating: 4.9,
      reviewCount: 13,
      featured: false,
      status: 'active'
    },
    {
      id: 'p10',
      vendorId: 'v4',
      name: 'Unfiltered Wildflower Raw Honey (500g)',
      category: 'Pantry & Groceries',
      price: 380.00,
      stock: 22,
      description: 'Single-source raw floral honey harvested from valley apiaries. Pure, unheated, retaining all natural pollen grains, antioxidants, and botanical aromas.',
      image: makeProductSvg('Raw Honey', '#fef3c7', ICONS.honey),
      rating: 5.0,
      reviewCount: 16,
      featured: true,
      status: 'active'
    },
    {
      id: 'p11',
      vendorId: 'v4',
      name: 'Cold-Pressed Extra Virgin Olive Oil (500ml)',
      category: 'Pantry & Groceries',
      price: 590.00,
      stock: 14,
      description: 'Early-harvest Koroneiki olives cold-extracted within six hours of picking. Bright grassy aroma with notes of green artichoke and a pleasant peppery kick.',
      image: makeProductSvg('Olive Oil', '#ecfccb', ICONS.oil),
      rating: 4.8,
      reviewCount: 9,
      featured: false,
      status: 'active'
    },
    {
      id: 'p12',
      vendorId: 'v4',
      name: 'Handmade Stoneground Mustard (180g)',
      category: 'Pantry & Groceries',
      price: 130.00,
      stock: 19,
      description: 'Whole brown and yellow mustard seeds steeped in organic raw cider vinegar and raw honey, coarsely ground on traditional granite stones.',
      image: makeProductSvg('Stoneground Mustard', '#fef08a', ICONS.mustard),
      rating: 4.7,
      reviewCount: 6,
      featured: false,
      status: 'active'
    },
    {
      id: 'p13',
      vendorId: 'v5',
      name: 'Hand-Thrown Speckled Stoneware Mug',
      category: 'Handmade Crafts',
      price: 350.00,
      stock: 7,
      description: 'Wheel-thrown stoneware clay mug featuring a comfortable thumb-rest handle and satin cream eggshell glaze. Dishwasher and microwave safe. Holds 350ml.',
      image: makeProductSvg('Stoneware Mug', '#f1f5f9', ICONS.mug),
      rating: 4.9,
      reviewCount: 12,
      featured: true,
      status: 'active'
    },
    {
      id: 'p14',
      vendorId: 'v5',
      name: 'Pure Beeswax Pillar Candle (Hand-Poured)',
      category: 'Handmade Crafts',
      price: 240.00,
      stock: 15,
      description: '100% pure local apiary beeswax pillar candle with raw unbleached cotton wick. Naturally cleanses the air while casting a warm golden glow. 40-hr burn.',
      image: makeProductSvg('Beeswax Candle', '#fef9c3', ICONS.candle),
      rating: 4.8,
      reviewCount: 8,
      featured: false,
      status: 'active'
    },
    {
      id: 'p15',
      vendorId: 'v5',
      name: 'Carved Olive Wood Butter Spreader',
      category: 'Handmade Crafts',
      price: 160.00,
      stock: 11,
      description: 'Individually carved from sustainably pruned Mediterranean olive tree branches. Treated with organic food-grade walnut oil for lifelong durability.',
      image: makeProductSvg('Wood Spreader', '#fef3c7', ICONS.knife),
      rating: 4.6,
      reviewCount: 5,
      featured: false,
      status: 'active'
    },
    {
      id: 'p16',
      vendorId: 'v1',
      name: 'Crisp Sweet Gala Apples Basket (1.5 kg)',
      category: 'Fresh Produce',
      price: 190.00,
      stock: 20,
      description: 'Juicy, fragrant Gala apples freshly harvested from our hillside orchard. Thin-skinned and naturally sweet, perfect for healthy snacking or homemade pies.',
      image: makeProductSvg('Gala Apples', '#fee2e2', ICONS.apples),
      rating: 4.7,
      reviewCount: 9,
      featured: false,
      status: 'active'
    },
    {
      id: 'p17',
      vendorId: 'v2',
      name: 'Crusty Garlic & Herb Sea Salt Focaccia',
      category: 'Bakery',
      price: 150.00,
      stock: 9,
      description: 'Slow-proved olive oil dough deeply dimpled with roasted garlic heads, fresh garden rosemary needles, and crunchy Maldon sea salt flakes.',
      image: makeProductSvg('Garlic Focaccia', '#fef3c7', ICONS.focaccia),
      rating: 4.9,
      reviewCount: 14,
      featured: false,
      status: 'active'
    },
    {
      id: 'p18',
      vendorId: 'v4',
      name: 'Small-Batch Strawberry Lavender Jam (250g)',
      category: 'Pantry & Groceries',
      price: 180.00,
      stock: 16,
      description: 'Cooked in small copper kettles with ripe June strawberries and organic English lavender blossoms. Reduced sugar recipe that lets the fruit shine.',
      image: makeProductSvg('Strawberry Jam', '#ffe4e6', ICONS.jam),
      rating: 4.8,
      reviewCount: 10,
      featured: false,
      status: 'active'
    },
    {
      id: 'p19',
      vendorId: 'v3',
      name: 'Whole Cream Milk (1L Reusable Glass)',
      category: 'Dairy & Eggs',
      price: 75.00,
      stock: 25,
      description: 'Non-homogenized, low-temperature vat pasteurized whole milk with the traditional cream line on top. Bottled in sterilised deposit glass.',
      image: makeProductSvg('Fresh Milk', '#eff6ff', ICONS.milk),
      rating: 4.8,
      reviewCount: 15,
      featured: false,
      status: 'active'
    },
    {
      id: 'p20',
      vendorId: 'v5',
      name: 'Woven Pure Linen Tea Towels (Set of 2)',
      category: 'Handmade Crafts',
      price: 280.00,
      stock: 10,
      description: 'Woven from unbleached natural European flax fibers. Extremely absorbent, lint-free, and naturally antibacterial. Gets softer with each wash.',
      image: makeProductSvg('Linen Towels', '#e0e7ff', ICONS.towels),
      rating: 4.7,
      reviewCount: 6,
      featured: false,
      status: 'active'
    }
  ],

  // Promotions
  promotions: [
    {
      id: 'promo_1',
      code: 'LOCAL10',
      description: '10% discount on all neighborhood marketplace orders over ₹200',
      type: 'percent', // 'percent' or 'flat'
      value: 10,
      minOrder: 200.00,
      active: true,
      vendorId: 'all',
      startDate: '2026-10-01',
      endDate: '2026-12-31'
    },
    {
      id: 'promo_2',
      code: 'FRESH50',
      description: '₹50.00 off farm produce and artisan goods on orders over ₹350',
      type: 'flat',
      value: 50.00,
      minOrder: 350.00,
      active: true,
      vendorId: 'v1',
      startDate: '2026-10-15',
      endDate: '2026-11-30'
    }
  ],

  // Sample Customer Orders with Complete Pipeline
  orders: [
    {
      id: 'ORD-8291',
      customerEmail: 'customer@demo.com',
      customerName: 'Sarah Jenkins',
      phone: '+1 (555) 901-2244',
      address: '42 Maple Street, Apt 3B',
      locality: 'Northwood Hills',
      notes: 'Please leave near apartment door on third floor.',
      date: '2026-10-25 10:15',
      status: 'Delivered', // Placed -> Confirmed -> Packed -> Shipped -> Out for delivery -> Delivered
      items: [
        {
          productId: 'p1',
          name: 'Heirloom Beefsteak Tomatoes (1 kg)',
          vendorId: 'v1',
          vendorName: 'Green Valley Organics',
          price: 80.00,
          quantity: 2,
          image: makeProductSvg('Heirloom Tomatoes', '#fee2e2', ICONS.tomato)
        },
        {
          productId: 'p4',
          name: 'Country Sourdough Loaf (800g)',
          vendorId: 'v2',
          vendorName: 'The Artisan Sourdough Bakery',
          price: 140.00,
          quantity: 1,
          image: makeProductSvg('Sourdough Bread', '#fef3c7', ICONS.bread)
        }
      ],
      subtotal: 300.00,
      discount: 30.00,
      deliveryFee: 40.00,
      total: 310.00,
      promoCode: 'LOCAL10',
      paymentMethod: 'UPI',
      paymentDetails: 'sarah@oksbi (Txn #UPI889104)',
      paymentStatus: 'Paid',
      trackingHistory: [
        { step: 'Placed', timestamp: '2026-10-25 10:15', note: 'Order placed by Sarah Jenkins' },
        { step: 'Confirmed', timestamp: '2026-10-25 10:30', note: 'Accepted and verified by local vendors' },
        { step: 'Packed', timestamp: '2026-10-25 11:20', note: 'Packaged in insulated recyclable tote' },
        { step: 'Shipped', timestamp: '2026-10-25 12:05', note: 'Collected by neighborhood bicycle courier' },
        { step: 'Out for delivery', timestamp: '2026-10-25 13:40', note: 'Courier is 4 stops away in Northwood Hills' },
        { step: 'Delivered', timestamp: '2026-10-25 14:15', note: 'Delivered safely at front door' }
      ],
      reviewed: true
    },
    {
      id: 'ORD-9412',
      customerEmail: 'customer@demo.com',
      customerName: 'Sarah Jenkins',
      phone: '+1 (555) 901-2244',
      address: '42 Maple Street, Apt 3B',
      locality: 'Northwood Hills',
      notes: 'Ring bell upon arrival.',
      date: '2026-10-28 09:20',
      status: 'Packed',
      items: [
        {
          productId: 'p7',
          name: 'Pasture-Raised Farm Eggs (Dozen)',
          vendorId: 'v3',
          vendorName: 'Meadow Brook Dairy & Creamery',
          price: 110.00,
          quantity: 1,
          image: makeProductSvg('Farm Eggs', '#fef3c7', ICONS.eggs)
        },
        {
          productId: 'p10',
          name: 'Unfiltered Wildflower Raw Honey (500g)',
          vendorId: 'v4',
          vendorName: 'Heritage Pantry & Spices',
          price: 380.00,
          quantity: 1,
          image: makeProductSvg('Raw Honey', '#fef3c7', ICONS.honey)
        }
      ],
      subtotal: 490.00,
      discount: 0.00,
      deliveryFee: 40.00,
      total: 530.00,
      promoCode: '',
      paymentMethod: 'Card',
      paymentDetails: 'Visa ending in •••• 4242',
      paymentStatus: 'Paid',
      trackingHistory: [
        { step: 'Placed', timestamp: '2026-10-28 09:20', note: 'Order placed by Sarah Jenkins' },
        { step: 'Confirmed', timestamp: '2026-10-28 09:35', note: 'Confirmed by Meadow Brook & Heritage Pantry' },
        { step: 'Packed', timestamp: '2026-10-28 10:15', note: 'Carefully wrapped with cardboard cushions' }
      ],
      reviewed: false
    }
  ],

  // Sample Product Reviews
  reviews: [
    {
      id: 'rev_1',
      productId: 'p1',
      customerName: 'Sarah Jenkins',
      customerEmail: 'customer@demo.com',
      rating: 5,
      comment: 'Incredible flavor! These taste like tomatoes used to taste when I was a kid. You can tell they were picked that very morning.',
      date: '2026-10-25'
    },
    {
      id: 'rev_2',
      productId: 'p1',
      customerName: 'Marcus Bennett',
      customerEmail: 'marcus@example.com',
      rating: 5,
      comment: 'Super fresh, sweet, and firm. We made bruschetta with it and our guests were raving.',
      date: '2026-10-22'
    },
    {
      id: 'rev_3',
      productId: 'p4',
      customerName: 'Sarah Jenkins',
      customerEmail: 'customer@demo.com',
      rating: 5,
      comment: 'The crust on this sourdough is heavenly. Nice sour tang without being overwhelming. Toasts up beautifully.',
      date: '2026-10-25'
    },
    {
      id: 'rev_4',
      productId: 'p10',
      customerName: 'Claire Taylor',
      customerEmail: 'claire@example.com',
      rating: 5,
      comment: 'You can smell the floral fields as soon as you open the jar. Worth every single penny.',
      date: '2026-10-20'
    },
    {
      id: 'rev_5',
      productId: 'p13',
      customerName: 'David Lee',
      customerEmail: 'davidl@example.com',
      rating: 5,
      comment: 'My favorite morning coffee mug now. Perfect weight in the hand and lovely speckled finish.',
      date: '2026-10-18'
    }
  ],

  // Sample Notifications
  notifications: [
    {
      id: 'notif_1',
      userEmail: 'customer@demo.com',
      title: 'Welcome to Local Market!',
      message: 'Explore hand-harvested goods from vendors right in your neighbourhood. Use promo code LOCAL10 for 10% off your first order.',
      type: 'promo',
      timestamp: '2026-10-24 09:00',
      read: true,
      link: 'products.html'
    },
    {
      id: 'notif_2',
      userEmail: 'customer@demo.com',
      title: 'Order Delivered (#ORD-8291)',
      message: 'Your order has been delivered by the courier. How were the heirloom tomatoes and sourdough? Leave a quick review!',
      type: 'order',
      timestamp: '2026-10-25 14:15',
      read: true,
      link: 'order.html?id=ORD-8291'
    },
    {
      id: 'notif_3',
      userEmail: 'customer@demo.com',
      title: 'Order Packed (#ORD-9412)',
      message: 'Great news! Your farm eggs and wildflower honey have been packed and are awaiting dispatch.',
      type: 'order',
      timestamp: '2026-10-28 10:15',
      read: false,
      link: 'order.html?id=ORD-9412'
    },
    {
      id: 'notif_4',
      userEmail: 'vendor@demo.com',
      title: 'Order Item Confirmed',
      message: 'Customer Sarah Jenkins ordered 2x Heirloom Beefsteak Tomatoes in #ORD-8291.',
      type: 'order',
      timestamp: '2026-10-25 10:15',
      read: true,
      link: 'vendor-orders.html'
    },
    {
      id: 'notif_5',
      userEmail: 'vendor@demo.com',
      title: 'Low Stock Alert',
      message: 'Inventory warning: Rainbow Swiss Chard Bunch is down to 4 units in stock.',
      type: 'alert',
      timestamp: '2026-10-27 16:30',
      read: false,
      link: 'vendor-products.html'
    },
    {
      id: 'notif_6',
      userEmail: 'admin@demo.com',
      title: 'Platform Overview',
      message: 'Marketplace operational with 5 approved vendors and 20 active products.',
      type: 'system',
      timestamp: '2026-10-28 08:00',
      read: false,
      link: 'admin.html'
    }
  ]
};

window.MarketplaceSeedData = MarketplaceSeedData;
