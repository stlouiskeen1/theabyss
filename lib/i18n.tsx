"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Lang = "en" | "fr";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

type Vars = Record<string, string | number>;

const en = {
  "utility.help": "Help",
  "utility.join": "Join Us",
  "utility.seller": "Become a Seller",
  "utility.language": "Language",
  "utility.demoNotice":
    "Demo store — accounts and payments aren't connected yet.",

  "nav.menu": "Menu",
  "nav.close": "Close",
  "nav.search": "Search",
  "nav.searchPlaceholder": "Search",
  "nav.bag": "Bag",
  "nav.all": "All",

  "category.all": "All",
  "category.apparel": "Apparel",
  "category.footwear": "Footwear",
  "category.accessories": "Accessories",
  "category.outerwear": "Outerwear",

  "gender.WOMEN": "Women",
  "gender.MEN": "Men",
  "gender.UNISEX": "All",

  "sub.tees": "Tees & Polos",
  "sub.shirts": "Shirts",
  "sub.tops": "Tops & Tanks",
  "sub.trousers": "Trousers",
  "sub.skirts": "Skirts",
  "sub.hoodies": "Hoodies & Sweats",
  "sub.sneakers": "Sneakers",
  "sub.derbies": "Derbies & Oxfords",
  "sub.boots": "Boots",
  "sub.sandals": "Sandals & Slides",
  "sub.bags": "Bags & Pouches",
  "sub.headwear": "Headwear",
  "sub.belts": "Belts",
  "sub.scarves": "Scarves",
  "sub.jewelry": "Jewelry",
  "sub.small-goods": "Small Goods",
  "sub.coats": "Coats",
  "sub.jackets": "Jackets",
  "sub.parkas": "Parkas",

"nav.shop": "Shop",
  "nav.designedFor": "Designed for",
  "nav.viewAll": "View All {cat}",
  "nav.allShop": "Shop Everything",
  "nav.subLabel": "Subcategory",

  "hero.title": "DRESS THE VOID",
  "hero.subtitle": "Objects from local sellers, photographed at the surface.",
  "hero.cta": "Shop All",

  "home.trending": "Trending Now",
  "home.shopByCategory": "Shop by Category",
  "home.latest": "Latest in the Catalogue",
  "home.viewAll": "View All",
  "home.shop": "Shop",
  "home.loadMore": "Load More",
  "home.end": "End of Catalogue",
  "home.noResults": "No objects match.",
  "home.clear": "Clear",

  "plp.resultOne": "object",
  "plp.results": "objects",
  "plp.hideFilters": "Hide Filters",
  "plp.showFilters": "Show Filters",
  "plp.sortBy": "Sort By",
  "plp.sortFeatured": "Featured",
  "plp.sortPriceLow": "Price: Low to High",
  "plp.sortPriceHigh": "Price: High to Low",
  "plp.sortNewest": "Newest",
  "plp.clearAll": "Clear all",
  "plp.noResultsTitle": "Nothing matches those filters.",
  "plp.noResultsDesc": "Try removing a filter or two to widen the search.",
  "plp.clearFilters": "Clear filters",
  "plp.category": "Category",
  "plp.size": "Size",
  "plp.price": "Price",
  "plp.sellers": "Sellers",
  "plp.promo": "Promo",
  "plp.any": "Any",
  "plp.subcategory": "Subcategory",
  "plp.gender": "Gender",

  "price.all": "All",
  "price.b1": "Under $150",
  "price.b2": "$150 – $299",
  "price.b3": "$300+",

  "pdp.by": "By {seller}",
  "pdp.size": "Size",
  "pdp.swatch": "Colorway {n}",
  "pdp.colorway": "Colorway",
  "pdp.selectSize": "Select Size",
  "pdp.quantity": "Quantity",
  "pdp.addToCart": "Add to Cart",
  "pdp.sizeHint": "Please select a size",
  "pdp.details": "View Product Details",
  "pdp.shipping": "Shipping & Returns",
  "pdp.reviews": "Reviews",
  "pdp.noReviews":
    "No reviews yet — be the first to give this object a voice.",
  "pdp.shipText":
    "Ships within 24 hours from the seller's studio. Returns accepted for 30 days if the object remains unworn.",
  "pdp.related": "Complete the Look",
  "pdp.mockNote": "Mock store — no payment is taken.",
  "pdp.materials": "Materials",
  "pdp.soldBy": "Sold by",
  "pdp.est": "Est. {year}",
  "pdp.inStock": "In stock",
  "pdp.reviewCount": "{n} reviews",

  "cart.title": "Bag",
  "cart.count": "Bag ({n})",
  "cart.close": "Close",
  "cart.emptyTitle": "Your bag is empty.",
  "cart.emptyDesc": "Objects wait below.",
  "cart.viewCatalogue": "View Catalogue",
  "cart.viewBag": "View Bag",
  "cart.subtotal": "Subtotal",
  "cart.subtotalNote": "Delivery to Algeria added at checkout.",
  "cart.checkout": "Checkout",
  "cart.remove": "Remove",
  "cart.emptyCart": "Empty bag",
  "cart.freeDelivery": "Free delivery",
  "cart.deliveryHint": "Delivery {fee} · free over {freeOver}",
  "cart.continue": "Continue Shopping",
  "cart.inc": "Increase quantity",
  "cart.dec": "Decrease quantity",

  "wishlist.title": "Wishlist",
  "wishlist.toggle": "Toggle wishlist",
  "wishlist.count": "Saved objects ({n})",
  "wishlist.clear": "Clear wishlist",
  "wishlist.remove": "Remove",
  "wishlist.view": "View",
  "wishlist.emptyTitle": "Nothing saved yet.",
  "wishlist.emptyDesc": "Tap the heart on any object to keep it here for later.",

  "checkout.title": "Checkout",
  "checkout.back": "Back to Bag",
  "checkout.emptyTitle": "Nothing to check out.",
  "checkout.emptyDesc": "Your bag is empty — objects wait below.",
  "checkout.browse": "Browse the Catalogue",
  "checkout.contact": "Contact",
  "checkout.delivery": "Delivery",
  "checkout.payment": "Payment",
  "checkout.fullName": "Full name",
  "checkout.phone": "Phone",
  "checkout.wilaya": "Wilaya",
  "checkout.commune": "Commune",
  "checkout.address": "Street address",
  "checkout.phonePlaceholder": "0550 12 34 56",
  "checkout.phoneHint": "Algerian mobile, e.g. 0550 12 34 56",
  "checkout.selectWilaya": "Select wilaya",
  "checkout.deliveryNote": "Delivery across Algeria — all 69 wilayas.",
  "checkout.cod": "Cash on Delivery",
  "checkout.codDesc":
    "Pay the courier in cash when the order arrives. No card, no transfer, no online payment.",
  "checkout.summary": "Order Summary",
  "checkout.deliveryFee": "Delivery",
  "checkout.total": "Total",
  "checkout.free": "Free",
  "checkout.payNote": "You'll pay {total} in cash at the door.",
  "checkout.placeOrder": "Place Order",
  "checkout.errName": "Enter your full name.",
  "checkout.errPhone": "Enter a valid Algerian phone number.",
  "checkout.errWilaya": "Select your wilaya.",
  "checkout.errCommune": "Enter your commune.",
  "checkout.errAddress": "Enter your street address.",
  "checkout.doneTitle": "Order placed.",
  "checkout.doneNumber": "Order {number}",
  "checkout.doneDesc":
    "Pay {total} cash on delivery to {commune}, {wilaya}. The seller will call {phone} within 24 hours to confirm.",
  "checkout.doneHint": "Cash on delivery — keep {total} ready at the door.",
  "checkout.backHome": "Continue Shopping",
  "checkout.demo": "Demo store — no real order is placed and no money is collected.",

  "auth.signIn": "Sign In",
  "auth.signUp": "Create Account",
  "auth.signOut": "Sign Out",
  "auth.heroTitle": "Sign In",
  "auth.heroSub": "Pick up where you left off. Straight to the door.",
  "auth.signupHeroTitle": "Create Account",
  "auth.signupHeroSub": "Join ABYSS — your bag, saved. Cash on delivery, always.",
  "auth.noAccount": "New here?",
  "auth.createOne": "Create an account",
  "auth.haveAccount": "Already have an account?",
  "auth.signInInstead": "Sign in",
  "auth.name": "Full name",
  "auth.namePlaceholder": "Amazigh Kader",
  "auth.email": "Email",
  "auth.emailPlaceholder": "you@example.com",
  "auth.password": "Password",
  "auth.passwordPlaceholder": "8+ characters",
  "auth.passwordHint": "At least 8 characters.",
  "auth.confirmPassword": "Confirm password",
  "auth.confirmPasswordPlaceholder": "Repeat your password",
  "auth.submit": "Sign In",
  "auth.signupSubmit": "Create Account",
  "auth.google": "Continue with Google",
  "auth.signingIn": "Signing in…",
  "auth.or": "or",
  "auth.signedInAs": "Signed in as {name}",
  "auth.welcome": "Welcome back, {name}.",
  "auth.accountTitle": "Account",
  "auth.demoHint": "Your details live in this browser only — demo auth, nothing is stored on a server.",
  "auth.shopNow": "Continue Shopping",
  "auth.checkoutNow": "Go to Checkout",
  "auth.demoNotice":
    "Demo mode — accounts are stored in this browser only and are not secure. No real data is collected.",
  "auth.errNameRequired": "Enter your full name.",
  "auth.errNameShort": "Name must be at least 2 characters.",
  "auth.errEmailRequired": "Enter your email.",
  "auth.errEmailInvalid": "Enter a valid email address.",
  "auth.errEmailTaken": "An account with this email already exists.",
  "auth.errPasswordRequired": "Enter a password.",
  "auth.errPasswordMin": "Password must be at least 8 characters.",
  "auth.errConfirmMismatch": "Passwords do not match.",
  "auth.errInvalidCredentials": "Incorrect email or password.",

  "search.title": "Search",
  "search.results": "Results for “{q}”",
  "search.emptyTitle": "Nothing found.",
  "search.emptyDesc": "The void keeps what it returns. Try another word.",
  "search.viewAll": "View All",
  "search.allObjects": "Search the whole catalogue",

  "notFound.code": "404",
  "notFound.title": "Lost in the Void",
  "notFound.desc": "This object doesn't exist — it may never have.",
  "notFound.cta": "Back to Abyss",

  "seller.seller": "Seller",
  "seller.since": "Est.",
  "seller.about": "About",
  "seller.objects": "Objects",
  "seller.range": "Range",
  "seller.origin": "Origin",
  "seller.handle": "Handle",
  "seller.follow": "Follow",
  "seller.following": "Following",
  "seller.shopAll": "Shop All",

  "footer.shop": "Shop",
  "footer.help": "Help",
  "footer.company": "Company",
  "footer.sellers": "Sellers",
  "footer.resources": "Resources",
  "footer.link.new": "New Here",
  "footer.link.apparel": "Apparel",
  "footer.link.footwear": "Footwear",
  "footer.link.accessories": "Accessories",
  "footer.link.outerwear": "Outerwear",
  "footer.link.contact": "Contact",
  "footer.link.shipping": "Shipping & Returns",
  "footer.link.size": "Size Guide",
  "footer.link.about": "About Abyss",
  "footer.link.careers": "Careers",
  "footer.link.sustainability": "Sustainability",
  "footer.link.start": "Start Selling",
  "footer.link.stories": "Seller Stories",
  "footer.link.fees": "Seller Fees",
  "footer.rights": "© {year} Abyss. Local sellers, worldwide.",
  "footer.terms": "Terms of Sale",
  "footer.privacy": "Privacy",
  "footer.country": "Locale",

  "promo.justIn": "Just In",
  "promo.comingSoon": "Coming Soon",
  "promo.recycled": "Recycled Materials",
  "promo.limited": "Limited Edition",

  "common.off": "{n}% off",
  "common.back": "Back",
} as const;

const fr: Record<keyof typeof en, string> = {
  "utility.help": "Aide",
  "utility.join": "Nous rejoindre",
  "utility.seller": "Devenir vendeur",
  "utility.language": "Langue",
  "utility.demoNotice":
    "Boutique de démonstration — comptes et paiements ne sont pas encore connectés.",

  "nav.menu": "Menu",
  "nav.close": "Fermer",
  "nav.search": "Rechercher",
  "nav.searchPlaceholder": "Rechercher",
  "nav.bag": "Sac",
  "nav.all": "Tout",

  "category.all": "Tout",
  "category.apparel": "Vêtements",
  "category.footwear": "Chaussures",
  "category.accessories": "Accessoires",
  "category.outerwear": "Vestes",

  "gender.WOMEN": "Femme",
  "gender.MEN": "Homme",
  "gender.UNISEX": "Tout",

  "sub.tees": "Tees et polos",
  "sub.shirts": "Chemises",
  "sub.tops": "Tops et débardeurs",
  "sub.trousers": "Pantalons",
  "sub.skirts": "Jupes",
  "sub.hoodies": "Sweats et hoodies",
  "sub.sneakers": "Baskets",
  "sub.derbies": "Derbies et oxfords",
  "sub.boots": "Bottes",
  "sub.sandals": "Sandales et mules",
  "sub.bags": "Sacs et pochettes",
  "sub.headwear": "Couvre-chefs",
  "sub.belts": "Ceintures",
  "sub.scarves": "Foulards",
  "sub.jewelry": "Bijoux",
  "sub.small-goods": "Petits objets",
  "sub.coats": "Manteaux",
  "sub.jackets": "Vestes",
  "sub.parkas": "Parkas",

  "nav.shop": "Boutique",
  "nav.designedFor": "Créé pour",
  "nav.viewAll": "Tout voir {cat}",
  "nav.allShop": "Tout acheter",
  "nav.subLabel": "Sous-catégorie",

  "plp.subcategory": "Sous-catégorie",
  "plp.gender": "Genre",

  "hero.title": "HABILLER LE VIDE",
  "hero.subtitle":
    "Des objets de vendeurs locaux, photographiés à la surface.",
  "hero.cta": "Tout parcourir",

  "home.trending": "Tendance",
  "home.shopByCategory": "Par catégorie",
  "home.latest": "Derniers arrivages",
  "home.viewAll": "Tout voir",
  "home.shop": "Voir",
  "home.loadMore": "Charger plus",
  "home.end": "Fin du catalogue",
  "home.noResults": "Aucun objet ne correspond.",
  "home.clear": "Effacer",

  "plp.resultOne": "objet",
  "plp.results": "objets",
  "plp.hideFilters": "Masquer les filtres",
  "plp.showFilters": "Filtres",
  "plp.sortBy": "Trier par",
  "plp.sortFeatured": "En vedette",
  "plp.sortPriceLow": "Prix : croissant",
  "plp.sortPriceHigh": "Prix : décroissant",
  "plp.sortNewest": "Nouveautés",
  "plp.clearAll": "Tout effacer",
  "plp.noResultsTitle": "Aucun résultat pour ces filtres.",
  "plp.noResultsDesc": "Essayez de retirer un ou deux filtres pour élargir la recherche.",
  "plp.clearFilters": "Effacer les filtres",
  "plp.category": "Catégorie",
  "plp.size": "Taille",
  "plp.price": "Prix",
  "plp.sellers": "Vendeurs",
  "plp.promo": "Promo",
  "plp.any": "Toutes",

  "price.all": "Tous",
  "price.b1": "Moins de 150 $",
  "price.b2": "150 – 299 $",
  "price.b3": "300 $ +",

  "pdp.by": "Par {seller}",
  "pdp.size": "Pointure",
  "pdp.swatch": "Coloris {n}",
  "pdp.colorway": "Coloris",
  "pdp.selectSize": "Choisir la taille",
  "pdp.quantity": "Quantité",
  "pdp.addToCart": "Ajouter au panier",
  "pdp.sizeHint": "Veuillez choisir une taille",
  "pdp.details": "Voir les détails",
  "pdp.shipping": "Livraison et retours",
  "pdp.reviews": "Avis",
  "pdp.noReviews":
    "Aucun avis pour l'instant — soyez le premier à donner la parole à cet objet.",
  "pdp.shipText":
    "Expédition sous 24 h depuis l'atelier du vendeur. Retours acceptés pendant 30 jours si l'objet n'a pas été porté.",
  "pdp.related": "Pour compléter",
  "pdp.mockNote": "Boutique de démonstration — aucun paiement.",
  "pdp.materials": "Matières",
  "pdp.soldBy": "Vendu par",
  "pdp.est": "Depuis {year}",
  "pdp.inStock": "En stock",
  "pdp.reviewCount": "{n} avis",

  "cart.title": "Sac",
  "cart.count": "Sac ({n})",
  "cart.close": "Fermer",
  "cart.emptyTitle": "Votre sac est vide.",
  "cart.emptyDesc": "Des objets vous attendent plus bas.",
  "cart.viewCatalogue": "Voir le catalogue",
  "cart.viewBag": "Voir le sac",
  "cart.subtotal": "Sous-total",
  "cart.subtotalNote": "Livraison en Algérie ajoutée à la commande.",
  "cart.checkout": "Commander",
  "cart.remove": "Retirer",
  "cart.emptyCart": "Vider le sac",
  "cart.freeDelivery": "Livraison offerte",
  "cart.deliveryHint": "Livraison {fee} · offerte dès {freeOver}",
  "cart.continue": "Continuer mes achats",
  "cart.inc": "Augmenter la quantité",
  "cart.dec": "Diminuer la quantité",

  "wishlist.title": "Favoris",
  "wishlist.toggle": "Basculer les favoris",
  "wishlist.count": "Objets sauvegardés ({n})",
  "wishlist.clear": "Vider les favoris",
  "wishlist.remove": "Retirer",
  "wishlist.view": "Voir",
  "wishlist.emptyTitle": "Rien de sauvegardé pour l'instant.",
  "wishlist.emptyDesc": "Touchez le cœur sur un objet pour le garder ici pour plus tard.",

  "checkout.title": "Commande",
  "checkout.back": "Retour au sac",
  "checkout.emptyTitle": "Rien à commander.",
  "checkout.emptyDesc": "Votre sac est vide — des objets vous attendent plus bas.",
  "checkout.browse": "Parcourir le catalogue",
  "checkout.contact": "Contact",
  "checkout.delivery": "Livraison",
  "checkout.payment": "Paiement",
  "checkout.fullName": "Nom complet",
  "checkout.phone": "Téléphone",
  "checkout.wilaya": "Wilaya",
  "checkout.commune": "Commune",
  "checkout.address": "Adresse postale",
  "checkout.phonePlaceholder": "0550 12 34 56",
  "checkout.phoneHint": "Mobile algérien, ex. 0550 12 34 56",
  "checkout.selectWilaya": "Choisir la wilaya",
  "checkout.deliveryNote": "Livraison dans toute l'Algérie — les 69 wilayas.",
  "checkout.cod": "Paiement à la livraison",
  "checkout.codDesc":
    "Payez le livreur en espèces à la réception. Ni carte, ni virement, ni paiement en ligne.",
  "checkout.summary": "Récapitulatif",
  "checkout.deliveryFee": "Livraison",
  "checkout.total": "Total",
  "checkout.free": "Offert",
  "checkout.payNote": "Vous paierez {total} en espèces à la porte.",
  "checkout.placeOrder": "Confirmer la commande",
  "checkout.errName": "Saisissez votre nom complet.",
  "checkout.errPhone": "Saisissez un numéro algérien valide.",
  "checkout.errWilaya": "Choisissez votre wilaya.",
  "checkout.errCommune": "Saisissez votre commune.",
  "checkout.errAddress": "Saisissez votre adresse postale.",
  "checkout.doneTitle": "Commande confirmée.",
  "checkout.doneNumber": "Commande {number}",
  "checkout.doneDesc":
    "Payez {total} à la livraison à {commune}, {wilaya}. Le vendeur appellera le {phone} sous 24 h pour confirmer.",
  "checkout.doneHint": "Paiement à la livraison — gardez {total} prêt à la porte.",
  "checkout.backHome": "Continuer mes achats",
  "checkout.demo": "Boutique de démonstration — aucune commande réelle, aucun paiement collecté.",

  "auth.signIn": "Se connecter",
  "auth.signUp": "Créer un compte",
  "auth.signOut": "Se déconnecter",
  "auth.heroTitle": "Se connecter",
  "auth.heroSub": "Reprenez là où vous vous êtes arrêté. Directement à la porte.",
  "auth.signupHeroTitle": "Créer un compte",
  "auth.signupHeroSub": "Rejoignez ABYSS — votre sac, sauvegardé. Paiement à la livraison, toujours.",
  "auth.noAccount": "Nouveau ici ?",
  "auth.createOne": "Créer un compte",
  "auth.haveAccount": "Déjà un compte ?",
  "auth.signInInstead": "Se connecter",
  "auth.name": "Nom complet",
  "auth.namePlaceholder": "Amazigh Kader",
  "auth.email": "E-mail",
  "auth.emailPlaceholder": "vous@exemple.com",
  "auth.password": "Mot de passe",
  "auth.passwordPlaceholder": "8+ caractères",
  "auth.passwordHint": "Au moins 8 caractères.",
  "auth.confirmPassword": "Confirmer le mot de passe",
  "auth.confirmPasswordPlaceholder": "Répétez le mot de passe",
  "auth.submit": "Se connecter",
  "auth.signupSubmit": "Créer un compte",
  "auth.google": "Continuer avec Google",
  "auth.signingIn": "Connexion…",
  "auth.or": "ou",
  "auth.signedInAs": "Connecté en tant que {name}",
  "auth.welcome": "Bon retour, {name}.",
  "auth.accountTitle": "Compte",
  "auth.demoHint": "Vos informations vivent dans ce navigateur uniquement — authentification de démonstration, rien n'est stocké sur un serveur.",
  "auth.shopNow": "Continuer mes achats",
  "auth.checkoutNow": "Aller à la commande",
  "auth.demoNotice":
    "Mode démo — les comptes sont stockés dans ce navigateur uniquement et ne sont pas sécurisés. Aucune donnée réelle n'est collectée.",
  "auth.errNameRequired": "Saisissez votre nom complet.",
  "auth.errNameShort": "Le nom doit comporter au moins 2 caractères.",
  "auth.errEmailRequired": "Saisissez votre e-mail.",
  "auth.errEmailInvalid": "Saisissez une adresse e-mail valide.",
  "auth.errEmailTaken": "Un compte existe déjà avec cette adresse e-mail.",
  "auth.errPasswordRequired": "Saisissez un mot de passe.",
  "auth.errPasswordMin": "Le mot de passe doit comporter au moins 8 caractères.",
  "auth.errConfirmMismatch": "Les mots de passe ne correspondent pas.",
  "auth.errInvalidCredentials": "E-mail ou mot de passe incorrect.",

  "search.title": "Recherche",
  "search.results": "Résultats pour « {q} »",
  "search.emptyTitle": "Rien trouvé.",
  "search.emptyDesc":
    "Le vide garde ce qu'il rend. Essayez un autre mot.",
  "search.viewAll": "Tout voir",
  "search.allObjects": "Parcourir tout le catalogue",

  "seller.seller": "Vendeur",
  "seller.since": "Depuis",
  "seller.about": "À propos",
  "seller.objects": "Objets",
  "seller.range": "Gamme",
  "seller.origin": "Origine",
  "seller.handle": "Pseudo",
  "seller.follow": "Suivre",
  "seller.following": "Suivi",
  "seller.shopAll": "Tout voir",

  "notFound.code": "404",
  "notFound.title": "Perdu dans le vide",
  "notFound.desc": "Cet objet n'existe pas — peut-être n'a-t-il jamais existé.",
  "notFound.cta": "Retour à Abyss",

  "footer.shop": "Boutique",
  "footer.help": "Aide",
  "footer.company": "Société",
  "footer.sellers": "Vendeurs",
  "footer.resources": "Ressources",
  "footer.link.new": "Nouveau ici",
  "footer.link.apparel": "Vêtements",
  "footer.link.footwear": "Chaussures",
  "footer.link.accessories": "Accessoires",
  "footer.link.outerwear": "Vestes",
  "footer.link.contact": "Contact",
  "footer.link.shipping": "Livraison et retours",
  "footer.link.size": "Guide des tailles",
  "footer.link.about": "À propos d'Abyss",
  "footer.link.careers": "Carrières",
  "footer.link.sustainability": "Durabilité",
  "footer.link.start": "Vendre sur Abyss",
  "footer.link.stories": "Histoires de vendeurs",
  "footer.link.fees": "Frais de vente",
  "footer.rights": "© {year} Abyss. Vendeurs locaux, partout.",
  "footer.terms": "Conditions de vente",
  "footer.privacy": "Confidentialité",
  "footer.country": "Région",

  "promo.justIn": "Nouveau",
  "promo.comingSoon": "Bientôt",
  "promo.recycled": "Matières recyclées",
  "promo.limited": "Édition limitée",

  "common.off": "-{n} %",
  "common.back": "Retour",
};

export type Dict = typeof en;

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof Dict, vars?: Vars) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

type LangListener = () => void;

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("abyss-lang");
  return saved === "fr" ? "fr" : "en";
}

const listeners = new Set<LangListener>();

function subscribeLang(cb: LangListener) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getLangSnapshot(): Lang {
  return readStoredLang();
}

function getLangServerSnapshot(): Lang {
  return "en";
}

function notifyLang(next: Lang) {
  try {
    localStorage.setItem("abyss-lang", next);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(
    subscribeLang,
    getLangSnapshot,
    getLangServerSnapshot
  );

  const setLang = useCallback((next: Lang) => {
    notifyLang(next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: keyof Dict, vars?: Vars) => {
      const dict = lang === "fr" ? fr : en;
      let s: string = dict[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replace(`{${k}}`, String(v));
        }
      }
      return s;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t }),
    [lang, setLang, t]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

/** Localized label helper for a category slug. */
export const categoryLabelKey = (slug: string): keyof Dict =>
  `category.${slug}` as keyof Dict;

/** Localized label helper for a subcategory slug. */
export const subcategoryLabelKey = (slug: string): keyof Dict =>
  `sub.${slug}` as keyof Dict;

export const genderLabelKey = (gender: string): keyof Dict =>
  `gender.${gender}` as keyof Dict;

export const promoLabelKey = (promo: string): keyof Dict =>
  `promo.${promo}` as keyof Dict;

/** Localized product description: pick locale variant from mock data. */
export function localizedProductText(
  lang: Lang,
  enText: string,
  frText: string
) {
  return lang === "fr" ? frText : enText;
}