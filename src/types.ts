export type ClothingCategory = 'Men' | 'Women' | 'Kids' | 'Accessories';

export type ClothingSize =
  | 'XXS'
  | 'XS'
  | 'S'
  | 'M'
  | 'L'
  | 'XL'
  | 'XXL'
  | '3XL'
  | '4XL'
  | '5XL'
  | '6XL'
  | '26'
  | '28'
  | '30'
  | '32'
  | '34'
  | '36'
  | '38'
  | '39'
  | '40'
  | '41'
  | '42'
  | '43'
  | '44'
  | '46'
  | '48'
  | '50'
  | '16'
  | '18'
  | '20'
  | '22'
  | '24'
  | '26'
  | '28'
  | '30'
  | '32'
  | '34'
  | '0-3M'
  | '3-6M'
  | '6-12M'
  | '1-2Y'
  | '2-3Y'
  | '3-4Y'
  | '4-5Y'
  | '5-6Y'
  | '6-7Y'
  | '7-8Y'
  | '8-9Y'
  | '9-10Y'
  | '10-11Y'
  | '11-12Y'
  | '13-14Y'
  | 'UK 5'
  | 'UK 6'
  | 'UK 7'
  | 'UK 8'
  | 'UK 9'
  | 'UK 10'
  | 'UK 11'
  | 'UK 12'
  | 'Free Size'
  | string;

export interface SizeOptionGroup {
  label: string;
  options: { value: string; label: string }[];
}

export const CLOTHING_SIZE_GROUPS: SizeOptionGroup[] = [
  {
    label: 'Standard Letter (Alpha)',
    options: [
      { value: 'XXS', label: 'XXS' },
      { value: 'XS', label: 'XS' },
      { value: 'S', label: 'S' },
      { value: 'M', label: 'M' },
      { value: 'L', label: 'L' },
      { value: 'XL', label: 'XL' },
      { value: 'XXL', label: 'XXL' },
      { value: '3XL', label: '3XL' },
      { value: '4XL', label: '4XL' },
      { value: '5XL', label: '5XL' },
      { value: '6XL', label: '6XL' },
    ],
  },
  {
    label: 'Waist / Trousers / Jeans (Numeric Inches)',
    options: [
      { value: '26', label: '26 (Waist 26")' },
      { value: '28', label: '28 (Waist 28")' },
      { value: '30', label: '30 (Waist 30")' },
      { value: '32', label: '32 (Waist 32")' },
      { value: '34', label: '34 (Waist 34")' },
      { value: '36', label: '36 (Waist 36")' },
      { value: '38', label: '38 (Waist 38")' },
      { value: '40', label: '40 (Waist 40")' },
      { value: '42', label: '42 (Waist 42")' },
      { value: '44', label: '44 (Waist 44")' },
      { value: '46', label: '46 (Waist 46")' },
      { value: '48', label: '48 (Waist 48")' },
      { value: '50', label: '50 (Waist 50")' },
    ],
  },
  {
    label: 'Formal Shirts / Collar (Numeric cm/inches)',
    options: [
      { value: '36', label: '36 (14")' },
      { value: '38', label: '38 (15")' },
      { value: '39', label: '39 (15.5")' },
      { value: '40', label: '40 (16")' },
      { value: '41', label: '41 (16")' },
      { value: '42', label: '42 (16.5")' },
      { value: '43', label: '43 (17")' },
      { value: '44', label: '44 (17.5")' },
      { value: '46', label: '46 (18")' },
      { value: '48', label: '48 (18.5")' },
    ],
  },
  {
    label: 'Kids Numeric Sizes (Chest / Length)',
    options: [
      { value: '16', label: '16 (Kids 1-2Y)' },
      { value: '18', label: '18 (Kids 2-3Y)' },
      { value: '20', label: '20 (Kids 3-4Y)' },
      { value: '22', label: '22 (Kids 5-6Y)' },
      { value: '24', label: '24 (Kids 7-8Y)' },
      { value: '26', label: '26 (Kids 9-10Y)' },
      { value: '28', label: '28 (Kids 11-12Y)' },
      { value: '30', label: '30 (Kids 13-14Y)' },
      { value: '32', label: '32 (Kids 15-16Y)' },
      { value: '34', label: '34 (Teen)' },
    ],
  },
  {
    label: 'Kids Age Groups',
    options: [
      { value: '0-3M', label: '0-3M (Infant)' },
      { value: '3-6M', label: '3-6M (Infant)' },
      { value: '6-12M', label: '6-12M (Infant)' },
      { value: '1-2Y', label: '1-2Y' },
      { value: '2-3Y', label: '2-3Y' },
      { value: '3-4Y', label: '3-4Y' },
      { value: '4-5Y', label: '4-5Y' },
      { value: '5-6Y', label: '5-6Y' },
      { value: '6-7Y', label: '6-7Y' },
      { value: '7-8Y', label: '7-8Y' },
      { value: '8-9Y', label: '8-9Y' },
      { value: '9-10Y', label: '9-10Y' },
      { value: '10-11Y', label: '10-11Y' },
      { value: '11-12Y', label: '11-12Y' },
      { value: '13-14Y', label: '13-14Y' },
    ],
  },
  {
    label: 'Footwear (UK / India)',
    options: [
      { value: 'UK 5', label: 'UK 5' },
      { value: 'UK 6', label: 'UK 6' },
      { value: 'UK 7', label: 'UK 7' },
      { value: 'UK 8', label: 'UK 8' },
      { value: 'UK 9', label: 'UK 9' },
      { value: 'UK 10', label: 'UK 10' },
      { value: 'UK 11', label: 'UK 11' },
      { value: 'UK 12', label: 'UK 12' },
    ],
  },
  {
    label: 'Universal / Other',
    options: [
      { value: 'Free Size', label: 'Free Size' },
    ],
  },
];

export type Season = 'Summer' | 'Winter' | 'Festive / Autumn' | 'All-Season';

export type CompanyType = 'billed' | 'cash';

export interface Company {
  id: string;
  name: string;
  legalName: string;
  type: CompanyType;
  taxId: string; // GSTIN or Tax Reg
  address: string;
  city: string;
  phone: string;
  email: string;
  invoicePrefix: string;
  currentInvoiceNumber: number;
  returnPolicy: string;
  accentColor: string;
  tagline: string;
  isDefault?: boolean;
  enableDynamicGarmentGst?: boolean; // Indian Garment Rule: 5% if net <= 1000, 12% if net > 1000
  taxInclusive?: boolean; // true = prices are GST inclusive (MRP model), false = GST added separately on top
  isCompositionScheme?: boolean; // Composition GST: No tax breakup printed on bills; shows "GST Included in Price"
  googleReviewUrl?: string; // Direct Google Profile / Reviews link for receipt QR
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ClothingCategory;
  subCategory: string;
  size: ClothingSize;
  color: string;
  season: Season;
  costPrice: number;
  sellingPrice: number; // MRP or base price
  stock: number;
  defectiveStock?: number; // Quarantined defective/return-to-vendor stock
  minStockAlert: number;
  taxRate: number; // e.g. 5 or 12 (%)
  purchaseSource?: 'billed' | 'cash' | 'mixed';
  description?: string;
  taxInclusive?: boolean; // Optional per-item override (default inherits from activeCompany)
  brand?: string;
  rack?: string;
}

export interface BulkProductUpdate {
  id: string;
  stockDelta?: number;
  newStock?: number;
  priceDeltaPercent?: number; // e.g. +10 or -15
  priceDeltaFlat?: number; // e.g. +100 or -50
  newPrice?: number;
  newCostPrice?: number;
  season?: Season;
}

export interface BulkCsvImportRow {
  sku?: string;
  barcode?: string;
  name?: string;
  category?: ClothingCategory | string;
  subCategory?: string;
  size?: ClothingSize | string;
  color?: string;
  season?: Season | string;
  brand?: string;
  stock?: number;
  stockDelta?: number;
  sellingPrice?: number;
  costPrice?: number;
  taxRate?: number;
  minStockAlert?: number;
  rack?: string;
  description?: string;
  purchaseSource?: 'billed' | 'cash' | 'mixed';
  rawLine?: string;
}

export interface AlterationDetails {
  needed: boolean;
  notes: string; // e.g. "Shorten length 1.5 inches, waist taper 1 inch"
  tailorName?: string;
  promisedDate: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  alteration?: AlterationDetails;
}

export type FamilyRelation =
  | 'Spouse'
  | 'Son'
  | 'Daughter'
  | 'Father'
  | 'Mother'
  | 'Brother'
  | 'Sister'
  | 'Grandfather'
  | 'Grandmother'
  | 'In-Law'
  | 'Other';

export interface FamilyMember {
  id: string;
  name: string;
  relation: FamilyRelation | string;
  phone?: string;
  birthday?: string;
  anniversary?: string;
  preferredShirtSize?: string;
  preferredTrouserWaist?: string;
  notes?: string;
  linkedCustomerId?: string;
}

export interface CustomerProfile {
  birthday?: string; // YYYY-MM-DD
  anniversary?: string; // YYYY-MM-DD
  address?: string;
  city?: string;
  pincode?: string;
  preferredShirtSize?: string; // e.g. "38 / M", "40 / L"
  preferredTrouserWaist?: string; // e.g. "32", "34"
  preferredFit?: 'Slim Fit' | 'Regular Fit' | 'Relaxed Fit' | 'Comfort' | string;
  preferredStyles?: string[]; // e.g. ["Ethnic Kurtis", "Formal Shirts", "Denim Jeans"]
  preferredColors?: string[]; // e.g. ["Sky Blue", "Pastels", "Charcoal Grey"]
  measurements?: {
    chest?: string;
    waist?: string;
    shoulder?: string;
    inseam?: string;
    length?: string;
    collar?: string;
  };
  alternatePhone?: string;
  gstin?: string;
  specialInstructions?: string;
  familyMembers?: FamilyMember[];
  measurementProfiles?: GarmentMeasurementProfile[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  totalSpend: number;
  totalVisits: number;
  createdAt: string;
  lastPurchaseDate?: string;
  notes?: string;
  isVip?: boolean;
  vipTier?: 'Regular' | 'Silver' | 'Gold' | 'Platinum';
  profile?: CustomerProfile;
  creditLimit?: number;
  outstandingCredit?: number;
  creditStatus?: 'good' | 'overdue' | 'blocked';
  oldestCreditDate?: string;
}

export type CustomerVipTier = 'Regular' | 'Silver' | 'Gold' | 'Platinum';

export interface CustomerTierInfo {
  tier: CustomerVipTier;
  multiplier: number;
  perks: string;
  badgeClass: string;
  nextTierThreshold?: number;
  amountToNextTier?: number;
}

export function getCustomerTier(totalSpend: number): CustomerTierInfo {
  if (totalSpend >= 50000) {
    return {
      tier: 'Platinum',
      multiplier: 2.0,
      perks: '2x Points · Free Alterations · Personal Stylist',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    };
  }
  if (totalSpend >= 25000) {
    return {
      tier: 'Gold',
      multiplier: 1.5,
      perks: '1.5x Points · 5% Birthday Bonus · Priority Fitting',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      nextTierThreshold: 50000,
      amountToNextTier: 50000 - totalSpend,
    };
  }
  if (totalSpend >= 10000) {
    return {
      tier: 'Silver',
      multiplier: 1.25,
      perks: '1.25x Points · Advance Festive Sale Access',
      badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
      nextTierThreshold: 25000,
      amountToNextTier: 25000 - totalSpend,
    };
  }
  return {
    tier: 'Regular',
    multiplier: 1.0,
    perks: '1x Points · Standard Member',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    nextTierThreshold: 10000,
    amountToNextTier: 10000 - totalSpend,
  };
}

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  alteration?: AlterationDetails;
}

export interface SplitPaymentBreakdown {
  cash: number;
  upi: number;
  card: number;
  credit?: number;
}

export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Credit' | 'Split';
export type CreditStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface SaleTransaction {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyPhone: string;
  companyReturnPolicy: string;
  date: string; // ISO
  customerId?: string;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  itemDiscountsTotal: number;
  loyaltyPointsUsed: number;
  loyaltyDiscountAmount: number;
  couponCodeApplied?: string;
  couponDiscountAmount?: number;
  promoDiscountAmount?: number;
  promoTitleApplied?: string;
  creditNoteCodeApplied?: string;
  creditNoteDiscountAmount?: number;
  taxTotal: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  cashTendered?: number;
  changeDue?: number;
  splitBreakdown?: SplitPaymentBreakdown;
  creditAmount?: number;
  creditRemainingBalance?: number;
  creditDueDate?: string;
  creditStatus?: CreditStatus;
  creditNotes?: string;
  creditSettledDate?: string;
  customerPreviousBalance?: number;
  customerNewBalance?: number;
  customerSignature?: string; // base64 PNG data URL of signature
  customerSignedAt?: string; // ISO string when customer signed
  notes?: string;
  cashierName: string;
  salesAssociate?: string;
  taxInclusive?: boolean;
  isCompositionScheme?: boolean;
  googleReviewUrl?: string;
}

export interface CustomerCreditPaymentAllocation {
  saleId: string;
  invoiceNumber: string;
  amountAllocated: number;
  remainingOnInvoice: number;
}

export interface CustomerCreditPayment {
  id: string;
  receiptNumber: string; // e.g. REC-KHATA-1001
  customerId: string;
  customerName: string;
  customerPhone: string;
  companyId: string;
  companyName: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Cheque';
  referenceNumber?: string; // UPI Ref, Cheque #, etc.
  date: string; // ISO string
  collectedBy: string;
  notes?: string;
  allocations: CustomerCreditPaymentAllocation[];
  customerPreviousBalance: number;
  customerNewBalance: number;
}

export interface KhataLedgerEntry {
  id: string;
  type: 'DEBIT' | 'CREDIT'; // DEBIT = Goods taken on credit (+), CREDIT = Payment received (-)
  date: string;
  referenceNumber: string; // Invoice # or Payment Receipt #
  description: string;
  amount: number;
  runningBalance: number;
  daysElapsed?: number;
  dueDate?: string;
  isOverdue?: boolean;
  paymentMode?: string;
  rawTransaction?: SaleTransaction | CustomerCreditPayment;
}

export type KhataAgingBucket = '0-15' | '16-30' | '31-60' | '60+';

export interface KhataSummaryStats {
  totalOutstanding: number;
  overdueAmount: number;
  customerCount: number;
  recoveredThisMonth: number;
  agingBuckets: {
    '0-15': { count: number; amount: number };
    '16-30': { count: number; amount: number };
    '31-60': { count: number; amount: number };
    '60+': { count: number; amount: number };
  };
}

export interface AlterationRecord {
  id: string;
  saleId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  garmentName: string;
  size: string;
  color: string;
  alterationNotes: string;
  tailorName: string;
  promisedDate: string;
  status: 'Pending' | 'In Progress' | 'Ready for Pickup' | 'Delivered';
  createdDate: string;
  customerNotifiedAt?: string;
}

export interface CreditNoteItem {
  productName: string;
  sku: string;
  size: string;
  color: string;
  qty: number;
  amount: number;
  reason: string;
  isDefective: boolean;
}

export interface CreditNote {
  id: string;
  code: string; // e.g. CN-1042
  originalInvoiceNumber: string;
  companyId: string;
  companyName: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  remainingAmount: number;
  status: 'active' | 'used' | 'expired';
  issuedDate: string;
  expiryDate: string;
  itemsReturned: CreditNoteItem[];
  notes?: string;
}

export interface PettyExpense {
  id: string;
  time: string;
  category: 'Tea & Refreshments' | 'Packaging & Bags' | 'Shop Maintenance' | 'Courier' | 'Staff Advance' | 'Alteration Fees' | 'Other';
  amount: number;
  paidTo: string;
  notes: string;
}

export interface CashDrop {
  id: string;
  time: string;
  amount: number;
  droppedBy: string; // Cashier / Manager
  witnessName?: string;
  reason?: string;
  notes?: string;
}

export interface DayEndRegister {
  id: string;
  date: string;
  companyId: string;
  openingCash: number;
  expenses: PettyExpense[];
  cashDrops?: CashDrop[]; // Mid-day cash transferred from till to main store safe (anti-theft)
  closingCashCounted?: number;
  closingNotes?: string;
  closedAt?: string;
  status: 'open' | 'closed';
}

export interface ParkedCart {
  id: string;
  ticketNumber: number;
  label?: string; // e.g. "Rahul - Blue Sherwani"
  parkedAt: string; // ISO string
  cashierName: string;
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  selectedAssociate?: string;
  appliedCoupon?: CouponCode | null;
  appliedCreditNote?: CreditNote | null;
  redeemedPoints: number;
  subtotal: number;
  grandTotal: number;
  notes?: string;
}

export interface CouponCode {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minBillAmount: number;
  description: string;
}

export type PromotionType = 'bogo' | 'cart_slab' | 'bundle_price' | 'category_discount';

export interface PromotionRule {
  id: string;
  title: string; // e.g. "Buy 2 Get 1 Free - Summer T-Shirts"
  code?: string; // Optional coupon code, if blank it's auto-applied
  type: PromotionType;
  isActive: boolean;
  applicableCategory?: ClothingCategory | 'ALL';
  minQuantity?: number; // for BOGO or bundle (e.g. 3)
  freeQuantity?: number; // for BOGO (e.g. 1)
  bundlePrice?: number; // for bundle_price (e.g. 1499 for 2 items)
  minCartAmount?: number; // for cart_slab (e.g. 3000)
  slabDiscountAmount?: number; // flat discount (e.g. 500)
  slabDiscountPercent?: number; // % discount (e.g. 15%)
  description: string;
}

export interface MatrixBatchProductInput {
  styleName: string;
  skuPrefix: string;
  category: ClothingCategory;
  subCategory: string;
  season: Season;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  taxInclusive?: boolean;
  purchaseSource?: 'billed' | 'cash' | 'mixed';
  minStockAlert: number;
  description?: string;
  colors: string[];
  sizes: string[];
  grid: Record<string, number>; // key: `${color}__${size}`, value: qty
}

export interface StockAuditItem {
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  size: string;
  color: string;
  expectedStock: number;
  scannedStock: number;
  variance: number; // scanned - expected
  unitCost: number;
  costImpact: number; // variance * unitCost
}

export interface StockAuditSession {
  id: string;
  auditNumber: string;
  date: string; // ISO
  auditorName: string;
  categoryFilter: string; // 'All' or specific category
  items: StockAuditItem[];
  totalExpected: number;
  totalScanned: number;
  netVariance: number;
  netCostImpact: number;
  status: 'draft' | 'completed';
  notes?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  gstin?: string;
  billedPayableBalance: number;
  cashPayableBalance: number;
  totalBilledPurchased: number;
  totalCashPurchased: number;
  notes?: string;
}

export interface PurchaseItem {
  productId?: string;
  productName: string;
  sku: string;
  category: ClothingCategory;
  size: string;
  color: string;
  qty: number;
  costPrice: number;
  total: number;
  sellingPrice?: number;
  isNewProduct?: boolean;
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  companyId: string;
  companyName: string;
  purchaseType: 'billed' | 'cash';
  billOrVoucherNumber: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI';
  notes?: string;
}

export interface VendorPaymentRecord {
  id: string;
  vendorId: string;
  vendorName: string;
  date: string;
  amount: number;
  ledgerType: 'billed' | 'cash';
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
  referenceNo?: string;
  notes?: string;
}

export interface LoyaltyConfig {
  pointsPerHundredSpent: number;
  pointRedemptionValue: number;
  minimumPointsToRedeem: number;
  vipMonthlyThreshold?: number; // Minimum monthly spend to achieve VIP Client status (default ₹5,000)
}

export type UserRole = 'admin' | 'store_manager' | 'sales_cashier';

export type CodePrintType = 'barcode' | 'qr';

export type QrPrintSize = 'compact' | 'medium' | 'large' | 'xlarge';

export const QR_SIZE_PIXELS: Record<QrPrintSize, number> = {
  compact: 130,
  medium: 155,
  large: 175,
  xlarge: 195,
};

export interface AppTabDefinition {
  id: string;
  label: string;
  desc: string;
  defaultRoles: UserRole[];
}

export const ALL_APP_TABS: AppTabDefinition[] = [
  { id: 'pos', label: 'POS Billing', desc: 'Fast billing, barcode scanning, cart & instant thermal receipt', defaultRoles: ['admin', 'store_manager', 'sales_cashier'] },
  { id: 'inventory', label: 'Inventory', desc: 'Garments catalog, stock auditing, low-stock alerts, CSV import', defaultRoles: ['admin', 'store_manager'] },
  { id: 'tags', label: 'Price Tags', desc: '58mm thermal barcode price tag generator & batch print', defaultRoles: ['admin', 'store_manager'] },
  { id: 'vendors', label: 'Vendors & Stock', desc: 'Fabric vendors, dual-ledger purchases & payment settlements', defaultRoles: ['admin', 'store_manager'] },
  { id: 'returns', label: 'Returns & Credit', desc: 'Item returns, exchange handling & credit note vouchers', defaultRoles: ['admin', 'store_manager', 'sales_cashier'] },
  { id: 'alterations', label: 'Alterations', desc: 'Tailoring measurement tracker & garment staple slips', defaultRoles: ['admin', 'store_manager', 'sales_cashier'] },
  { id: 'cash', label: 'Day Register (Z)', desc: 'Till float, petty shop expenses, and day-end reconciliation', defaultRoles: ['admin', 'store_manager'] },
  { id: 'crm', label: 'CRM & Loyalty', desc: 'Customer phone directory, purchase history & loyalty points', defaultRoles: ['admin', 'store_manager'] },
  { id: 'reports', label: 'Reports & Taxes', desc: '7-day sales charts, GST reports, P&L, and business volume', defaultRoles: ['admin'] },
  { id: 'settings', label: 'Settings', desc: 'Billing entities, user roles, passwords, and permissions', defaultRoles: ['admin'] },
];

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  avatar: string;
  designation: string;
  allowedTabs?: string[]; // Custom permission overrides; if omitted, role defaults apply
}

export interface AuthState {
  currentUser: UserAccount;
  isLocked: boolean;
  lastActivityTimestamp: number;
}

export interface CloudUser {
  id: string;
  email: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
  provider?: 'google' | 'email';
}

// =============================================================================
// PHASE 4 DATA MODELS: RFM CAMPAIGNS, STO TRANSFERS, COMMISSIONS, DIGITAL E-RECEIPTS
// =============================================================================

export type RFMSegment = 'champions' | 'loyal' | 'at_risk' | 'hibernating' | 'new_walkins';

export interface CustomerRFMProfile {
  customerId: string;
  customerName: string;
  phone: string;
  email?: string;
  recencyDays: number;
  lastPurchaseDate?: string;
  frequencyOrders: number;
  monetaryLifetimeSpend: number;
  averageOrderValue: number;
  segment: RFMSegment;
  segmentLabel: string;
  loyaltyPoints: number;
  suggestedAction: string;
}

export interface WhatsAppCampaignTemplate {
  id: string;
  name: string;
  targetSegment: RFMSegment | 'all';
  messageTemplate: string;
  couponCode?: string;
  discountText?: string;
}

export type StockTransferStatus = 'draft' | 'dispatched' | 'in_transit' | 'received' | 'discrepancy';

export interface StockTransferItem {
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  size: string;
  color: string;
  category: ClothingCategory;
  qtyDispatched: number;
  qtyReceived?: number;
  variance?: number; // qtyReceived - qtyDispatched
  notes?: string;
}

export interface StockTransferOrder {
  id: string;
  transferNumber: string; // e.g. STO-2026-001
  date: string; // ISO
  sourceBranch: string;
  destinationBranch: string;
  dispatchedBy: string;
  receivedBy?: string;
  receivedAt?: string;
  status: StockTransferStatus;
  items: StockTransferItem[];
  totalDispatchedQty: number;
  totalReceivedQty?: number;
  vehicleOrChallanNo?: string;
  notes?: string;
}

export interface AssociateCommissionConfig {
  associateName: string;
  monthlySalesTarget: number; // e.g. 150000
  baseCommissionPercent: number; // e.g. 1.5%
  bonusCommissionPercent?: number; // e.g. 2.5% if target met
}

export interface AssociateCommissionPayout {
  id: string;
  associateName: string;
  periodMonth: string; // e.g. "2026-11"
  totalSalesRevenue: number;
  billsHandled: number;
  targetAmount: number;
  targetAchievedPercent: number;
  commissionAmount: number;
  bonusAmount: number;
  totalPayout: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  paidBy?: string;
  notes?: string;
}

// ----------------------------------------------------
// Feature 9: Customer Secondary Display Screen
// ----------------------------------------------------
export type CustomerDisplayState = 'idle' | 'cart' | 'payment' | 'completed';

export interface CustomerDisplayItem {
  id: string;
  name: string;
  size?: string;
  color?: string;
  qty: number;
  price: number;
  total: number;
}

export interface CustomerDisplayPayload {
  state: CustomerDisplayState;
  companyName: string;
  companyTagline?: string;
  companyPhone?: string;
  companyAddress?: string;
  items: CustomerDisplayItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  customerName?: string;
  customerPhone?: string;
  customerLoyaltyPoints?: number;
  customerVipTier?: string;
  paymentMode?: string;
  upiUri?: string;
  googleReviewUrl?: string;
  invoiceNumber?: string;
  timestamp: number;
}

// ----------------------------------------------------
// Feature 8: Customer Measurement & Bespoke Fit Cards
// ----------------------------------------------------
export type GarmentFitType =
  | 'Kurti / Ethnic Top'
  | 'Shirt / Top'
  | 'Trouser / Jeans / Salwar'
  | 'Blouse / Choli'
  | 'Suit / Blazer'
  | 'Custom Dress';

export interface GarmentMeasurementProfile {
  id: string;
  customerId: string;
  profileName: string; // e.g. "Festive Kurti Fit", "Office Shirt Fit"
  garmentType: GarmentFitType;
  updatedAt: string;
  notes?: string;
  values: {
    // Upper Body
    chest?: string;
    waist?: string;
    hip?: string;
    shoulder?: string;
    sleeveLength?: string;
    armhole?: string;
    collar?: string;
    frontNeckDepth?: string;
    backNeckDepth?: string;
    topLength?: string;
    // Lower Body
    inseam?: string;
    outseam?: string;
    thigh?: string;
    bottomOpening?: string;
    crotchRise?: string;
  };
}

export interface GiftVoucherRedemption {
  id: string;
  date: string;
  saleId?: string;
  invoiceNumber?: string;
  amountDeducted: number;
  remainingBalance: number;
  cashierName?: string;
}

export interface GiftVoucher {
  id: string;
  code: string; // e.g. GIFT-8921-X4K2
  barcode: string; // e.g. 890912345678
  initialAmount: number;
  currentBalance: number;
  issuedToName: string;
  issuedToPhone: string;
  senderName?: string;
  message?: string;
  expiryDate: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  redemptionHistory?: GiftVoucherRedemption[];
}



