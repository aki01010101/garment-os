import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Company,
  Product,
  Customer,
  SaleTransaction,
  Vendor,
  PurchaseOrder,
  VendorPaymentRecord,
  AlterationRecord,
  CreditNote,
  DayEndRegister,
  UserAccount,
  CouponCode,
  LoyaltyConfig,
} from '../types';

export const SUPABASE_STORAGE_KEYS = {
  URL: 'garment_os_supabase_url',
  ANON_KEY: 'garment_os_supabase_anon_key',
  LAST_SYNC: 'garment_os_supabase_last_sync',
  AUTO_SYNC: 'garment_os_supabase_auto_sync',
};

let cachedClient: SupabaseClient | null = null;
let lastKnownUrl = '';
let lastKnownKey = '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    '';
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env',
    };
  }

  try {
    const storedUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || '';
    const storedKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY) || '';

    if (storedUrl && storedKey) {
      return {
        url: storedUrl.trim(),
        anonKey: storedKey.trim(),
        isConfigured: true,
        source: 'storage',
      };
    }
  } catch {
    // Ignore localStorage errors
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  try {
    localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
    localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, anonKey.trim());
  } catch (err) {
    console.warn('Failed to save Supabase credentials to localStorage:', err);
  }
  cachedClient = null;
  lastKnownUrl = '';
  lastKnownKey = '';
}

export function clearSupabaseCredentials(): void {
  try {
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.ANON_KEY);
    localStorage.removeItem(SUPABASE_STORAGE_KEYS.LAST_SYNC);
  } catch {}
  cachedClient = null;
  lastKnownUrl = '';
  lastKnownKey = '';
}

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient && lastKnownUrl === config.url && lastKnownKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastKnownUrl = config.url;
    lastKnownKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(
  overrideUrl?: string,
  overrideKey?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const config = getSupabaseConfig();
    const url = overrideUrl || config.url;
    const key = overrideKey || config.anonKey;

    if (!url || !key) {
      return { success: false, message: 'Please provide both Supabase Project URL and Anon Public Key.' };
    }

    if (!url.startsWith('https://')) {
      return { success: false, message: 'Supabase URL must start with https://' };
    }

    const testClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await testClient.from('products').select('id').limit(1);

    if (error) {
      if (
        error.code === '42P01' ||
        error.message.toLowerCase().includes('relation') ||
        error.message.toLowerCase().includes('does not exist')
      ) {
        return {
          success: false,
          message: `Connected to Supabase, but database tables are missing. Please run supabase_schema.sql in the Supabase SQL Editor.`,
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return { success: true, message: 'Successfully connected to Supabase PostgreSQL database!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
}

// -----------------------------------------------------------------------------
// DATA MAPPINGS: React camelCase <-> PostgreSQL snake_case FOR ALL PAGES
// -----------------------------------------------------------------------------

// 1. COMPANIES (Store Profiles)
export function mapCompanyToDb(c: Company) {
  return {
    id: c.id,
    name: c.name,
    legal_name: c.legalName,
    type: c.type,
    tax_id: c.taxId,
    address: c.address,
    city: c.city,
    phone: c.phone,
    email: c.email,
    invoice_prefix: c.invoicePrefix,
    current_invoice_number: c.currentInvoiceNumber,
    return_policy: c.returnPolicy,
    accent_color: c.accentColor,
    tagline: c.tagline,
    is_default: c.isDefault || false,
    updated_at: new Date().toISOString(),
  };
}

export function mapCompanyFromDb(row: any): Company {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name || row.name,
    type: row.type || 'billed',
    taxId: row.tax_id || '',
    address: row.address || '',
    city: row.city || '',
    phone: row.phone || '',
    email: row.email || '',
    invoicePrefix: row.invoice_prefix || 'INV',
    currentInvoiceNumber: row.current_invoice_number || 1000,
    returnPolicy: row.return_policy || '',
    accentColor: row.accent_color || '#4f46e5',
    tagline: row.tagline || '',
    isDefault: row.is_default || false,
  };
}

// 2. PRODUCTS (Inventory, POS, Price Tags)
export function mapProductToDb(p: Product) {
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    category: p.category,
    sub_category: p.subCategory,
    size: p.size,
    color: p.color,
    season: p.season,
    cost_price: p.costPrice,
    selling_price: p.sellingPrice,
    stock: p.stock,
    defective_stock: p.defectiveStock || 0,
    min_stock_alert: p.minStockAlert,
    tax_rate: p.taxRate,
    purchase_source: p.purchaseSource || null,
    description: p.description || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapProductFromDb(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    barcode: row.barcode,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category || '',
    size: row.size || '',
    color: row.color || '',
    season: row.season || 'All-Season',
    costPrice: Number(row.cost_price) || 0,
    sellingPrice: Number(row.selling_price) || 0,
    stock: Number(row.stock) || 0,
    defectiveStock: Number(row.defective_stock) || 0,
    minStockAlert: Number(row.min_stock_alert) || 5,
    taxRate: Number(row.tax_rate) || 5,
    purchaseSource: row.purchase_source || undefined,
    description: row.description || undefined,
  };
}

// 3. CUSTOMERS (CRM, Loyalty)
export function mapCustomerToDb(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || null,
    loyalty_points: c.loyaltyPoints || 0,
    total_spend: c.totalSpend || 0,
    total_visits: c.totalVisits || 0,
    created_at: c.createdAt,
    last_purchase_date: c.lastPurchaseDate || null,
    notes: c.notes || null,
    is_vip: c.isVip || false,
    profile: c.profile || {},
    updated_at: new Date().toISOString(),
  };
}

export function mapCustomerFromDb(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    loyaltyPoints: Number(row.loyalty_points) || 0,
    totalSpend: Number(row.total_spend) || 0,
    totalVisits: Number(row.total_visits) || 0,
    createdAt: row.created_at || new Date().toISOString(),
    lastPurchaseDate: row.last_purchase_date || undefined,
    notes: row.notes || undefined,
    isVip: row.is_vip || false,
    profile: row.profile || undefined,
  };
}

// 4. SALES (POS Invoices, Reports)
export function mapSaleToDb(s: SaleTransaction) {
  return {
    id: s.id,
    invoice_number: s.invoiceNumber,
    company_id: s.companyId,
    company_name: s.companyName,
    company_tax_id: s.companyTaxId,
    company_address: s.companyAddress,
    company_phone: s.companyPhone,
    company_return_policy: s.companyReturnPolicy,
    date: s.date,
    customer_id: s.customerId || null,
    customer_name: s.customerName,
    customer_phone: s.customerPhone,
    items: s.items || [],
    subtotal: s.subtotal,
    item_discounts_total: s.itemDiscountsTotal || 0,
    loyalty_points_used: s.loyaltyPointsUsed || 0,
    loyalty_discount_amount: s.loyaltyDiscountAmount || 0,
    coupon_code_applied: s.couponCodeApplied || null,
    coupon_discount_amount: s.couponDiscountAmount || 0,
    credit_note_code_applied: s.creditNoteCodeApplied || null,
    credit_note_discount_amount: s.creditNoteDiscountAmount || 0,
    tax_total: s.taxTotal || 0,
    grand_total: s.grandTotal || 0,
    payment_mode: s.paymentMode,
    cash_tendered: s.cashTendered || null,
    change_due: s.changeDue || null,
    split_breakdown: s.splitBreakdown || null,
    notes: s.notes || null,
    cashier_name: s.cashierName,
    sales_associate: s.salesAssociate || null,
  };
}

export function mapSaleFromDb(row: any): SaleTransaction {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    companyId: row.company_id,
    companyName: row.company_name,
    companyTaxId: row.company_tax_id || '',
    companyAddress: row.company_address || '',
    companyPhone: row.company_phone || '',
    companyReturnPolicy: row.company_return_policy || '',
    date: row.date,
    customerId: row.customer_id || undefined,
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    itemDiscountsTotal: Number(row.item_discounts_total) || 0,
    loyaltyPointsUsed: Number(row.loyalty_points_used) || 0,
    loyaltyDiscountAmount: Number(row.loyalty_discount_amount) || 0,
    couponCodeApplied: row.coupon_code_applied || undefined,
    couponDiscountAmount: Number(row.coupon_discount_amount) || 0,
    creditNoteCodeApplied: row.credit_note_code_applied || undefined,
    creditNoteDiscountAmount: Number(row.credit_note_discount_amount) || 0,
    taxTotal: Number(row.tax_total) || 0,
    grandTotal: Number(row.grand_total) || 0,
    paymentMode: row.payment_mode || 'Cash',
    cashTendered: row.cash_tendered ? Number(row.cash_tendered) : undefined,
    changeDue: row.change_due ? Number(row.change_due) : undefined,
    splitBreakdown: row.split_breakdown || undefined,
    notes: row.notes || undefined,
    cashierName: row.cashier_name || 'Cashier',
    salesAssociate: row.sales_associate || undefined,
  };
}

// 5. VENDORS (Supplier Ledgers)
export function mapVendorToDb(v: Vendor) {
  return {
    id: v.id,
    name: v.name,
    contact_person: v.contactPerson,
    phone: v.phone,
    email: v.email,
    city: v.city,
    gstin: v.gstin || null,
    billed_payable_balance: v.billedPayableBalance || 0,
    cash_payable_balance: v.cashPayableBalance || 0,
    total_billed_purchased: v.totalBilledPurchased || 0,
    total_cash_purchased: v.totalCashPurchased || 0,
    notes: v.notes || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapVendorFromDb(row: any): Vendor {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person || '',
    phone: row.phone || '',
    email: row.email || '',
    city: row.city || '',
    gstin: row.gstin || undefined,
    billedPayableBalance: Number(row.billed_payable_balance) || 0,
    cashPayableBalance: Number(row.cash_payable_balance) || 0,
    totalBilledPurchased: Number(row.total_billed_purchased) || 0,
    totalCashPurchased: Number(row.total_cash_purchased) || 0,
    notes: row.notes || undefined,
  };
}

// 6. PURCHASES (Stock Received / Vendor Invoices)
export function mapPurchaseToDb(p: PurchaseOrder) {
  return {
    id: p.id,
    purchase_number: p.billOrVoucherNumber || `PO-${p.id}`,
    vendor_id: p.vendorId,
    vendor_name: p.vendorName,
    company_id: p.companyId,
    date: p.date,
    invoice_type: p.purchaseType,
    items: p.items || [],
    subtotal: p.subtotal || 0,
    tax_amount: p.taxAmount || 0,
    total_amount: p.totalAmount || 0,
    paid_amount: p.paidAmount || 0,
    payment_status: p.paymentStatus,
    payment_mode: p.paymentMode,
    notes: p.notes || null,
    created_at: new Date().toISOString(),
  };
}

export function mapPurchaseFromDb(row: any): PurchaseOrder {
  return {
    id: row.id,
    vendorId: row.vendor_id || '',
    vendorName: row.vendor_name || '',
    companyId: row.company_id || 'comp_billed',
    companyName: row.company_id === 'comp_cash' ? 'Garment OS Counter' : 'Garment OS Apparel Pvt Ltd',
    purchaseType: row.invoice_type || 'billed',
    billOrVoucherNumber: row.purchase_number || '',
    date: row.date || new Date().toISOString().split('T')[0],
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    taxRate: 5,
    taxAmount: Number(row.tax_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    paymentStatus: row.payment_status || 'paid',
    paymentMode: row.payment_mode || 'Cash',
    notes: row.notes || undefined,
  };
}

// 7. VENDOR PAYMENTS (Payment Settlements)
export function mapVendorPaymentToDb(v: VendorPaymentRecord) {
  return {
    id: v.id,
    purchase_id: null,
    vendor_id: v.vendorId,
    date: v.date,
    amount: v.amount,
    payment_mode: v.paymentMode,
    ledger_type: v.ledgerType,
    reference_no: v.referenceNo || null,
    notes: v.notes || null,
    created_at: new Date().toISOString(),
  };
}

export function mapVendorPaymentFromDb(row: any): VendorPaymentRecord {
  return {
    id: row.id,
    vendorId: row.vendor_id || '',
    vendorName: '',
    date: row.date || new Date().toISOString().split('T')[0],
    amount: Number(row.amount) || 0,
    ledgerType: row.ledger_type || 'billed',
    paymentMode: row.payment_mode || 'Cash',
    referenceNo: row.reference_no || undefined,
    notes: row.notes || undefined,
  };
}

// 8. ALTERATIONS (Tailor Job Tracker)
export function mapAlterationToDb(a: AlterationRecord) {
  return {
    id: a.id,
    sale_id: a.saleId || null,
    invoice_number: a.invoiceNumber || '',
    customer_name: a.customerName || '',
    customer_phone: a.customerPhone || '',
    garment_name: a.garmentName || '',
    size: a.size || '',
    color: a.color || '',
    alteration_notes: a.alterationNotes || '',
    tailor_name: a.tailorName || '',
    promised_date: a.promisedDate || '',
    status: a.status || 'Pending',
    created_date: a.createdDate || new Date().toISOString().split('T')[0],
    customer_notified_at: a.customerNotifiedAt || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapAlterationFromDb(row: any): AlterationRecord {
  return {
    id: row.id,
    saleId: row.sale_id || '',
    invoiceNumber: row.invoice_number || '',
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    garmentName: row.garment_name || '',
    size: row.size || '',
    color: row.color || '',
    alterationNotes: row.alteration_notes || '',
    tailorName: row.tailor_name || '',
    promisedDate: row.promised_date || '',
    status: row.status || 'Pending',
    createdDate: row.created_date || '',
    customerNotifiedAt: row.customer_notified_at || undefined,
  };
}

// 9. CREDIT NOTES (Returns & Exchanges)
export function mapCreditNoteToDb(cn: CreditNote) {
  return {
    id: cn.id,
    code: cn.code,
    original_invoice_number: cn.originalInvoiceNumber || '',
    company_id: cn.companyId || '',
    company_name: cn.companyName || '',
    customer_name: cn.customerName || '',
    customer_phone: cn.customerPhone || '',
    amount: cn.amount || 0,
    remaining_amount: cn.remainingAmount || 0,
    status: cn.status || 'active',
    issued_date: cn.issuedDate || '',
    expiry_date: cn.expiryDate || '',
    items_returned: cn.itemsReturned || [],
    notes: cn.notes || null,
    updated_at: new Date().toISOString(),
  };
}

export function mapCreditNoteFromDb(row: any): CreditNote {
  return {
    id: row.id,
    code: row.code,
    originalInvoiceNumber: row.original_invoice_number || '',
    companyId: row.company_id || '',
    companyName: row.company_name || '',
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
    amount: Number(row.amount) || 0,
    remainingAmount: Number(row.remaining_amount) || 0,
    status: row.status || 'active',
    issuedDate: row.issued_date || '',
    expiryDate: row.expiry_date || '',
    itemsReturned: row.items_returned || [],
    notes: row.notes || undefined,
  };
}

// 10. DAY REGISTERS (Till Float, Petty Expenses, Cashier Closing)
export function mapDayRegisterToDb(r: DayEndRegister) {
  return {
    id: r.id,
    date: r.date,
    company_id: r.companyId,
    opening_cash: r.openingCash || 0,
    expenses: r.expenses || [],
    closing_cash_counted: r.closingCashCounted !== undefined ? r.closingCashCounted : null,
    closing_notes: r.closingNotes || null,
    closed_at: r.closedAt || null,
    status: r.status || 'open',
    updated_at: new Date().toISOString(),
  };
}

export function mapDayRegisterFromDb(row: any): DayEndRegister {
  return {
    id: row.id,
    date: row.date,
    companyId: row.company_id,
    openingCash: Number(row.opening_cash) || 0,
    expenses: row.expenses || [],
    closingCashCounted: row.closing_cash_counted !== null ? Number(row.closing_cash_counted) : undefined,
    closingNotes: row.closing_notes || undefined,
    closedAt: row.closed_at || undefined,
    status: row.status || 'open',
  };
}

// 11. STAFF USERS (Settings & RBAC)
export function mapStaffUserToDb(u: UserAccount) {
  return {
    id: u.id,
    username: u.username,
    password: u.password,
    full_name: u.fullName,
    role: u.role,
    avatar: u.avatar || '',
    designation: u.designation || '',
    allowed_tabs: u.allowedTabs || [],
    updated_at: new Date().toISOString(),
  };
}

export function mapStaffUserFromDb(row: any): UserAccount {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    fullName: row.full_name || row.username,
    role: row.role || 'sales_cashier',
    avatar: row.avatar || '',
    designation: row.designation || '',
    allowedTabs: row.allowed_tabs || undefined,
  };
}

// -----------------------------------------------------------------------------
// COMPREHENSIVE PUSH ALL TO SUPABASE (COVERS EVERY SINGLE PAGE)
// -----------------------------------------------------------------------------

export async function pushAllToSupabase(payload: {
  companies: Company[];
  products: Product[];
  customers: Customer[];
  sales: SaleTransaction[];
  vendors: Vendor[];
  purchases: PurchaseOrder[];
  vendorPayments: VendorPaymentRecord[];
  alterations: AlterationRecord[];
  creditNotes: CreditNote[];
  dayRegister: DayEndRegister;
  users?: UserAccount[];
  coupons?: CouponCode[];
  loyaltyConfig?: LoyaltyConfig;
  settings?: Record<string, any>;
}): Promise<{ success: boolean; message: string; stats?: any }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase is not configured.' };
  }

  try {
    // 1. Companies (POS & Settings)
    if (payload.companies.length > 0) {
      const { error } = await supabase.from('companies').upsert(payload.companies.map(mapCompanyToDb));
      if (error) console.warn('Companies push warning:', error.message);
    }

    // 2. Products (Inventory, POS, Tags)
    if (payload.products.length > 0) {
      const { error } = await supabase.from('products').upsert(payload.products.map(mapProductToDb));
      if (error) console.warn('Products push warning:', error.message);
    }

    // 3. Customers (CRM & Loyalty)
    if (payload.customers.length > 0) {
      const { error } = await supabase.from('customers').upsert(payload.customers.map(mapCustomerToDb));
      if (error) console.warn('Customers push warning:', error.message);
    }

    // 4. Vendors (Suppliers)
    if (payload.vendors.length > 0) {
      const { error } = await supabase.from('vendors').upsert(payload.vendors.map(mapVendorToDb));
      if (error) console.warn('Vendors push warning:', error.message);
    }

    // 5. Purchases (Goods Inwards)
    if (payload.purchases && payload.purchases.length > 0) {
      const { error } = await supabase.from('purchases').upsert(payload.purchases.map(mapPurchaseToDb));
      if (error) console.warn('Purchases push warning:', error.message);
    }

    // 6. Vendor Payments
    if (payload.vendorPayments && payload.vendorPayments.length > 0) {
      const { error } = await supabase.from('vendor_payments').upsert(payload.vendorPayments.map(mapVendorPaymentToDb));
      if (error) console.warn('Vendor payments push warning:', error.message);
    }

    // 7. Sales (POS Invoices & Reports)
    if (payload.sales.length > 0) {
      const { error } = await supabase.from('sales').upsert(payload.sales.map(mapSaleToDb));
      if (error) console.warn('Sales push warning:', error.message);
    }

    // 8. Alterations (Tailor Tracker)
    if (payload.alterations && payload.alterations.length > 0) {
      const { error } = await supabase.from('alterations').upsert(payload.alterations.map(mapAlterationToDb));
      if (error) console.warn('Alterations push warning:', error.message);
    }

    // 9. Credit Notes (Returns & Exchanges)
    if (payload.creditNotes && payload.creditNotes.length > 0) {
      const { error } = await supabase.from('credit_notes').upsert(payload.creditNotes.map(mapCreditNoteToDb));
      if (error) console.warn('Credit notes push warning:', error.message);
    }

    // 10. Day Register (Z-Report & Reconciliation)
    if (payload.dayRegister) {
      const regDb = mapDayRegisterToDb(payload.dayRegister);
      const { error } = await supabase.from('day_registers').upsert(regDb);
      if (error) console.warn('Day registers push warning:', error.message);
    }

    // 11. Staff Users (Try staff_users table + fallback to app_settings)
    if (payload.users && payload.users.length > 0) {
      try {
        await supabase.from('staff_users').upsert(payload.users.map(mapStaffUserToDb));
      } catch {}
      await supabase.from('app_settings').upsert({
        key: 'staff_users',
        value: payload.users,
        updated_at: new Date().toISOString(),
      });
    }

    // 12. Coupons (Try coupons table + fallback to app_settings)
    if (payload.coupons && payload.coupons.length > 0) {
      try {
        await supabase.from('coupons').upsert(
          payload.coupons.map((c) => ({
            code: c.code,
            discount_type: c.discountType,
            discount_value: c.discountValue,
            min_bill_amount: c.minBillAmount || 0,
            description: c.description || null,
            created_at: new Date().toISOString(),
          }))
        );
      } catch {}
      await supabase.from('app_settings').upsert({
        key: 'coupons',
        value: payload.coupons,
        updated_at: new Date().toISOString(),
      });
    }

    // 13. App Settings (Loyalty rules, UPI QR, Terminal settings)
    if (payload.loyaltyConfig) {
      await supabase.from('app_settings').upsert({
        key: 'loyalty_config',
        value: payload.loyaltyConfig,
        updated_at: new Date().toISOString(),
      });
    }
    if (payload.settings) {
      await supabase.from('app_settings').upsert({
        key: 'terminal_settings',
        value: payload.settings,
        updated_at: new Date().toISOString(),
      });
    }

    const now = new Date().toISOString();
    try {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.LAST_SYNC, now);
    } catch {}

    return {
      success: true,
      message: `Successfully synchronized all pages & records to Supabase!`,
      stats: {
        products: payload.products.length,
        sales: payload.sales.length,
        customers: payload.customers.length,
        vendors: payload.vendors.length,
        purchases: payload.purchases ? payload.purchases.length : 0,
        alterations: payload.alterations ? payload.alterations.length : 0,
        creditNotes: payload.creditNotes ? payload.creditNotes.length : 0,
        timestamp: now,
      },
    };
  } catch (err: any) {
    console.error('pushAllToSupabase error:', err);
    return { success: false, message: err?.message || 'Error pushing data to Supabase.' };
  }
}

// -----------------------------------------------------------------------------
// COMPREHENSIVE PULL ALL FROM SUPABASE (COVERS EVERY SINGLE PAGE)
// -----------------------------------------------------------------------------

export async function pullAllFromSupabase(): Promise<{
  success: boolean;
  message: string;
  data?: {
    companies?: Company[];
    products?: Product[];
    customers?: Customer[];
    sales?: SaleTransaction[];
    vendors?: Vendor[];
    purchases?: PurchaseOrder[];
    vendorPayments?: VendorPaymentRecord[];
    alterations?: AlterationRecord[];
    creditNotes?: CreditNote[];
    dayRegister?: DayEndRegister;
    users?: UserAccount[];
    coupons?: CouponCode[];
    loyaltyConfig?: LoyaltyConfig;
    settings?: Record<string, any>;
  };
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase is not configured.' };
  }

  try {
    const [
      companiesRes,
      productsRes,
      customersRes,
      salesRes,
      vendorsRes,
      purchasesRes,
      paymentsRes,
      alterationsRes,
      creditNotesRes,
      dayRegRes,
      settingsRes,
    ] = await Promise.all([
      supabase.from('companies').select('*'),
      supabase.from('products').select('*'),
      supabase.from('customers').select('*'),
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('vendors').select('*'),
      supabase.from('purchases').select('*'),
      supabase.from('vendor_payments').select('*'),
      supabase.from('alterations').select('*'),
      supabase.from('credit_notes').select('*'),
      supabase.from('day_registers').select('*').order('date', { ascending: false }).limit(1),
      supabase.from('app_settings').select('*'),
    ]);

    // Parse App Settings
    let usersFromDb: UserAccount[] | undefined;
    let couponsFromDb: CouponCode[] | undefined;
    let loyaltyFromDb: LoyaltyConfig | undefined;
    let terminalSettings: Record<string, any> | undefined;

    if (settingsRes.data) {
      settingsRes.data.forEach((row: any) => {
        if (row.key === 'staff_users') usersFromDb = row.value;
        if (row.key === 'coupons') couponsFromDb = row.value;
        if (row.key === 'loyalty_config') loyaltyFromDb = row.value;
        if (row.key === 'terminal_settings') terminalSettings = row.value;
      });
    }

    const result = {
      companies: companiesRes.data && companiesRes.data.length > 0 ? companiesRes.data.map(mapCompanyFromDb) : undefined,
      products: productsRes.data && productsRes.data.length > 0 ? productsRes.data.map(mapProductFromDb) : undefined,
      customers: customersRes.data && customersRes.data.length > 0 ? customersRes.data.map(mapCustomerFromDb) : undefined,
      sales: salesRes.data && salesRes.data.length > 0 ? salesRes.data.map(mapSaleFromDb) : undefined,
      vendors: vendorsRes.data && vendorsRes.data.length > 0 ? vendorsRes.data.map(mapVendorFromDb) : undefined,
      purchases: purchasesRes.data && purchasesRes.data.length > 0 ? purchasesRes.data.map(mapPurchaseFromDb) : undefined,
      vendorPayments: paymentsRes.data && paymentsRes.data.length > 0 ? paymentsRes.data.map(mapVendorPaymentFromDb) : undefined,
      alterations: alterationsRes.data && alterationsRes.data.length > 0 ? alterationsRes.data.map(mapAlterationFromDb) : undefined,
      creditNotes: creditNotesRes.data && creditNotesRes.data.length > 0 ? creditNotesRes.data.map(mapCreditNoteFromDb) : undefined,
      dayRegister: dayRegRes.data && dayRegRes.data.length > 0 ? mapDayRegisterFromDb(dayRegRes.data[0]) : undefined,
      users: usersFromDb,
      coupons: couponsFromDb,
      loyaltyConfig: loyaltyFromDb,
      settings: terminalSettings,
    };

    const now = new Date().toISOString();
    try {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.LAST_SYNC, now);
    } catch {}

    return {
      success: true,
      message: 'Successfully pulled latest records for every page from Supabase!',
      data: result,
    };
  } catch (err: any) {
    console.error('pullAllFromSupabase error:', err);
    return { success: false, message: err?.message || 'Error pulling data from Supabase.' };
  }
}

// -----------------------------------------------------------------------------
// REAL-TIME BACKGROUND SYNC HELPERS (FOR IMMEDIATE PAGE ACTIONS)
// -----------------------------------------------------------------------------

export function asyncSyncSale(sale: SaleTransaction) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('sales')
    .upsert(mapSaleToDb(sale))
    .catch((err) => console.warn('Background Supabase sale sync network error:', err));
}

export function asyncSyncProduct(product: Product) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('products')
    .upsert(mapProductToDb(product))
    .catch((err) => console.warn('Background Supabase product sync network error:', err));
}

export function asyncSyncCustomer(customer: Customer) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('customers')
    .upsert(mapCustomerToDb(customer))
    .catch((err) => console.warn('Background Supabase customer sync network error:', err));
}

export function asyncSyncPurchase(purchase: PurchaseOrder) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('purchases')
    .upsert(mapPurchaseToDb(purchase))
    .catch((err) => console.warn('Background Supabase purchase sync network error:', err));
}

export function asyncSyncVendorPayment(payment: VendorPaymentRecord) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('vendor_payments')
    .upsert(mapVendorPaymentToDb(payment))
    .catch((err) => console.warn('Background Supabase vendor payment sync network error:', err));
}

export function asyncSyncAlteration(alteration: AlterationRecord) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('alterations')
    .upsert(mapAlterationToDb(alteration))
    .catch((err) => console.warn('Background Supabase alteration sync network error:', err));
}

export function asyncSyncCreditNote(creditNote: CreditNote) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('credit_notes')
    .upsert(mapCreditNoteToDb(creditNote))
    .catch((err) => console.warn('Background Supabase credit note sync network error:', err));
}

export function asyncSyncDayRegister(dayRegister: DayEndRegister) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('day_registers')
    .upsert(mapDayRegisterToDb(dayRegister))
    .catch((err) => console.warn('Background Supabase day register sync network error:', err));
}

export function asyncSyncSetting(key: string, value: any) {
  const supabase = getSupabase();
  if (!supabase) return;
  supabase
    .from('app_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    })
    .catch((err) => console.warn(`Background Supabase setting sync (${key}) error:`, err));
}
