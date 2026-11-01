import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Server,
  FileCode,
  ShieldCheck,
  Zap,
  Info,
  X,
} from 'lucide-react';

const SUPABASE_SCHEMA_SQL = `-- =============================================================================
-- GARMENT OS RETAIL POS - COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Run this script in the Supabase Dashboard -> SQL Editor -> Click 'Run'
-- =============================================================================

-- 1. COMPANIES & STORES (Multi-Entity / Cash vs Billed Counter)
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

-- 6. PURCHASES (DUAL LEDGER: CASH VS BILLED)
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

-- 11. APP SETTINGS & CONFIGURATIONS
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
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
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pos_app_settings_all') THEN
    CREATE POLICY pos_app_settings_all ON app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;

export const SupabaseDatabaseSettings: React.FC = () => {
  const {
    supabaseConfig,
    saveSupabaseCreds,
    clearSupabaseCreds,
    pushToSupabase,
    pullFromSupabase,
    testSupabase,
    lastSupabaseSync,
    isSupabaseAutoSync,
    setIsSupabaseAutoSync,
  } = useApp();

  const [urlInput, setUrlInput] = useState(supabaseConfig.url);
  const [keyInput, setKeyInput] = useState(supabaseConfig.anonKey);
  const [showKey, setShowKey] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [schemaCopied, setSchemaCopied] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabase(urlInput, keyInput);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      setTestResult({ success: false, message: 'Please enter both the Supabase URL and Anon Public Key.' });
      return;
    }

    saveSupabaseCreds(urlInput, keyInput);
    // Automatically trigger test
    await handleTestConnection();
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Supabase? The POS will switch to local browser storage mode.')) {
      clearSupabaseCreds();
      setUrlInput('');
      setKeyInput('');
      setTestResult(null);
      setSyncFeedback({ type: 'success', message: 'Disconnected Supabase. Switched to offline local storage mode.' });
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const handlePushAll = async () => {
    if (!supabaseConfig.isConfigured && (!urlInput || !keyInput)) {
      setSyncFeedback({ type: 'error', message: 'Configure and save Supabase credentials first.' });
      return;
    }

    if (confirm('This will upload all current local inventory, customers, invoices, and register data to your Supabase PostgreSQL database. Proceed?')) {
      setIsPushing(true);
      setSyncFeedback(null);
      try {
        const res = await pushToSupabase();
        if (res.success) {
          setSyncFeedback({ type: 'success', message: res.message });
        } else {
          setSyncFeedback({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setSyncFeedback({ type: 'error', message: err?.message || 'Push failed.' });
      } finally {
        setIsPushing(false);
      }
    }
  };

  const handlePullAll = async () => {
    if (!supabaseConfig.isConfigured && (!urlInput || !keyInput)) {
      setSyncFeedback({ type: 'error', message: 'Configure and save Supabase credentials first.' });
      return;
    }

    if (confirm('This will download catalog, customer, and sales records from Supabase into your browser. Proceed?')) {
      setIsPulling(true);
      setSyncFeedback(null);
      try {
        const res = await pullFromSupabase();
        if (res.success) {
          setSyncFeedback({ type: 'success', message: res.message });
        } else {
          setSyncFeedback({ type: 'error', message: res.message });
        }
      } catch (err: any) {
        setSyncFeedback({ type: 'error', message: err?.message || 'Pull failed.' });
      } finally {
        setIsPulling(false);
      }
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL).then(() => {
      setSchemaCopied(true);
      setTimeout(() => setSchemaCopied(false), 2500);
    });
  };

  const formattedLastSync = lastSupabaseSync
    ? new Date(lastSupabaseSync).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {syncFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-in fade-in ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Status & Architecture Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Supabase Cloud Database</h3>
              {supabaseConfig.isConfigured ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Local Storage Mode (Offline)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Connect your Garment POS to a high-speed PostgreSQL cloud database on Supabase.
              Enables multi-counter terminals, real-time shared inventory, and automatic cloud backups.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Offline-Resilient POS Architecture</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Cloud Sync: <strong>{formattedLastSync}</strong></span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
          <button
            onClick={() => setIsSchemaModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>SQL Schema Script</span>
          </button>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
          >
            <span>Supabase Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Grid: Credentials Configuration + Quick Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Credentials Form & Sync Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Credentials Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span>Connection Credentials</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {supabaseConfig.source === 'env'
                    ? 'Loaded from .env environment variables.'
                    : 'Configured locally in browser storage.'}
                </p>
              </div>
              {supabaseConfig.isConfigured && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Found in Supabase: Project Settings → API → Project URL
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Anon Public Key (API Key)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showKey ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Found in Supabase: Project Settings → API → Project API Keys → `anon` `public`
                </span>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !urlInput.trim() || !keyInput.trim()}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sync & Migration Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-indigo-600" />
                  <span>Cloud Synchronization & Migration</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Manually push or pull datasets, or leave automatic background sync on.
                </p>
              </div>

              {/* Auto Sync Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSupabaseAutoSync}
                  onChange={(e) => setIsSupabaseAutoSync(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">Auto-Sync On Checkout</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Push to Supabase */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <CloudUpload className="w-4 h-4 text-indigo-600" />
                    <span>Push Local to Cloud</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Uploads current device inventory, customers, invoices, and settings to Supabase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePushAll}
                  disabled={isPushing}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPushing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Pushing Data...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>Push All to Supabase</span>
                    </>
                  )}
                </button>
              </div>

              {/* Pull from Supabase */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-1">
                    <CloudDownload className="w-4 h-4 text-emerald-600" />
                    <span>Pull Cloud to Local</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Fetches latest product catalog, stock updates, and sales from Supabase to this device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePullAll}
                  disabled={isPulling}
                  className="w-full py-2 px-3 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPulling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
                      <span>Pulling Data...</span>
                    </>
                  ) : (
                    <>
                      <CloudDownload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pull From Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-Step Guide & Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-indigo-300">
              <Zap className="w-4 h-4" />
              <span>3-Step Supabase Setup Guide</span>
            </h4>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-white">Create a Supabase Project</strong>
                  <p className="text-slate-400 mt-0.5">
                    Sign in to{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 underline hover:text-indigo-300"
                    >
                      supabase.com
                    </a>{' '}
                    (Free plan) and click <strong>New Project</strong>. Choose any name and region (e.g. Mumbai/India).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-white">Run the SQL Schema</strong>
                  <p className="text-slate-400 mt-0.5">
                    Navigate to the <strong>SQL Editor</strong> tab on the left menu. Copy our ready-to-run schema script and click <strong>Run</strong>.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySchema}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {schemaCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Schema SQL</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSchemaModalOpen(true)}
                      className="text-[11px] text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
                    >
                      Preview SQL
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-white">Copy API Credentials</strong>
                  <p className="text-slate-400 mt-0.5">
                    Go to <strong>Project Settings → API</strong>. Copy the <strong>Project URL</strong> and <strong>`anon` `public` key</strong>, paste them into the form on the left, and click <strong>Save & Connect</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Once connected, click <strong>Push All to Supabase</strong> to migrate your existing stock, customers, and invoice records to the cloud.
              </span>
            </div>
          </div>

          {/* Offline Resilience Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Retail Cash Counter Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Even if your internet connection disconnects mid-day, the POS will continue billing seamlessly without interruption. Sales are saved locally in the browser and will sync back to Supabase as soon as connection is restored.
            </p>
          </div>
        </div>
      </div>

      {/* SQL Schema Preview Modal */}
      {isSchemaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col my-6 animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">Supabase PostgreSQL Schema Script</h3>
                  <p className="text-[11px] text-slate-400">
                    Creates tables for Products, Sales, Customers, Vendors, and Cash Registers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSchemaModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 max-h-[60vh] overflow-y-auto">
              <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap select-all">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>

            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                File also saved in project root as <code>supabase_schema.sql</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  {schemaCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL Script</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSchemaModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

