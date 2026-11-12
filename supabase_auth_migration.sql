-- =============================================================================
-- GARMENT OS - MULTI-DEVICE CLOUD AUTH & USER MAPPING MIGRATION
-- Run this script in the Supabase Dashboard -> SQL Editor -> Click 'Run'
-- Maps all POS store data to authenticated Supabase accounts (Google / Email)
-- Safe, idempotent, and resilient: works whether tables already exist or not!
-- =============================================================================

-- 1. CREATE ANY MISSING POS TABLES IF THEY DO NOT EXIST YET
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
  enable_dynamic_garment_gst BOOLEAN DEFAULT TRUE,
  tax_inclusive BOOLEAN DEFAULT TRUE,
  is_composition_scheme BOOLEAN DEFAULT FALSE,
  google_review_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  tax_inclusive BOOLEAN DEFAULT TRUE,
  purchase_source TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  tax_inclusive BOOLEAN DEFAULT TRUE,
  google_review_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS day_registers (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  company_id TEXT NOT NULL,
  opening_cash NUMERIC(12,2) DEFAULT 0,
  expenses JSONB DEFAULT '[]'::jsonb,
  cash_drops JSONB DEFAULT '[]'::jsonb,
  closing_cash_counted NUMERIC(12,2),
  closing_notes TEXT,
  closed_at TEXT,
  status TEXT DEFAULT 'open',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS parked_carts (
  id TEXT PRIMARY KEY,
  ticket_number INT NOT NULL,
  label TEXT,
  parked_at TEXT,
  cashier_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  selected_associate TEXT,
  applied_coupon JSONB,
  applied_credit_note JSONB,
  redeemed_points NUMERIC(12,2) DEFAULT 0,
  subtotal NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(12,2) NOT NULL,
  min_bill_amount NUMERIC(12,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_category TEXT,
  min_quantity INTEGER,
  free_quantity INTEGER,
  bundle_price NUMERIC(12,2),
  min_cart_amount NUMERIC(12,2),
  slab_discount_amount NUMERIC(12,2),
  slab_discount_percent NUMERIC(5,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_audits (
  id TEXT PRIMARY KEY,
  session_name TEXT NOT NULL,
  audited_at TIMESTAMPTZ DEFAULT NOW(),
  auditor_name TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  category_filter TEXT,
  notes TEXT,
  total_expected_qty INTEGER DEFAULT 0,
  total_counted_qty INTEGER DEFAULT 0,
  discrepancy_cost NUMERIC(12,2) DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id TEXT PRIMARY KEY,
  transfer_number TEXT NOT NULL UNIQUE,
  date TIMESTAMPTZ DEFAULT NOW(),
  source_branch TEXT NOT NULL,
  destination_branch TEXT NOT NULL,
  dispatched_by TEXT NOT NULL,
  received_by TEXT,
  received_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_transit',
  total_dispatched_qty INTEGER NOT NULL DEFAULT 0,
  total_received_qty INTEGER,
  vehicle_or_challan_no TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS associate_commissions (
  associate_name TEXT PRIMARY KEY,
  monthly_sales_target NUMERIC(12,2) DEFAULT 150000,
  base_commission_percent NUMERIC(5,2) DEFAULT 1.5,
  bonus_commission_percent NUMERIC(5,2) DEFAULT 2.5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_segment TEXT NOT NULL,
  message_template TEXT NOT NULL,
  coupon_code TEXT,
  discount_text TEXT
);

CREATE TABLE IF NOT EXISTS gift_vouchers (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  barcode TEXT NOT NULL,
  initial_amount NUMERIC(12,2) NOT NULL,
  current_balance NUMERIC(12,2) NOT NULL,
  issued_to_name TEXT NOT NULL,
  issued_to_phone TEXT NOT NULL,
  sender_name TEXT,
  message TEXT,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_by TEXT,
  redemptions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_measurements (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  garment_type TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS associate_commission_payouts (
  id TEXT PRIMARY KEY,
  associate_name TEXT NOT NULL,
  period_month TEXT NOT NULL,
  total_sales_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  bills_handled INTEGER NOT NULL DEFAULT 0,
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_achieved_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_payout NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SAFE & DYNAMIC COLUMN ADDITION, INDEXING, AND RLS ENFORCEMENT
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT unnest(ARRAY[
      'companies', 'products', 'customers', 'sales', 'vendors', 'purchases',
      'vendor_payments', 'alterations', 'credit_notes', 'day_registers',
      'staff_users', 'parked_carts', 'coupons', 'app_settings', 'promotions',
      'stock_audits', 'stock_transfers', 'associate_commissions',
      'campaign_templates', 'gift_vouchers', 'customer_measurements',
      'associate_commission_payouts'
    ])
  LOOP
    -- Only operate on tables that actually exist in the public schema
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN

      -- 1. Add user_id column if not already present
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
      ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;', tbl);
      END IF;

      -- 2. Create index on user_id
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (user_id);', format('idx_%s_user_id', tbl), tbl);

      -- 3. Enable RLS
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);

      -- 4. Clean up any existing policies
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', format('pos_%s_all', tbl), tbl);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', format('user_owns_%s', tbl), tbl);

      -- 5. Create secure multi-tenant RLS policy
      -- Allows authenticated users to manage their data, plus unclaimed demo data
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);',
        format('user_owns_%s', tbl),
        tbl
      );

    END IF;
  END LOOP;

  -- 3. ENSURE RECENT NEW COLUMNS EXIST ON LEGACY COMPANIES TABLE
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'is_composition_scheme') THEN
      ALTER TABLE companies ADD COLUMN is_composition_scheme BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'tax_inclusive') THEN
      ALTER TABLE companies ADD COLUMN tax_inclusive BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'google_review_url') THEN
      ALTER TABLE companies ADD COLUMN google_review_url TEXT;
    END IF;
  END IF;
END $$;
