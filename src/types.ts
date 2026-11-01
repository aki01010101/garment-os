export type ClothingCategory = 'Men' | 'Women' | 'Kids' | 'Accessories';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Free Size' | string;

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
  sellingPrice: number; // MRP
  stock: number;
  defectiveStock?: number; // Quarantined defective/return-to-vendor stock
  minStockAlert: number;
  taxRate: number; // e.g. 5 or 12 (%)
  purchaseSource?: 'billed' | 'cash' | 'mixed';
  description?: string;
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
  stock?: number;
  stockDelta?: number;
  sellingPrice?: number;
  costPrice?: number;
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
  profile?: CustomerProfile;
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
}

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
  paymentMode: 'Cash' | 'Card' | 'UPI' | 'Split';
  cashTendered?: number;
  changeDue?: number;
  splitBreakdown?: SplitPaymentBreakdown;
  notes?: string;
  cashierName: string;
  salesAssociate?: string;
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
  compact: 80,
  medium: 105,
  large: 130,
  xlarge: 155,
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


