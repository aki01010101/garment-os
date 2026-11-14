import { Product, BulkCsvImportRow, ClothingCategory, Season, ClothingSize } from '../types';

export interface AutofillConfig {
  skuPrefix?: string; // Default: 'GOS'
  defaultStock?: number; // Default: 10
  defaultMinStockAlert?: number; // Default: 5
  targetCostMarginPercent?: number; // Default: 50 (i.e. cost is 50% of selling price)
  targetMarkupRatio?: number; // Default: 2.0 (i.e. price is 2x of cost)
  defaultCategory?: ClothingCategory; // Default: 'Men'
  defaultSize?: ClothingSize | string; // Default: 'Free Size'
  defaultColor?: string; // Default: 'Standard'
  defaultSeason?: Season; // Default: 'All-Season'
}

export const DEFAULT_AUTOFILL_CONFIG: AutofillConfig = {
  skuPrefix: 'GOS',
  defaultStock: 10,
  defaultMinStockAlert: 5,
  targetCostMarginPercent: 50,
  targetMarkupRatio: 2.0,
  defaultCategory: 'Men',
  defaultSize: 'Free Size',
  defaultColor: 'Standard',
  defaultSeason: 'All-Season',
};

// -----------------------------------------------------------------------------
// 1. DICTIONARIES FOR CLOTHING CATEGORY, SUBCATEGORY, COLOR & SIZE EXTRACTION
// -----------------------------------------------------------------------------

const COLOR_MAP: Array<{ name: string; abbr: string; regex: RegExp }> = [
  // Multi-word compound colors (Must be checked first)
  { name: 'Navy Blue', abbr: 'NVB', regex: /\b(navy\s*blue|navy)\b/i },
  { name: 'Sky Blue', abbr: 'SKB', regex: /\b(sky\s*blue|powder\s*blue)\b/i },
  { name: 'Royal Blue', abbr: 'RYB', regex: /\b(royal\s*blue)\b/i },
  { name: 'Light Blue', abbr: 'LBL', regex: /\b(light\s*blue|ice\s*blue)\b/i },
  { name: 'Dark Blue', abbr: 'DBL', regex: /\b(dark\s*blue|midnight\s*blue)\b/i },
  { name: 'Jet Black', abbr: 'BLK', regex: /\b(jet\s*black)\b/i },
  { name: 'Off White', abbr: 'OFW', regex: /\b(off\s*white)\b/i },
  { name: 'Bottle Green', abbr: 'BGR', regex: /\b(bottle\s*green)\b/i },
  { name: 'Olive Green', abbr: 'OLV', regex: /\b(olive\s*green|olive)\b/i },
  { name: 'Mint Green', abbr: 'MNT', regex: /\b(mint\s*green|mint)\b/i },
  { name: 'Pista Green', abbr: 'PST', regex: /\b(pista\s*green|pista)\b/i },
  { name: 'Dark Green', abbr: 'DGR', regex: /\b(dark\s*green)\b/i },
  { name: 'Lemon Yellow', abbr: 'YEL', regex: /\b(lemon\s*yellow|lemon)\b/i },
  { name: 'Mustard Yellow', abbr: 'MST', regex: /\b(mustard\s*yellow|mustard)\b/i },
  { name: 'Baby Pink', abbr: 'PNK', regex: /\b(baby\s*pink|light\s*pink)\b/i },
  { name: 'Dusty Pink', abbr: 'DPN', regex: /\b(dusty\s*pink|rose\s*pink)\b/i },
  { name: 'Wine Red', abbr: 'WIN', regex: /\b(wine\s*red|wine)\b/i },
  { name: 'Rust Orange', abbr: 'RST', regex: /\b(rust\s*orange|rust)\b/i },
  { name: 'Coffee Brown', abbr: 'BRN', regex: /\b(coffee\s*brown|coffee)\b/i },

  // Single word colors
  { name: 'Black', abbr: 'BLK', regex: /\b(black)\b/i },
  { name: 'White', abbr: 'WHT', regex: /\b(white)\b/i },
  { name: 'Blue', abbr: 'BLU', regex: /\b(blue)\b/i },
  { name: 'Red', abbr: 'RED', regex: /\b(red|crimson)\b/i },
  { name: 'Green', abbr: 'GRN', regex: /\b(green)\b/i },
  { name: 'Yellow', abbr: 'YEL', regex: /\b(yellow)\b/i },
  { name: 'Pink', abbr: 'PNK', regex: /\b(pink)\b/i },
  { name: 'Purple', abbr: 'PUR', regex: /\b(purple|violet)\b/i },
  { name: 'Grey', abbr: 'GRY', regex: /\b(grey|gray|charcoal)\b/i },
  { name: 'Orange', abbr: 'ORG', regex: /\b(orange)\b/i },
  { name: 'Brown', abbr: 'BRN', regex: /\b(brown|chocolate)\b/i },
  { name: 'Beige', abbr: 'BGE', regex: /\b(beige)\b/i },
  { name: 'Maroon', abbr: 'MAR', regex: /\b(maroon)\b/i },
  { name: 'Cream', abbr: 'CRM', regex: /\b(cream)\b/i },
  { name: 'Khaki', abbr: 'KHK', regex: /\b(khaki)\b/i },
  { name: 'Tan', abbr: 'TAN', regex: /\b(tan)\b/i },
  { name: 'Peach', abbr: 'PCH', regex: /\b(peach)\b/i },
  { name: 'Coral', abbr: 'CRL', regex: /\b(coral)\b/i },
  { name: 'Lavender', abbr: 'LAV', regex: /\b(lavender|lilac)\b/i },
  { name: 'Teal', abbr: 'TEL', regex: /\b(teal|turquoise)\b/i },
  { name: 'Burgundy', abbr: 'BUR', regex: /\b(burgundy)\b/i },
  { name: 'Gold', abbr: 'GLD', regex: /\b(gold|golden)\b/i },
  { name: 'Silver', abbr: 'SLV', regex: /\b(silver)\b/i },
  { name: 'Multi-Color', abbr: 'MLT', regex: /\b(multi\s*color|multicolor|printed|floral|striped|checked)\b/i },
];

const SUBCATEGORY_RULES: Array<{
  subCategory: string;
  category: ClothingCategory;
  abbr: string;
  regex: RegExp;
}> = [
  // Men & Women Topwear
  { subCategory: 'Formal Shirts', category: 'Men', abbr: 'FSH', regex: /\b(formal\s*shirt|dress\s*shirt|executive\s*shirt)\b/i },
  { subCategory: 'Casual Shirts', category: 'Men', abbr: 'CSH', regex: /\b(casual\s*shirt|linen\s*shirt|denim\s*shirt|flannel|checked\s*shirt|printed\s*shirt)\b/i },
  { subCategory: 'Polo T-Shirts', category: 'Men', abbr: 'POL', regex: /\b(polo|polo\s*t-?shirt|collar\s*t-?shirt)\b/i },
  { subCategory: 'T-Shirts', category: 'Men', abbr: 'TSH', regex: /\b(t-?shirt|tee|round\s*neck|crew\s*neck|v-?neck)\b/i },
  { subCategory: 'Shirts', category: 'Men', abbr: 'SHI', regex: /\b(shirt|shirts)\b/i },
  { subCategory: 'Kurta', category: 'Men', abbr: 'KRT', regex: /\b(kurta|kurta\s*pajama|pathani)\b/i },

  // Men Bottomwear
  { subCategory: 'Formal Trousers', category: 'Men', abbr: 'FTR', regex: /\b(formal\s*trouser|formal\s*pant|pleated\s*trouser)\b/i },
  { subCategory: 'Chinos', category: 'Men', abbr: 'CHN', regex: /\b(chino|chinos|khakis)\b/i },
  { subCategory: 'Jeans', category: 'Men', abbr: 'JEA', regex: /\b(jeans|denim|denims)\b/i },
  { subCategory: 'Cargo Pants', category: 'Men', abbr: 'CRG', regex: /\b(cargo|cargos)\b/i },
  { subCategory: 'Trackpants', category: 'Men', abbr: 'TRK', regex: /\b(track\s*pant|trackpants|jogger|joggers|sweatpants)\b/i },
  { subCategory: 'Shorts', category: 'Men', abbr: 'SHT', regex: /\b(short|shorts|bermuda|boxer|boxers)\b/i },
  { subCategory: 'Trousers', category: 'Men', abbr: 'TRS', regex: /\b(trouser|trousers|pant|pants)\b/i },

  // Formal / Suiting
  { subCategory: 'Blazers', category: 'Men', abbr: 'BLZ', regex: /\b(blazer|blazers|sport\s*coat)\b/i },
  { subCategory: 'Suits', category: 'Men', abbr: 'SUI', regex: /\b(suit|suits|tuxedo|coat\s*pant)\b/i },
  { subCategory: 'Nehru Jackets', category: 'Men', abbr: 'NJT', regex: /\b(nehru\s*jacket|modi\s*jacket|waistcoat|bundi)\b/i },
  { subCategory: 'Sherwani', category: 'Men', abbr: 'SHR', regex: /\b(sherwani|indo\s*western|achkan)\b/i },

  // Winterwear
  { subCategory: 'Jackets', category: 'Men', abbr: 'JCK', regex: /\b(jacket|jackets|bomber|leather\s*jacket|windcheater|puffer)\b/i },
  { subCategory: 'Hoodies', category: 'Men', abbr: 'HOD', regex: /\b(hoodie|hoodies|sweatshirt)\b/i },
  { subCategory: 'Sweaters', category: 'Men', abbr: 'SWT', regex: /\b(sweater|sweaters|cardigan|pullover)\b/i },

  // Women Ethnic & Western
  { subCategory: 'Kurtis', category: 'Women', abbr: 'KUR', regex: /\b(kurti|kurtis|tunic|tunics)\b/i },
  { subCategory: 'Sarees', category: 'Women', abbr: 'SAR', regex: /\b(saree|sari|sarees)\b/i },
  { subCategory: 'Lehengas', category: 'Women', abbr: 'LEH', regex: /\b(lehenga|choli|ghagra)\b/i },
  { subCategory: 'Anarkali Suits', category: 'Women', abbr: 'ANA', regex: /\b(anarkali|gown|salwar\s*suit|churidar)\b/i },
  { subCategory: 'Women Tops', category: 'Women', abbr: 'TOP', regex: /\b(top|tops|blouse|crop\s*top)\b/i },
  { subCategory: 'Dresses', category: 'Women', abbr: 'DRS', regex: /\b(dress|dresses|maxi|midi|one\s*piece)\b/i },
  { subCategory: 'Palazzos', category: 'Women', abbr: 'PLZ', regex: /\b(palazzo|palazzos|sharara|garara)\b/i },
  { subCategory: 'Skirts', category: 'Women', abbr: 'SKR', regex: /\b(skirt|skirts)\b/i },

  // Kids
  { subCategory: 'Kids Wear', category: 'Kids', abbr: 'KID', regex: /\b(kids?|child|children|baby|infant|toddler|frock|baba\s*suit|junior)\b/i },

  // Accessories
  { subCategory: 'Leather Belts', category: 'Accessories', abbr: 'BLT', regex: /\b(belt|belts)\b/i },
  { subCategory: 'Wallets', category: 'Accessories', abbr: 'WLT', regex: /\b(wallet|wallets|purse|clutch)\b/i },
  { subCategory: 'Ties', category: 'Accessories', abbr: 'TIE', regex: /\b(tie|ties|bow\s*tie|cufflinks|pocket\s*square)\b/i },
  { subCategory: 'Socks', category: 'Accessories', abbr: 'SCK', regex: /\b(socks|sock)\b/i },
  { subCategory: 'Perfumes', category: 'Accessories', abbr: 'PRF', regex: /\b(perfume|perfumes|deo|fragrance)\b/i },
  { subCategory: 'Caps', category: 'Accessories', abbr: 'CAP', regex: /\b(cap|caps|hat)\b/i },
  { subCategory: 'Handkerchiefs', category: 'Accessories', abbr: 'HNK', regex: /\b(handkerchief|hankies|hanky)\b/i },
];

// Common Alpha Sizes and Numeric Waist/Collar Sizes
const SIZE_ALPHA_REGEX = /\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL|5XL|6XL|Free\s*Size|FS)\b/i;
const SIZE_NUMERIC_REGEX = /\b(26|28|30|32|34|36|38|39|40|41|42|43|44|46|48|50)\b/;
const SIZE_KIDS_REGEX = /\b(0-3M|3-6M|6-12M|1-2Y|2-3Y|3-4Y|4-5Y|5-6Y|7-8Y|9-10Y|11-12Y|13-14Y)\b/i;

// -----------------------------------------------------------------------------
// 2. NAME ATTRIBUTE EXTRACTION ENGINE
// -----------------------------------------------------------------------------

export interface ExtractedGarmentAttributes {
  category?: ClothingCategory;
  subCategory?: string;
  size?: ClothingSize | string;
  color?: string;
  season?: Season;
  subCatAbbr?: string;
  colorAbbr?: string;
}

export function extractAttributesFromName(name: string): ExtractedGarmentAttributes {
  const clean = name.trim();
  if (!clean) return {};

  const result: ExtractedGarmentAttributes = {};

  // 1. Extract Color
  for (const c of COLOR_MAP) {
    if (c.regex.test(clean)) {
      result.color = c.name;
      result.colorAbbr = c.abbr;
      break;
    }
  }

  // 2. Extract SubCategory & Category
  for (const s of SUBCATEGORY_RULES) {
    if (s.regex.test(clean)) {
      result.subCategory = s.subCategory;
      result.category = s.category;
      result.subCatAbbr = s.abbr;
      break;
    }
  }

  // Explicit Category Overrides if gender/group words are present
  if (/\b(women|woman|ladies|female|girl|girls)\b/i.test(clean)) {
    result.category = 'Women';
  } else if (/\b(kids?|child|children|baby|infant|toddler|boy|boys|baba)\b/i.test(clean)) {
    result.category = 'Kids';
  } else if (/\b(belt|wallet|cufflink|tie|socks|perfume|accessory|accessories)\b/i.test(clean)) {
    result.category = 'Accessories';
  } else if (/\b(men|man|gent|gents|male)\b/i.test(clean)) {
    result.category = 'Men';
  }

  // 3. Extract Size
  // Check for explicit "Size: X" or "Size X" or "Sz X" first
  const explicitSizeMatch = clean.match(/(?:size|sz|waist)\s*[:#-]?\s*([0-9]{2}|[A-Za-z]{1,4}|[0-9]+-[0-9]+[MY])/i);
  if (explicitSizeMatch && explicitSizeMatch[1]) {
    const rawSize = explicitSizeMatch[1].toUpperCase();
    if (rawSize === 'FS') {
      result.size = 'Free Size';
    } else {
      result.size = rawSize as ClothingSize;
    }
  } else {
    // Check Kids age sizes
    const kidsMatch = clean.match(SIZE_KIDS_REGEX);
    if (kidsMatch) {
      result.size = kidsMatch[0].toUpperCase() as ClothingSize;
      if (!result.category) result.category = 'Kids';
    } else {
      // Check Alpha Sizes (e.g. S, M, L, XL, XXL)
      const alphaMatch = clean.match(SIZE_ALPHA_REGEX);
      if (alphaMatch) {
        const val = alphaMatch[0].toUpperCase();
        result.size = val === 'FS' ? 'Free Size' : (val as ClothingSize);
      } else {
        // Check Numeric sizes (e.g. 32, 38, 40, 42)
        const numMatch = clean.match(SIZE_NUMERIC_REGEX);
        if (numMatch) {
          result.size = numMatch[0] as ClothingSize;
        }
      }
    }
  }

  // 4. Extract Season
  if (/\b(summer|spring|linen|cotton|shorts|sleeveless|half\s*sleeve)\b/i.test(clean)) {
    result.season = 'Summer';
  } else if (/\b(winter|fall|wool|woolen|jacket|sweater|hoodie|fleece|thermal|blazer|cardigan)\b/i.test(clean)) {
    result.season = 'Winter';
  } else if (/\b(silk|embroidered|anarkali|lehenga|brocade|sherwani|ethnic|wedding|festive|diwali|puja)\b/i.test(clean)) {
    result.season = 'Festive / Autumn';
  } else {
    result.season = 'All-Season';
  }

  return result;
}

// -----------------------------------------------------------------------------
// 3. INTELLIGENT SKU GENERATOR
// -----------------------------------------------------------------------------

export function generateSmartSku(
  item: {
    category?: ClothingCategory | string;
    subCategory?: string;
    color?: string;
    size?: string;
    name?: string;
  },
  existingSkus: Set<string>,
  prefix: string = 'GOS'
): string {
  // 1. Category Abbreviation
  const cat = String(item.category || 'Men');
  const catAbbr =
    cat === 'Women' ? 'W' : cat === 'Kids' ? 'K' : cat === 'Accessories' ? 'ACC' : 'M';

  // 2. Subcategory Abbreviation
  let subAbbr = 'GEN';
  const sub = (item.subCategory || '').toLowerCase();
  if (sub.includes('formal shirt')) subAbbr = 'FSH';
  else if (sub.includes('casual shirt')) subAbbr = 'CSH';
  else if (sub.includes('t-shirt') || sub.includes('tee')) subAbbr = 'TSH';
  else if (sub.includes('polo')) subAbbr = 'POL';
  else if (sub.includes('shirt')) subAbbr = 'SHI';
  else if (sub.includes('trouser') || sub.includes('pant')) subAbbr = 'TRS';
  else if (sub.includes('chino')) subAbbr = 'CHN';
  else if (sub.includes('jeans') || sub.includes('denim')) subAbbr = 'JEA';
  else if (sub.includes('kurti')) subAbbr = 'KUR';
  else if (sub.includes('saree')) subAbbr = 'SAR';
  else if (sub.includes('suit')) subAbbr = 'SUI';
  else if (sub.includes('blazer')) subAbbr = 'BLZ';
  else if (sub.includes('jacket')) subAbbr = 'JCK';
  else if (sub.includes('belt')) subAbbr = 'BLT';
  else if (sub.includes('wallet')) subAbbr = 'WLT';
  else if (item.name) {
    const extracted = extractAttributesFromName(item.name);
    if (extracted.subCatAbbr) subAbbr = extracted.subCatAbbr;
  }

  // 3. Color Abbreviation
  let colAbbr = 'STD';
  const col = (item.color || '').trim();
  const matchedColor = COLOR_MAP.find((c) => c.regex.test(col));
  if (matchedColor) {
    colAbbr = matchedColor.abbr;
  } else if (col && col.length >= 3) {
    colAbbr = col.slice(0, 3).toUpperCase();
  }

  // 4. Size Abbreviation
  let sizeAbbr = 'FS';
  const sz = (item.size || '').trim();
  if (sz && sz.toLowerCase() !== 'free size') {
    sizeAbbr = sz.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  // Candidate Base SKU
  const baseSku = `${prefix}-${catAbbr}-${subAbbr}-${colAbbr}-${sizeAbbr}`;

  // If unique, return base SKU
  if (!existingSkus.has(baseSku.toLowerCase())) {
    existingSkus.add(baseSku.toLowerCase());
    return baseSku;
  }

  // Append sequential numbers if colliding
  for (let seq = 1; seq <= 99; seq++) {
    const seqStr = String(seq).padStart(2, '0');
    const candidate = `${baseSku}-${seqStr}`;
    if (!existingSkus.has(candidate.toLowerCase())) {
      existingSkus.add(candidate.toLowerCase());
      return candidate;
    }
  }

  // Fallback random suffix
  const uniqueSku = `${baseSku}-${Math.floor(100 + Math.random() * 900)}`;
  existingSkus.add(uniqueSku.toLowerCase());
  return uniqueSku;
}

// -----------------------------------------------------------------------------
// 4. RETAIL BARCODE GENERATOR (GS1 / EAN COMPATIBLE)
// -----------------------------------------------------------------------------

export function generateRetailBarcode(existingBarcodes: Set<string>): string {
  // Indian GS1 retail prefix: 890
  const prefix = '890';

  for (let attempt = 0; attempt < 50; attempt++) {
    const randomBody = Math.floor(100000000 + Math.random() * 900000000).toString();
    const candidate = `${prefix}${randomBody}`;
    if (!existingBarcodes.has(candidate)) {
      existingBarcodes.add(candidate);
      return candidate;
    }
  }

  const fallback = `${prefix}${Date.now().toString().slice(-9)}`;
  existingBarcodes.add(fallback);
  return fallback;
}

// -----------------------------------------------------------------------------
// 5. MASTER AUTOFILL ROW FUNCTION
// -----------------------------------------------------------------------------

export interface AutofillResult {
  row: BulkCsvImportRow;
  autofilledFields: string[];
  isFullyAutofilled: boolean;
  notes: string[];
}

export function autofillRow(
  inputRow: BulkCsvImportRow,
  existingProducts: Product[],
  existingSkusInBatch: Set<string>,
  existingBarcodesInBatch: Set<string>,
  config: AutofillConfig = DEFAULT_AUTOFILL_CONFIG
): AutofillResult {
  const row: BulkCsvImportRow = { ...inputRow };
  const autofilledFields: string[] = [];
  const notes: string[] = [];

  const effectiveConfig = { ...DEFAULT_AUTOFILL_CONFIG, ...config };

  // Step 1. If name is present, extract attributes for missing fields
  const rawName = (row.name || '').trim();
  const extracted = rawName ? extractAttributesFromName(rawName) : {};

  // 1. Garment Name
  if (!rawName) {
    if (row.sku) {
      row.name = `Apparel Item (${row.sku})`;
      autofilledFields.push('name');
    } else if (row.category) {
      row.name = `${row.category} Garment`;
      autofilledFields.push('name');
    } else {
      row.name = 'Apparel Item';
      autofilledFields.push('name');
    }
    notes.push('Name derived from code/category');
  }

  // 2. Category
  if (!row.category) {
    row.category = extracted.category || effectiveConfig.defaultCategory || 'Men';
    autofilledFields.push('category');
    notes.push(`Category inferred: ${row.category}`);
  }

  // 3. Sub-Category
  if (!row.subCategory) {
    if (extracted.subCategory) {
      row.subCategory = extracted.subCategory;
    } else {
      // Default based on category
      const cat = row.category;
      if (cat === 'Women') row.subCategory = 'Kurtis';
      else if (cat === 'Kids') row.subCategory = 'Kids Wear';
      else if (cat === 'Accessories') row.subCategory = 'Leather Belts';
      else row.subCategory = 'Shirts';
    }
    autofilledFields.push('subCategory');
  }

  // 4. Size
  if (!row.size) {
    row.size = extracted.size || effectiveConfig.defaultSize || 'Free Size';
    autofilledFields.push('size');
  }

  // 5. Color
  if (!row.color) {
    row.color = extracted.color || effectiveConfig.defaultColor || 'Standard';
    autofilledFields.push('color');
  }

  // 6. Season
  if (!row.season) {
    row.season = extracted.season || effectiveConfig.defaultSeason || 'All-Season';
    autofilledFields.push('season');
  }

  // 7. Selling Price & Cost Price
  const hasSellingPrice = typeof row.sellingPrice === 'number' && !isNaN(row.sellingPrice) && row.sellingPrice > 0;
  const hasCostPrice = typeof row.costPrice === 'number' && !isNaN(row.costPrice) && row.costPrice > 0;

  if (hasSellingPrice && !hasCostPrice) {
    // Estimate cost price based on target cost margin percent
    const marginRatio = (effectiveConfig.targetCostMarginPercent || 50) / 100;
    row.costPrice = Math.round(row.sellingPrice! * marginRatio);
    autofilledFields.push('costPrice');
    notes.push(`Cost estimated at ${effectiveConfig.targetCostMarginPercent}% of SP`);
  } else if (!hasSellingPrice && hasCostPrice) {
    // Estimate selling price using keystone markup
    const markup = effectiveConfig.targetMarkupRatio || 2.0;
    const rawPrice = row.costPrice! * markup;
    // Round to retail sweet-spot ending in 9 (e.g. 1499, 999, 499)
    row.sellingPrice = Math.max(99, Math.round(rawPrice / 50) * 50 - 1);
    autofilledFields.push('sellingPrice');
    notes.push(`Price estimated at ${markup}x cost markup`);
  } else if (!hasSellingPrice && !hasCostPrice) {
    // Sensible retail defaults by category
    const cat = row.category;
    if (cat === 'Women') {
      row.sellingPrice = 1999;
      row.costPrice = 850;
    } else if (cat === 'Kids') {
      row.sellingPrice = 799;
      row.costPrice = 350;
    } else if (cat === 'Accessories') {
      row.sellingPrice = 599;
      row.costPrice = 250;
    } else {
      row.sellingPrice = 1499;
      row.costPrice = 650;
    }
    autofilledFields.push('sellingPrice', 'costPrice');
    notes.push('Standard retail price & cost defaults applied');
  }

  // 8. Tax Rate (GST)
  if (typeof row.taxRate !== 'number' || isNaN(row.taxRate)) {
    // Indian GST rule: <= 1000 is 5%, > 1000 is 12%
    row.taxRate = (row.sellingPrice || 0) > 1000 ? 12 : 5;
    autofilledFields.push('taxRate');
  }

  // 9. Stock / Opening Inventory
  if (typeof row.stock !== 'number' || isNaN(row.stock)) {
    if (typeof row.stockDelta === 'number' && !isNaN(row.stockDelta)) {
      row.stock = Math.max(0, row.stockDelta);
    } else {
      row.stock = effectiveConfig.defaultStock || 10;
    }
    autofilledFields.push('stock');
  }

  // 10. Min Stock Alert Threshold
  if (typeof row.minStockAlert !== 'number' || isNaN(row.minStockAlert)) {
    row.minStockAlert = effectiveConfig.defaultMinStockAlert || 5;
    autofilledFields.push('minStockAlert');
  }

  // 11. Rack / Store Location
  if (!row.rack) {
    const cat = row.category;
    if (cat === 'Women') row.rack = 'Rack B-1 (Women)';
    else if (cat === 'Kids') row.rack = 'Rack C-1 (Kids)';
    else if (cat === 'Accessories') row.rack = 'Counter Display';
    else row.rack = 'Rack A-1 (Men)';
    autofilledFields.push('rack');
  }

  // 12. Smart SKU Generation
  const rawSku = (row.sku || '').trim();
  if (!rawSku) {
    row.sku = generateSmartSku(
      {
        category: row.category,
        subCategory: row.subCategory,
        color: row.color,
        size: String(row.size),
        name: row.name,
      },
      existingSkusInBatch,
      effectiveConfig.skuPrefix || 'GOS'
    );
    autofilledFields.push('sku');
    notes.push(`Generated SKU: ${row.sku}`);
  } else {
    existingSkusInBatch.add(rawSku.toLowerCase());
  }

  // 13. Smart Barcode Generation
  const rawBarcode = (row.barcode || '').trim();
  if (!rawBarcode) {
    row.barcode = generateRetailBarcode(existingBarcodesInBatch);
    autofilledFields.push('barcode');
    notes.push('Generated retail barcode');
  } else {
    existingBarcodesInBatch.add(rawBarcode);
  }

  return {
    row,
    autofilledFields,
    isFullyAutofilled: autofilledFields.length > 0,
    notes,
  };
}

