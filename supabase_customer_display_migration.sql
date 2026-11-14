-- =============================================================================
-- GARMENT OS - CUSTOMER DISPLAY SETTINGS & DIGITAL SIGNAGE MIGRATION
-- Run this script in the Supabase Dashboard -> SQL Editor -> Click 'Run'
-- Stores all Customer-Facing Screen studio preferences, festive themes,
-- idle slideshows, runway videos, marquee tickers, offer cards & payment QR.
-- Safe, idempotent, and non-destructive: uses IF NOT EXISTS throughout.
-- =============================================================================

-- 1. CREATE CUSTOMER DISPLAY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS customer_display_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  display_mode TEXT NOT NULL DEFAULT 'dark',
  active_festive_theme TEXT NOT NULL DEFAULT 'modern',
  brand_name_override TEXT,
  brand_tagline_override TEXT,
  store_phone TEXT,
  store_instagram TEXT,
  enable_slideshow BOOLEAN NOT NULL DEFAULT TRUE,
  slide_interval_seconds INT NOT NULL DEFAULT 6,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  enable_video_showcase BOOLEAN NOT NULL DEFAULT TRUE,
  video_url TEXT,
  video_title TEXT,
  video_subtitle TEXT,
  auto_loop_video BOOLEAN NOT NULL DEFAULT TRUE,
  auto_mute_video BOOLEAN NOT NULL DEFAULT TRUE,
  enable_marquee BOOLEAN NOT NULL DEFAULT TRUE,
  marquee_speed TEXT NOT NULL DEFAULT 'normal',
  marquee_text TEXT,
  enable_promo_cards BOOLEAN NOT NULL DEFAULT TRUE,
  promo_cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  show_dynamic_upi_qr BOOLEAN NOT NULL DEFAULT TRUE,
  upi_id_override TEXT,
  upi_merchant_name_override TEXT,
  customer_greeting_size TEXT NOT NULL DEFAULT '3xl',
  show_customer_loyalty BOOLEAN NOT NULL DEFAULT TRUE,
  show_customer_vip_badge BOOLEAN NOT NULL DEFAULT TRUE,
  mask_customer_phone BOOLEAN NOT NULL DEFAULT FALSE,
  show_savings_callout BOOLEAN NOT NULL DEFAULT TRUE,
  show_google_review_qr BOOLEAN NOT NULL DEFAULT TRUE,
  google_review_url TEXT,
  post_checkout_idle_timeout_seconds INT NOT NULL DEFAULT 15,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE customer_display_settings ENABLE ROW LEVEL SECURITY;

-- 3. PERMISSIVE POLICIES FOR POS BILLING & DUAL-SCREEN CLIENTS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customer_display_settings' 
    AND policyname = 'pos_customer_display_settings_all'
  ) THEN
    CREATE POLICY pos_customer_display_settings_all 
    ON customer_display_settings 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;

-- 4. INSERT DEFAULT SEED RECORD IF NONE EXISTS
INSERT INTO customer_display_settings (
  id,
  display_mode,
  active_festive_theme,
  enable_slideshow,
  slide_interval_seconds,
  enable_video_showcase,
  video_url,
  video_title,
  video_subtitle,
  enable_marquee,
  marquee_speed,
  marquee_text,
  enable_promo_cards,
  show_dynamic_upi_qr,
  customer_greeting_size,
  show_customer_loyalty,
  show_customer_vip_badge,
  mask_customer_phone,
  show_savings_callout,
  show_google_review_qr
)
VALUES (
  'default',
  'dark',
  'modern',
  TRUE,
  6,
  TRUE,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'Runway Highlights & Fresh Arrivals',
  'Watch our master artisan collection come alive in fluid drape and motion.',
  TRUE,
  'normal',
  '✨ Welcome to our Store • Complimentary Master-Tailor Alterations • Instant UPI, Card & Cash Payments Accepted • 7-Day Exchange Guarantee with Tags • Follow us for latest drops!',
  TRUE,
  TRUE,
  '3xl',
  TRUE,
  TRUE,
  FALSE,
  TRUE,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT id, display_mode, active_festive_theme, enable_slideshow, enable_video_showcase, updated_at 
FROM customer_display_settings;

