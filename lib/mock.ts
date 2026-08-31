export type Category =
  | "APPAREL"
  | "FOOTWEAR"
  | "ACCESSORIES"
  | "OUTERWEAR";

export type Gender = "WOMEN" | "MEN" | "UNISEX";

/** Lowercase route slugs used in /category/[slug]. */
export type CategorySlug =
  | "apparel"
  | "footwear"
  | "accessories"
  | "outerwear";

export const CAT_SLUG_TO_LABEL: Record<CategorySlug, Category> = {
  apparel: "APPAREL",
  footwear: "FOOTWEAR",
  accessories: "ACCESSORIES",
  outerwear: "OUTERWEAR",
};

export type Promo = "justIn" | "comingSoon" | "recycled" | "limited";

export type Product = {
  id: string;
  name: string;
  description: string;
  descriptionFr: string;
  price: number;
  originalPrice?: number;
  sellerId: string;
  sellerName: string;
  category: Category;
  /** Department. UNISEX pieces show up in both the Women and Men menus. */
  gender: Gender;
  /** Subcategory slug, one of SUBCATEGORIES_BY_CATEGORY[category]. */
  subcategory: string;
  sizes: string[];
  /** Product photos (square). [0] = cover everywhere; [1],[2] = extra PDP angles. */
  imageUrls: string[];
  swatches: string[];
  promo?: Promo;
  reviews: number;
};

export type Seller = {
  id: string;
  name: string;
  handle: string;
  location: string;
  founded: string;
  about: string;
  aboutFr: string;
};

export const CATEGORIES: { slug: string; label: Category }[] = [
  { slug: "apparel", label: "APPAREL" },
  { slug: "footwear", label: "FOOTWEAR" },
  { slug: "accessories", label: "ACCESSORIES" },
  { slug: "outerwear", label: "OUTERWEAR" },
];

/** Category accent used for swatch-dot / editorial moments only. */
export const CATEGORY_ACCENT: Record<Category, string> = {
  APPAREL: "#ed1aa0",
  FOOTWEAR: "#0a7281",
  ACCESSORIES: "#beaffd",
  OUTERWEAR: "#4c012d",
};

// ============================================================================
// IMAGES — HOW THE STOCK PHOTOS WORK (READ THIS)
// ============================================================================
//
// Today every image is real Nike product photography, downloaded to
// public/images/ and resolved through IMAGE_MAP below (© Nike Inc., used
// here only as demo placeholders — replace them before shipping anything).
//
// You can swap ANY image for your own without touching components:
//
//   1. Put your file inside the  public/images/  folder, e.g.
//        public/images/ab-01.jpg
//      (anything in /public is served at the matching URL, so that file
//      becomes  /images/ab-01.jpg). Local files need NO config and have NO
//      size limit — files outside /public are not reachable.
//
//   2. Change the matching line in the IMAGE_MAP below:
//        "ab-01": "/images/ab-01.jpg",
//
//   Every slot that is NOT in the map keeps its random stock fallback
//   (picsum.photos). So you can replace one photo or all of them, one line
//   at a time.
//
//   SLOT NAMES
//   ----------
//   Products        ab-01 .. ab-26            main/cover photo (cards, PDP, cart)
//                   ab-01-2, ab-01-3          extra angles on the product page
//                   ab-01-4                   optional 4th angle on the product page
//   Homepage hero   hero-home                 1920x1080+ wide campaign shot
//   Category tiles  category-apparel, category-footwear,
//                   category-accessories, category-outerwear   800x1000 (4:5)
//   Seller pages    seller-s1 .. seller-s5    1920x1080+ hero
//
//   RECOMMENDED SIZES
//   -----------------
//   Products:  square 1200x1200+, JPG/WebP. Cards show a 1:1 crop.
//   Heroes / tiles: 1920x1080+ and 800x1000 as above.
//   (next/image optimizes and downscales automatically, so large is fine.)
// ============================================================================

/** Simple stock-photo URL. `placeholder("seed", 1200, 1200)` -> a random photo. */
export const placeholder = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

/**
 * IMAGE_MAP — your own images, keyed by slot name.
 *
 * Example: drop a photo at `public/images/ab-01.jpg` and add
 *   "ab-01": "/images/ab-01.jpg",
 * (paths can also be full https:// URLs if you prefer a CDN like Cloudinary).
 */
export const IMAGE_MAP: Record<string, string> = {
  // --- Product photos --------------------------------------------------
  // Raw Nike product photography downloaded to public/images/. The -2/-3/-4
  // "angle" slots reuse the cover, so the PDP gallery shows one clean shot.
  "ab-01": "/images/ab-01.png",
  "ab-01-2": "/images/ab-01.png",
  "ab-01-3": "/images/ab-01.png",
  "ab-01-4": "/images/ab-01.png",
  "ab-02": "/images/ab-02.png",
  "ab-02-2": "/images/ab-02.png",
  "ab-02-3": "/images/ab-02.png",
  "ab-02-4": "/images/ab-02.png",
  "ab-03": "/images/ab-03.png",
  "ab-03-2": "/images/ab-03.png",
  "ab-03-3": "/images/ab-03.png",
  "ab-03-4": "/images/ab-03.png",
  "ab-04": "/images/ab-04.png",
  "ab-04-2": "/images/ab-04.png",
  "ab-04-3": "/images/ab-04.png",
  "ab-04-4": "/images/ab-04.png",
  "ab-05": "/images/ab-05.png",
  "ab-05-2": "/images/ab-05.png",
  "ab-05-3": "/images/ab-05.png",
  "ab-05-4": "/images/ab-05.png",
  "ab-06": "/images/ab-06.png",
  "ab-06-2": "/images/ab-06.png",
  "ab-06-3": "/images/ab-06.png",
  "ab-06-4": "/images/ab-06.png",
  "ab-07": "/images/ab-07.png",
  "ab-07-2": "/images/ab-07.png",
  "ab-07-3": "/images/ab-07.png",
  "ab-07-4": "/images/ab-07.png",
  "ab-08": "/images/ab-08.png",
  "ab-08-2": "/images/ab-08.png",
  "ab-08-3": "/images/ab-08.png",
  "ab-08-4": "/images/ab-08.png",
  "ab-09": "/images/ab-09.png",
  "ab-09-2": "/images/ab-09.png",
  "ab-09-3": "/images/ab-09.png",
  "ab-09-4": "/images/ab-09.png",
  "ab-10": "/images/ab-10.png",
  "ab-10-2": "/images/ab-10.png",
  "ab-10-3": "/images/ab-10.png",
  "ab-10-4": "/images/ab-10.png",
  "ab-11": "/images/ab-11.png",
  "ab-11-2": "/images/ab-11.png",
  "ab-11-3": "/images/ab-11.png",
  "ab-11-4": "/images/ab-11.png",
  "ab-12": "/images/ab-12.png",
  "ab-12-2": "/images/ab-12.png",
  "ab-12-3": "/images/ab-12.png",
  "ab-12-4": "/images/ab-12.png",
  "ab-13": "/images/ab-13.png",
  "ab-13-2": "/images/ab-13.png",
  "ab-13-3": "/images/ab-13.png",
  "ab-13-4": "/images/ab-13.png",
  "ab-14": "/images/ab-14.png",
  "ab-14-2": "/images/ab-14.png",
  "ab-14-3": "/images/ab-14.png",
  "ab-14-4": "/images/ab-14.png",
  "ab-15": "/images/ab-15.png",
  "ab-15-2": "/images/ab-15.png",
  "ab-15-3": "/images/ab-15.png",
  "ab-15-4": "/images/ab-15.png",
  "ab-16": "/images/ab-16.png",
  "ab-16-2": "/images/ab-16.png",
  "ab-16-3": "/images/ab-16.png",
  "ab-16-4": "/images/ab-16.png",
  "ab-17": "/images/ab-17.png",
  "ab-17-2": "/images/ab-17.png",
  "ab-17-3": "/images/ab-17.png",
  "ab-17-4": "/images/ab-17.png",
  "ab-18": "/images/ab-18.png",
  "ab-18-2": "/images/ab-18.png",
  "ab-18-3": "/images/ab-18.png",
  "ab-18-4": "/images/ab-18.png",
  "ab-19": "/images/ab-19.png",
  "ab-19-2": "/images/ab-19.png",
  "ab-19-3": "/images/ab-19.png",
  "ab-19-4": "/images/ab-19.png",
  "ab-20": "/images/ab-20.png",
  "ab-20-2": "/images/ab-20.png",
  "ab-20-3": "/images/ab-20.png",
  "ab-20-4": "/images/ab-20.png",
  "ab-21": "/images/ab-21.png",
  "ab-21-2": "/images/ab-21.png",
  "ab-21-3": "/images/ab-21.png",
  "ab-21-4": "/images/ab-21.png",
  "ab-22": "/images/ab-22.png",
  "ab-22-2": "/images/ab-22.png",
  "ab-22-3": "/images/ab-22.png",
  "ab-22-4": "/images/ab-22.png",
  "ab-23": "/images/ab-23.png",
  "ab-23-2": "/images/ab-23.png",
  "ab-23-3": "/images/ab-23.png",
  "ab-23-4": "/images/ab-23.png",
  "ab-24": "/images/ab-24.png",
  "ab-24-2": "/images/ab-24.png",
  "ab-24-3": "/images/ab-24.png",
  "ab-24-4": "/images/ab-24.png",
  "ab-25": "/images/ab-25.png",
  "ab-25-2": "/images/ab-25.png",
  "ab-25-3": "/images/ab-25.png",
  "ab-25-4": "/images/ab-25.png",
  "ab-26": "/images/ab-26.png",
  "ab-26-2": "/images/ab-26.png",
  "ab-26-3": "/images/ab-26.png",
  "ab-26-4": "/images/ab-26.png",

  // --- Editorial (homepage / seller pages) ------------------------------
  "hero-home": "/images/hero-home.png",
  "category-apparel": "/images/category-apparel.png",
  "category-footwear": "/images/category-footwear.png",
  "category-accessories": "/images/category-accessories.png",
  "category-outerwear": "/images/category-outerwear.png",
  "seller-s1": "/images/seller-s1.png",
  "seller-s2": "/images/seller-s2.png",
  "seller-s3": "/images/seller-s3.png",
  "seller-s4": "/images/seller-s4.png",
  "seller-s5": "/images/seller-s5.png",
};

/**
 * Resolves an image slot to a real URL.
 * Returns the value from IMAGE_MAP when you have set one, otherwise the
 * random stock fallback. Called automatically — you usually don't edit it.
 */
export const asset = (slot: string, fallback: string) =>
  IMAGE_MAP[slot] ?? fallback;

const img = (id: string, variant: number, w: number, h: number) =>
  placeholder(`${id}-${variant}`, w, h);

export const SELLERS: Seller[] = [
  {
    id: "s1",
    name: "MAISON NOIR",
    handle: "maisonnoir",
    location: "Antwerp, BE",
    founded: "2017",
    about:
      "Tailoring which disappears into the body. Cut from the last piece of cloth on the bolt.",
    aboutFr:
      "Une coupe qui disparaît dans le corps. Taillée dans la dernière pièce du coupon.",
  },
  {
    id: "s2",
    name: "OBSIDIAN SUPPLY",
    handle: "obsidiansupply",
    location: "Brooklyn, US",
    founded: "2019",
    about:
      "Technical garments built for the last hour of daylight. Hardware machined, never stamped.",
    aboutFr:
      "Des pièces techniques nées pour la dernière heure de lumière. Quincaillerie usinée, jamais frappée.",
  },
  {
    id: "s3",
    name: "ATELIER ORFEU",
    handle: "atelierorfeu",
    location: "Lisbon, PT",
    founded: "2020",
    about:
      "Clothing made to be worn like architecture — flat seams, standing silhouettes, no ornament.",
    aboutFr:
      "Des vêtements portés comme une architecture — coutures plates, silhouettes debout, zéro ornement.",
  },
  {
    id: "s4",
    name: "DEAD STOCK",
    handle: "deadstock",
    location: "London, UK",
    founded: "2015",
    about:
      "Unissued deadstock from closed mills, cleaned and recut one piece at a time.",
    aboutFr:
      "Stock mort de fabriques fermées, nettoyé et retaillé à l'unité.",
  },
  {
    id: "s5",
    name: "VELVET HOUR",
    handle: "velvethour",
    location: "Seoul, KR",
    founded: "2021",
    about:
      "Quiet basics in the hours after midnight. Heavy fabric, no print, nothing to remove.",
    aboutFr:
      "Des essentiels calmes pour les heures d'après minuit. Tissu lourd, pas d'impression, rien à retirer.",
  },
];

/**
 * Department + subcategory taxonomy. Subcategories live under one category,
 * and UNISEX products appear in both the Women and Men views. Keyed by slug
 * so the nav and /category/[slug] can index it directly.
 */
export const SUBCATEGORIES_BY_CATEGORY: Record<CategorySlug, string[]> = {
  apparel: ["tees", "shirts", "tops", "trousers", "skirts", "hoodies"],
  footwear: ["sneakers", "derbies", "boots", "sandals"],
  accessories: [
    "bags",
    "headwear",
    "belts",
    "scarves",
    "jewelry",
    "small-goods",
  ],
  outerwear: ["coats", "jackets", "parkas"],
};

/** Per-product classification (kept above RAW_PRODUCTS to stay easy to tweak). */
const PRODUCT_CLASS: Record<
  string,
  { gender: Gender; subcategory: string }
> = {
  "ab-01": { gender: "UNISEX", subcategory: "tees" },
  "ab-02": { gender: "UNISEX", subcategory: "trousers" },
  "ab-03": { gender: "WOMEN", subcategory: "tops" },
  "ab-04": { gender: "MEN", subcategory: "shirts" },
  "ab-05": { gender: "MEN", subcategory: "tees" },
  "ab-06": { gender: "WOMEN", subcategory: "skirts" },
  "ab-07": { gender: "WOMEN", subcategory: "tops" },
  "ab-08": { gender: "UNISEX", subcategory: "hoodies" },
  "ab-09": { gender: "MEN", subcategory: "derbies" },
  "ab-10": { gender: "UNISEX", subcategory: "sneakers" },
  "ab-11": { gender: "MEN", subcategory: "boots" },
  "ab-12": { gender: "UNISEX", subcategory: "sandals" },
  "ab-13": { gender: "MEN", subcategory: "derbies" },
  "ab-14": { gender: "UNISEX", subcategory: "bags" },
  "ab-15": { gender: "UNISEX", subcategory: "bags" },
  "ab-16": { gender: "UNISEX", subcategory: "small-goods" },
  "ab-17": { gender: "UNISEX", subcategory: "headwear" },
  "ab-18": { gender: "UNISEX", subcategory: "scarves" },
  "ab-19": { gender: "UNISEX", subcategory: "belts" },
  "ab-20": { gender: "UNISEX", subcategory: "jewelry" },
  "ab-21": { gender: "UNISEX", subcategory: "coats" },
  "ab-22": { gender: "MEN", subcategory: "jackets" },
  "ab-23": { gender: "WOMEN", subcategory: "coats" },
  "ab-24": { gender: "UNISEX", subcategory: "parkas" },
  "ab-25": { gender: "WOMEN", subcategory: "coats" },
  "ab-26": { gender: "MEN", subcategory: "jackets" },
};

/**
 * The raw catalogue data. Each product lists a few picsum URLs under
 * `imageUrls` — see the IMAGES section above to swap them for your own files.
 */
const RAW_PRODUCTS: Omit<Product, "gender" | "subcategory">[] = [
  {
    id: "ab-01",
    name: "OBSCURA TEE",
    description: "Garment-dyed heavyweight tee with a raw, unfinished hem.",
    descriptionFr:
      "Tee-shirt épais teint au vêtement, ourlet brut et non fini.",
    price: 120,
    sellerId: "s1",
    sellerName: "MAISON NOIR",
    category: "APPAREL",
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrls: [img("ab-01", 1, 1200, 1200), img("ab-01", 2, 1200, 1200), img("ab-01", 3, 1200, 1200)],
    swatches: ["#111111", "#707072", "#f5f5f5"],
    promo: "justIn",
    reviews: 4,
  },
  {
    id: "ab-02",
    name: "MONO TROUSER, NO. 4",
    description: "Wide-leg cotton twill trouser cut from a single continuous line.",
    descriptionFr:
      "Pantalon large en twill de coton taillé d'un seul tenant.",
    price: 260,
    sellerId: "s1",
    sellerName: "MAISON NOIR",
    category: "APPAREL",
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrls: [img("ab-02", 1, 1200, 1200), img("ab-02", 2, 1200, 1200), img("ab-02", 3, 1200, 1200)],
    swatches: ["#111111", "#39393b", "#9e9ea0"],
    promo: "justIn",
    reviews: 7,
  },
  {
    id: "ab-03",
    name: "BODY TANK",
    description: "Bias-cut tank that falls away from the body and does not return.",
    descriptionFr:
      "Débardeur coupé en biais qui s'écarte du corps sans y revenir.",
    price: 90,
    sellerId: "s3",
    sellerName: "ATELIER ORFEU",
    category: "APPAREL",
    sizes: ["XS", "S", "M", "L"],
    imageUrls: [img("ab-03", 1, 1200, 1200), img("ab-03", 2, 1200, 1200), img("ab-03", 3, 1200, 1200)],
    swatches: ["#f5f5f5", "#111111", "#beaffd"],
    reviews: 2,
  },
  {
    id: "ab-04",
    name: "DRILL SHIRT",
    description: "Stiff cotton drill overshirt with tarnished brass snaps.",
    descriptionFr:
      "Chemise de travail en drill raide, boutons-pression en laiton terni.",
    price: 180,
    sellerId: "s4",
    sellerName: "DEAD STOCK",
    category: "APPAREL",
    sizes: ["S", "M", "L", "XL"],
    imageUrls: [img("ab-04", 1, 1200, 1200), img("ab-04", 2, 1200, 1200), img("ab-04", 3, 1200, 1200)],
    swatches: ["#4b4b4d", "#111111", "#9e9ea0"],
    promo: "limited",
    reviews: 9,
  },
  {
    id: "ab-05",
    name: "BASIN POLO",
    description: "Heavy three-fold jersey polo with a deep vented hem.",
    descriptionFr:
      "Polo en jersey lourd triple épaisseur, ourlet à fente profonde.",
    price: 150,
    originalPrice: 220,
    sellerId: "s5",
    sellerName: "VELVET HOUR",
    category: "APPAREL",
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrls: [img("ab-05", 1, 1200, 1200), img("ab-05", 2, 1200, 1200), img("ab-05", 3, 1200, 1200)],
    swatches: ["#111111", "#4c012d", "#f5f5f5"],
    reviews: 12,
  },
  {
    id: "ab-06",
    name: "PLEAT SKIRT, LONG",
    description: "Closed accordion pleat worn past the ankle.",
    descriptionFr:
      "Jupe à plis accordéon fermés, portée sous la cheville.",
    price: 220,
    originalPrice: 265,
    sellerId: "s1",
    sellerName: "MAISON NOIR",
    category: "APPAREL",
    sizes: ["XS", "S", "M", "L"],
    imageUrls: [img("ab-06", 1, 1200, 1200), img("ab-06", 2, 1200, 1200), img("ab-06", 3, 1200, 1200)],
    swatches: ["#111111", "#9e9ea0", "#f5f5f5"],
    reviews: 5,
  },
  {
    id: "ab-07",
    name: "SABLE SHELL TOP",
    description: "Water-repellent shell top built for late-season layering.",
    descriptionFr:
      "Haut coquille déperlant pour les superpositions de fin de saison.",
    price: 195,
    sellerId: "s2",
    sellerName: "OBSIDIAN SUPPLY",
    category: "APPAREL",
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrls: [img("ab-07", 1, 1200, 1200), img("ab-07", 2, 1200, 1200), img("ab-07", 3, 1200, 1200)],
    swatches: ["#0a7281", "#111111", "#4b4b4d"],
    reviews: 3,
  },
  {
    id: "ab-08",
    name: "JERSEY HOOD",
    description: "Mid-weight loopback hood. No drawcords, no print.",
    descriptionFr:
      "Capuche en maille bouclée mi-chemin. Pas de cordons, pas d'impression.",
    price: 140,
    sellerId: "s5",
    sellerName: "VELVET HOUR",
    category: "APPAREL",
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrls: [img("ab-08", 1, 1200, 1200), img("ab-08", 2, 1200, 1200), img("ab-08", 3, 1200, 1200)],
    swatches: ["#111111", "#f5f5f5", "#707072"],
    promo: "justIn",
    reviews: 8,
  },
  {
    id: "ab-09",
    name: "RIDGE DERBY",
    description: "Hand-burnished calf derby on a stacked wedge sole.",
    descriptionFr:
      "Derby en veau bruni à la main, semelle compensée empilée.",
    price: 340,
    originalPrice: 380,
    sellerId: "s2",
    sellerName: "OBSIDIAN SUPPLY",
    category: "FOOTWEAR",
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
    imageUrls: [img("ab-09", 1, 1200, 1200), img("ab-09", 2, 1200, 1200), img("ab-09", 3, 1200, 1200)],
    swatches: ["#39393b", "#111111", "#9e9ea0"],
    reviews: 14,
  },
  {
    id: "ab-10",
    name: "MONO RUNNER",
    description: "Molded-midsole runner finished in a single tone.",
    descriptionFr:
      "Runner à semelle intermédiaire moulée, finition monochrome.",
    price: 290,
    sellerId: "s4",
    sellerName: "DEAD STOCK",
    category: "FOOTWEAR",
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
    imageUrls: [img("ab-10", 1, 1200, 1200), img("ab-10", 2, 1200, 1200), img("ab-10", 3, 1200, 1200)],
    swatches: ["#111111", "#f5f5f5", "#beaffd"],
    promo: "limited",
    reviews: 6,
  },
  {
    id: "ab-11",
    name: "FOLD BOOT",
    description: "Zigzag-stitched ankle boot with a fold-down shaft.",
    descriptionFr:
      "Bottine à tige repliable, coutures en zigzag.",
    price: 420,
    sellerId: "s1",
    sellerName: "MAISON NOIR",
    category: "FOOTWEAR",
    sizes: ["39", "40", "41", "42", "43", "44"],
    imageUrls: [img("ab-11", 1, 1200, 1200), img("ab-11", 2, 1200, 1200), img("ab-11", 3, 1200, 1200)],
    swatches: ["#111111", "#39393b", "#4c012d"],
    promo: "comingSoon",
    reviews: 1,
  },
  {
    id: "ab-12",
    name: "SLAB SLIDE",
    description: "One-piece molded slide. Zero hardware, one gesture.",
    descriptionFr:
      "Mule moulée d'une seule pièce. Zéro accessoire, un seul geste.",
    price: 160,
    originalPrice: 210,
    sellerId: "s5",
    sellerName: "VELVET HOUR",
    category: "FOOTWEAR",
    sizes: ["38", "39", "40", "41", "42", "43", "44", "45"],
    imageUrls: [img("ab-12", 1, 1200, 1200), img("ab-12", 2, 1200, 1200), img("ab-12", 3, 1200, 1200)],
    swatches: ["#111111", "#0a7281", "#f5f5f5"],
    reviews: 3,
  },
  {
    id: "ab-13",
    name: "HALT OXFORD",
    description: "Blind-eyelet cap-toe oxford cut from deadstock grain.",
    descriptionFr:
      "Oxford à capuchon et œillets invisibles, cuir grain récupéré.",
    price: 310,
    sellerId: "s4",
    sellerName: "DEAD STOCK",
    category: "FOOTWEAR",
    sizes: ["39", "40", "41", "42", "43", "44", "45"],
    imageUrls: [img("ab-13", 1, 1200, 1200), img("ab-13", 2, 1200, 1200), img("ab-13", 3, 1200, 1200)],
    swatches: ["#111111", "#4b4b4d", "#9e9ea0"],
    promo: "justIn",
    reviews: 11,
  },
  {
    id: "ab-14",
    name: "HALO BAG",
    description: "Soft trapezoid shoulder bag with a floating handle.",
    descriptionFr:
      "Sac bandoulière trapézoïdal souple à anse flottante.",
    price: 380,
    sellerId: "s1",
    sellerName: "MAISON NOIR",
    category: "ACCESSORIES",
    sizes: ["ONE SIZE"],
    imageUrls: [img("ab-14", 1, 1200, 1200), img("ab-14", 2, 1200, 1200), img("ab-14", 3, 1200, 1200)],
    swatches: ["#111111", "#beaffd", "#f5f5f5"],
    reviews: 5,
  },
  {
    id: "ab-15",
    name: "POUCH, CINCHED",
    description: "Drawstring pouch stitched from re-cut leather remnants.",
    descriptionFr:
      "Pochette à cordon cousue de chutes de cuir découpées.",
    price: 170,
    sellerId: "s3",
    sellerName: "ATELIER ORFEU",
    category: "ACCESSORIES",
    sizes: ["ONE SIZE"],
    imageUrls: [img("ab-15", 1, 1200, 1200), img("ab-15", 2, 1200, 1200), img("ab-15", 3, 1200, 1200)],
    swatches: ["#4b4b4d", "#f5f5f5", "#111111"],
    reviews: 0,
  },
  {
    id: "ab-16",
    name: "BRASS CLIP, SET OF 3",
    description: "Solid brass trouser clips, left raw.",
    descriptionFr:
      "Pinces à pantalon en laiton massif, laissées brutes.",
    price: 60,
    originalPrice: 75,
    sellerId: "s4",
    sellerName: "DEAD STOCK",
    category: "ACCESSORIES",
    sizes: ["ONE SIZE"],
    imageUrls: [img("ab-16", 1, 1200, 1200), img("ab-16", 2, 1200, 1200), img("ab-16", 3, 1200, 1200)],
    swatches: ["#beaffd", "#9e9ea0", "#111111"],
    reviews: 2,
  },
  {
    id: "ab-17",
    name: "WIDE-BRIM CAP",
    description: "Stiffened wide-brimmed cap with a raw under-rim.",
    descriptionFr:
      "Casquette rigide à large visière, bord brut.",
    price: 130,
    sellerId: "s2",
    sellerName: "OBSIDIAN SUPPLY",
    category: "ACCESSORIES",
    sizes: ["ONE SIZE"],
    imageUrls: [img("ab-17", 1, 1200, 1200), img("ab-17", 2, 1200, 1200), img("ab-17", 3, 1200, 1200)],
    swatches: ["#0a7281", "#111111", "#f5f5f5"],
    promo: "limited",
    reviews: 4,
  },
  {
    id: "ab-18",
    name: "GRID SCARF",
    description: "Oversized wool-cashmere scarf in a shadow grid.",
    descriptionFr:
      "Grand foulard laine-cachemire à grille d'ombre.",
    price: 150,
    sellerId: "s5",
    sellerName: "VELVET HOUR",
    category: "ACCESSORIES",
    sizes: ["ONE SIZE"],
    imageUrls: [img("ab-18", 1, 1200, 1200), img("ab-18", 2, 1200, 1200), img("ab-18", 3, 1200, 1200)],
    swatches: ["#39393b", "#f5f5f5", "#111111"],
    reviews: 6,
  },
  {
    id: "ab-19",
    name: "CARRIER BELT",
    description: "Webbed belt with a machined zinc buckle.",
    descriptionFr:
      "Ceinture en sangle à boucle usinée en zinc.",
    price: 190,
    sellerId: "s2",
    sellerName: "OBSIDIAN SUPPLY",
    category: "ACCESSORIES",
    sizes: ["S", "M", "L"],
    imageUrls: [img("ab-19", 1, 1200, 1200), img("ab-19", 2, 1200, 1200), img("ab-19", 3, 1200, 1200)],
    swatches: ["#111111", "#4b4b4d", "#9e9ea0"],
    reviews: 1,
  },
  {
    id: "ab-20",
    name: "OBELISK CHAIN",
    description: "Hand-joined silvered chain. One length only.",
    descriptionFr:
      "Chaîne argentée assemblée à la main. Une seule longueur.",
    price: 210,
    sellerId: "s3",
    sellerName: "ATELIER ORFEU",
    category: "ACCESSORIES",
    sizes: ["ONE SIZE"],
    imageUrls: [img("ab-20", 1, 1200, 1200), img("ab-20", 2, 1200, 1200), img("ab-20", 3, 1200, 1200)],
    swatches: ["#9e9ea0", "#f5f5f5", "#111111"],
    promo: "recycled",
    reviews: 3,
  },
  {
    id: "ab-21",
    name: "VOID COAT",
    description: "Double-faced wool coat. No collar, no buttons, one inner strap.",
    descriptionFr:
      "Manteau en laine double face. Pas de col, pas de boutons, une sangle intérieure.",
    price: 520,
    sellerId: "s1",
    sellerName: "MAISON NOIR",
    category: "OUTERWEAR",
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrls: [img("ab-21", 1, 1200, 1200), img("ab-21", 2, 1200, 1200), img("ab-21", 3, 1200, 1200)],
    swatches: ["#111111", "#39393b", "#f5f5f5"],
    reviews: 8,
  },
  {
    id: "ab-22",
    name: "FIELD JACKET",
    description: "Four-pocket field jacket in waxed canvas.",
    descriptionFr:
      "Veste de terrain à quatre poches en toile cirée.",
    price: 360,
    sellerId: "s2",
    sellerName: "OBSIDIAN SUPPLY",
    category: "OUTERWEAR",
    sizes: ["S", "M", "L", "XL"],
    imageUrls: [img("ab-22", 1, 1200, 1200), img("ab-22", 2, 1200, 1200), img("ab-22", 3, 1200, 1200)],
    swatches: ["#4b4b4d", "#111111", "#9e9ea0"],
    reviews: 10,
  },
  {
    id: "ab-23",
    name: "TENCH COAT",
    description: "Vintage military raincoat, copper-toned throughout.",
    descriptionFr:
      "Imperméable militaire vintage, teinte cuivrée.",
    price: 440,
    originalPrice: 545,
    sellerId: "s4",
    sellerName: "DEAD STOCK",
    category: "OUTERWEAR",
    sizes: ["S", "M", "L"],
    imageUrls: [img("ab-23", 1, 1200, 1200), img("ab-23", 2, 1200, 1200), img("ab-23", 3, 1200, 1200)],
    swatches: ["#4c012d", "#39393b", "#111111"],
    reviews: 15,
  },
  {
    id: "ab-24",
    name: "PARKA 01",
    description: "Three-quarter parka in matte nylon with taped seams.",
    descriptionFr:
      "Parka trois quarts en nylon mat, coutures thermocollées.",
    price: 390,
    sellerId: "s5",
    sellerName: "VELVET HOUR",
    category: "OUTERWEAR",
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrls: [img("ab-24", 1, 1200, 1200), img("ab-24", 2, 1200, 1200), img("ab-24", 3, 1200, 1200)],
    swatches: ["#111111", "#0a7281", "#f5f5f5"],
    promo: "justIn",
    reviews: 7,
  },
  {
    id: "ab-25",
    name: "TOGA WRAP",
    description: "Wrapped overcoat cut from a single panel of cloth.",
    descriptionFr:
      "Manteau enveloppant taillé dans un seul pan de tissu.",
    price: 480,
    sellerId: "s3",
    sellerName: "ATELIER ORFEU",
    category: "OUTERWEAR",
    sizes: ["S", "M", "L"],
    imageUrls: [img("ab-25", 1, 1200, 1200), img("ab-25", 2, 1200, 1200), img("ab-25", 3, 1200, 1200)],
    swatches: ["#beaffd", "#f5f5f5", "#111111"],
    promo: "comingSoon",
    reviews: 0,
  },
  {
    id: "ab-26",
    name: "GUST JACKET",
    description: "Ultralight ripstop shell in a single dark tone.",
    descriptionFr:
      "Veste ultralégère en ripstop, un seul ton sombre.",
    price: 300,
    sellerId: "s1",
    sellerName: "MAISON NOIR",
    category: "OUTERWEAR",
    sizes: ["XS", "S", "M", "L", "XL"],
    imageUrls: [img("ab-26", 1, 1200, 1200), img("ab-26", 2, 1200, 1200), img("ab-26", 3, 1200, 1200)],
    swatches: ["#111111", "#4b4b4d", "#f5f5f5"],
    promo: "recycled",
    reviews: 6,
  },
];
// Map every product photo through `asset()` so IMAGE_MAP can override it:
// imageUrls[0] -> slot "ab-01" (cover), imageUrls[1] -> "ab-01-2", etc.
export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({
  ...p,
  ...PRODUCT_CLASS[p.id],
  imageUrls: p.imageUrls.map((url, i) =>
    asset(i === 0 ? p.id : `${p.id}-${i + 1}`, url)
  ),
}));

/** Featured objects used in the homepage "Trending Now" rail. */
export const FEATURED_IDS = [
  "ab-21",
  "ab-09",
  "ab-05",
  "ab-10",
  "ab-13",
  "ab-14",
  "ab-22",
  "ab-18",
];

export const formatPrice = (n: number) =>
  "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const ALL_SIZES = Array.from(
  new Set(PRODUCTS.flatMap((p) => p.sizes))
).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

/** [ALL] [UNDER $150] [$150 – $299] [$300+] */
export const PRICE_BANDS: { min: number | null; max: number | null }[] = [
  { min: null, max: null },
  { min: null, max: 149 },
  { min: 150, max: 299 },
  { min: 300, max: null },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);
export const getSeller = (id: string) => SELLERS.find((s) => s.id === id);
export const getAllProductIds = () => PRODUCTS.map((p) => p.id);
export const getSellerProducts = (sellerId: string) =>
  PRODUCTS.filter((p) => p.sellerId === sellerId);
export const getProductsByCategory = (label: Category) =>
  PRODUCTS.filter((p) => p.category === label);

/** UNISEX products count toward both Women and Men (department-store rule). */
export const getByDepartment = (
  slug: CategorySlug | "ALL",
  gender: Exclude<Gender, "UNISEX">
) =>
  PRODUCTS.filter(
    (p) =>
      (slug === "ALL" || p.category === CAT_SLUG_TO_LABEL[slug]) &&
      (p.gender === gender || p.gender === "UNISEX")
  );

export const getBySubcategory = (slug: CategorySlug, sub: string) =>
  PRODUCTS.filter(
    (p) => p.category === CAT_SLUG_TO_LABEL[slug] && p.subcategory === sub
  );

export const getRelated = (product: Product, n = 8) => {
  const same = PRODUCTS.filter(
    (p) => p.id !== product.id && p.category === product.category
  );
  const rest = PRODUCTS.filter(
    (p) => p.id !== product.id && p.category !== product.category
  );
  return [...same, ...rest].slice(0, n);
};

export const searchProducts = (q: string) => {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.descriptionFr.toLowerCase().includes(term) ||
      p.sellerName.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
  );
};