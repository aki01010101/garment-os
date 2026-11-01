-- =============================================================================
-- GARMENT OS RETAIL POS - COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Comprehensive schema for EVERY page and module in Garment POS
-- Run this script in the Supabase Dashboard -> SQL Editor -> Click 'Run'
-- =============================================================================

-- 1. COMPANIES & STORES (Multi-Entity / Cash vs Billed Counter)
-- Used on: POS Billing, Day Register, Settings Entities, Receipt Headers
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  type TEXT NOT NULL DEFAULT 'billed',
  tax_id TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  current_invoice_number INT DEFAULT 1000,
  return_policy TEXT,
  accent_color TEXT DEFAULT '#4f46e5',
  tagline TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS & INVENTORY
-- Used on: POS Billing, Inventory Manager, Price Tags Generator, Reports & Taxes
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  size TEXT,
  color TEXT,
  season TEXT,
  cost_price NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  stock INT DEFAULT 0,
  defective_stock INT DEFAULT 0,
  min_stock_alert INT DEFAULT 5,
  tax_rate NUMERIC(5,2) DEFAULT 5,
  purchase_source TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

-- 3. CUSTOMERS & CRM
-- Used on: POS Billing, CRM & Loyalty, Reports & Taxes
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  loyalty_points NUMERIC(12,2) DEFAULT 0,
  total_spend NUMERIC(12,2) DEFAULT 0,
  total_visits INT DEFAULT 0,
  created_at TEXT,
  last_purchase_date TEXT,
  notes TEXT,
  is_vip BOOLEAN DEFAULT FALSE,
  profile JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);

-- 4. SALES TRANSACTIONS & INVOICES
-- Used on: POS Billing, Returns & Credit, Reports & Taxes, CRM Purchase History
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  company_id TEXT NOT NULL,
  company_name TEXT,
  company_tax_id TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_return_policy TEXT,
  date TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) DEFAULT 0,
  item_discounts_total NUMERIC(12,2) DEFAULT 0,
  loyalty_points_used NUMERIC(12,2) DEFAULT 0,
  loyalty_discount_amount NUMERIC(12,2) DEFAULT 0,
  coupon_code_applied TEXT,
  coupon_discount_amount NUMERIC(12,2) DEFAULT 0,
  credit_note_code_applied TEXT,
  credit_note_discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_total NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) DEFAULT 0,
  payment_mode TEXT NOT NULL,
  cash_tendered NUMERIC(12,2),
  change_due NUMERIC(12,2),
  split_breakdown JSONB,
  notes TEXT,
  cashier_name TEXT,
  sales_associate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales (invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (date);
CREATE INDEX IF NOT EXISTS idx_sales_customer_phone ON sales (customer_phone);

-- 5. VENDORS & SUPPLIERS
-- Used on: Vendors & Stock Entry (Supplier Ledgers)
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  gstin TEXT,
  billed_payable_balance NUMERIC(12,2) DEFAULT 0,
  cash_payable_balance NUMERIC(12,2) DEFAULT 0,
  total_billed_purchased NUMERIC(12,2) DEFAULT 0,
  total_cash_purchased NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PURCHASES (DUAL LEDGER: CASH VS BILLED GOODS RECEIVED)
-- Used on: Vendors & Stock Entry (Goods Inwards & Invoices)
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  purchase_number TEXT NOT NULL,
  vendor_id TEXT,
  vendor_name TEXT,
  date TEXT NOT NULL,
  invoice_type TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT,
  payment_mode TEXT,
  notes TEXT,
  company_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VENDOR PAYMENTS
-- Used on: Vendors & Stock Entry (Payment Vouchers & Settlements)
CREATE TABLE IF NOT EXISTS vendor_payments (
  id TEXT PRIMARY KEY,
  purchase_id TEXT,
  vendor_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_mode TEXT NOT NULL,
  ledger_type TEXT NOT NULL,
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ALTERATION & TAILOR JOBS
-- Used on: Alterations Tracker, POS Billing Checkout Slips
CREATE TABLE IF NOT EXISTS alterations (
  id TEXT PRIMARY KEY,
  sale_id TEXT,
  invoice_number TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  garment_name TEXT,
  size TEXT,
  color TEXT,
  alteration_notes TEXT,
  tailor_name TEXT,
  promised_date TEXT,
  status TEXT DEFAULT 'Pending',
  created_date TEXT,
  customer_notified_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREDIT NOTES (RETURNS & EXCHANGES)
-- Used on: Returns & Credit Page, POS Billing Redemption
CREATE TABLE IF NOT EXISTS credit_notes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  original_invoice_number TEXT,
  company_id TEXT,
  company_name TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  amount NUMERIC(12,2) NOT NULL,
  remaining_amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'active',
  issued_date TEXT,
  expiry_date TEXT,
  items_returned JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DAY REGISTERS & Z-REPORTS
-- Used on: Day Register (Z), Close Day & Count Cash, End of Day Summary
CREATE TABLE IF NOT EXISTS day_registers (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  company_id TEXT NOT NULL,
  opening_cash NUMERIC(12,2) DEFAULT 0,
  expenses JSONB DEFAULT '[]'::jsonb,
  closing_cash_counted NUMERIC(12,2),
  closing_notes TEXT,
  closed_at TEXT,
  status TEXT DEFAULT 'open',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STAFF USERS & PERMISSIONS (RBAC)
-- Used on: Settings Staff, Login / Lock Screen, Cashier Tracking
CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales_cashier',
  avatar TEXT,
  designation TEXT,
  allowed_tabs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. COUPONS & PROMO DISCOUNTS
-- Used on: POS Billing Discounts & Coupons
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(12,2) NOT NULL,
  min_bill_amount NUMERIC(12,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. APP SETTINGS & CONFIGURATIONS
-- Used on: Settings Store Preferences, Terminal Security, Dynamic UPI QR, Barcode/QR formats
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_companies_all') THEN
    CREATE POLICY pos_companies_all ON companies FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_products_all') THEN
    CREATE POLICY pos_products_all ON products FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_customers_all') THEN
    CREATE POLICY pos_customers_all ON customers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_sales_all') THEN
    CREATE POLICY pos_sales_all ON sales FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_vendors_all') THEN
    CREATE POLICY pos_vendors_all ON vendors FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_purchases_all') THEN
    CREATE POLICY pos_purchases_all ON purchases FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_vendor_payments_all') THEN
    CREATE POLICY pos_vendor_payments_all ON vendor_payments FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_alterations_all') THEN
    CREATE POLICY pos_alterations_all ON alterations FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_credit_notes_all') THEN
    CREATE POLICY pos_credit_notes_all ON credit_notes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_day_registers_all') THEN
    CREATE POLICY pos_day_registers_all ON day_registers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_staff_users_all') THEN
    CREATE POLICY pos_staff_users_all ON staff_users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_coupons_all') THEN
    CREATE POLICY pos_coupons_all ON coupons FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_app_settings_all') THEN
    CREATE POLICY pos_app_settings_all ON app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
