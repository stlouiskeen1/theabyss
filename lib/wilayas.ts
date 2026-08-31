/**
 * Delivery territory data.
 *
 * Algeria today has 69 wilayas (58 historical + 11 created by the November
 * 2025 territorial reform, operational under the 2026 reorganization).
 * Codes 1–58 use the classic numbering; 59–69 use the widely circulated
 * 2025 assignment (official ministry codes for the new wilayas were still
 * being formalized at the time of writing).
 *
 * The store is a demo: prices are mock USD, delivery is flat-fee COD.
 */

export type Wilaya = { code: number; name: string };

export const WILAYAS: Wilaya[] = [
  { code: 1, name: "Adrar" },
  { code: 2, name: "Chlef" },
  { code: 3, name: "Laghouat" },
  { code: 4, name: "Oum El Bouaghi" },
  { code: 5, name: "Batna" },
  { code: 6, name: "Béjaïa" },
  { code: 7, name: "Biskra" },
  { code: 8, name: "Béchar" },
  { code: 9, name: "Blida" },
  { code: 10, name: "Bouira" },
  { code: 11, name: "Tamanrasset" },
  { code: 12, name: "Tébessa" },
  { code: 13, name: "Tlemcen" },
  { code: 14, name: "Tiaret" },
  { code: 15, name: "Tizi Ouzou" },
  { code: 16, name: "Alger" },
  { code: 17, name: "Djelfa" },
  { code: 18, name: "Jijel" },
  { code: 19, name: "Sétif" },
  { code: 20, name: "Saïda" },
  { code: 21, name: "Skikda" },
  { code: 22, name: "Sidi Bel Abbès" },
  { code: 23, name: "Annaba" },
  { code: 24, name: "Guelma" },
  { code: 25, name: "Constantine" },
  { code: 26, name: "Médéa" },
  { code: 27, name: "Mostaganem" },
  { code: 28, name: "M'sila" },
  { code: 29, name: "Mascara" },
  { code: 30, name: "Ouargla" },
  { code: 31, name: "Oran" },
  { code: 32, name: "El Bayadh" },
  { code: 33, name: "Illizi" },
  { code: 34, name: "Bordj Bou Arréridj" },
  { code: 35, name: "Boumerdès" },
  { code: 36, name: "El Tarf" },
  { code: 37, name: "Tindouf" },
  { code: 38, name: "Tissemsilt" },
  { code: 39, name: "El Oued" },
  { code: 40, name: "Khenchela" },
  { code: 41, name: "Souk Ahras" },
  { code: 42, name: "Tipaza" },
  { code: 43, name: "Mila" },
  { code: 44, name: "Aïn Defla" },
  { code: 45, name: "Naâma" },
  { code: 46, name: "Aïn Témouchent" },
  { code: 47, name: "Ghardaïa" },
  { code: 48, name: "Relizane" },
  { code: 49, name: "Timimoun" },
  { code: 50, name: "Bordj Badji Mokhtar" },
  { code: 51, name: "Ouled Djellal" },
  { code: 52, name: "Béni Abbès" },
  { code: 53, name: "In Salah" },
  { code: 54, name: "In Guezzam" },
  { code: 55, name: "Touggourt" },
  { code: 56, name: "Djanet" },
  { code: 57, name: "El M'Ghair" },
  { code: 58, name: "El Meniaa" },
  { code: 59, name: "Aflou" },
  { code: 60, name: "El Abiodh Sidi Cheikh" },
  { code: 61, name: "El Aricha" },
  { code: 62, name: "El Kantara" },
  { code: 63, name: "Barika" },
  { code: 64, name: "Bou Saada" },
  { code: 65, name: "Bir El Ater" },
  { code: 66, name: "Ksar El Boukhari" },
  { code: 67, name: "Ksar Chellala" },
  { code: 68, name: "Aïn Oussara" },
  { code: 69, name: "Messaad" },
];

export const WILAYAS_ALPHABETICAL = [...WILAYAS].sort((a, b) =>
  a.name.localeCompare(b.name)
);

/** Flat cash-on-delivery fee, waived above the free-delivery threshold. */
export const DELIVERY_FEE = 8;
export const FREE_DELIVERY_OVER = 150;

/** Shipping cost for a given subtotal (cash on delivery, Algeria only). */
export const deliveryFeeFor = (subtotal: number) =>
  subtotal >= FREE_DELIVERY_OVER || subtotal === 0 ? 0 : DELIVERY_FEE;

/** Wilaya name for a numeric code, if it exists. */
export const wilayaName = (code: number) => WILAYAS.find((w) => w.code === code)?.name;