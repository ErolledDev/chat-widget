/*
  # Add business information columns

  1. New Columns
    - products_services (text[]) - Array of products and services
    - pricing_info (jsonb) - Structured pricing information
    - target_audience (text) - Description of target market
    - unique_selling_points (text[]) - Array of USPs
    - common_questions (jsonb) - FAQ data
    - sales_approach (text) - Sales conversation style
    - competitor_info (text) - Market positioning
    - promotion_info (jsonb) - Current offers

  2. Changes
    - Adds default values for all new columns
    - Adds helpful column comments
*/

-- Add new columns to widget_settings table
DO $$ 
BEGIN
  -- Add products_services column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_settings' AND column_name = 'products_services'
  ) THEN
    ALTER TABLE widget_settings ADD COLUMN products_services text[] DEFAULT '{}';
  END IF;

  -- Add pricing_info column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_settings' AND column_name = 'pricing_info'
  ) THEN
    ALTER TABLE widget_settings ADD COLUMN pricing_info jsonb DEFAULT '{}';
  END IF;

  -- Add target_audience column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_settings' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE widget_settings ADD COLUMN target_audience text DEFAULT '';
  END IF;

  -- Add unique_selling_points column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_settings' AND column_name = 'unique_selling_points'
  ) THEN
    ALTER TABLE widget_settings ADD COLUMN unique_selling_points text[] DEFAULT '{}';
  END IF;

  -- Add common_questions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_settings' AND column_name = 'common_questions'
  ) THEN
    ALTER TABLE widget_settings ADD COLUMN common_questions jsonb DEFAULT '{}';
  END IF;

  -- Add sales_approach column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_settings' AND column_name = 'sales_approach'
  ) THEN
    ALTER TABLE widget_settings ADD COLUMN sales_approach text DEFAULT '';
  END IF;

  -- Add competitor_info column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_settings' AND column_name = 'competitor_info'
  ) THEN
    ALTER TABLE widget_settings ADD COLUMN competitor_info text DEFAULT '';
  END IF;

  -- Add promotion_info column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widget_settings' AND column_name = 'promotion_info'
  ) THEN
    ALTER TABLE widget_settings ADD COLUMN promotion_info jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add comments to the table and columns
COMMENT ON TABLE widget_settings IS 'Stores chat widget configuration and business information for AI-driven sales';

COMMENT ON COLUMN widget_settings.products_services IS 'Array of products and services offered by the business';
COMMENT ON COLUMN widget_settings.pricing_info IS 'Structured pricing information for products and services';
COMMENT ON COLUMN widget_settings.target_audience IS 'Description of ideal customer profile and target market';
COMMENT ON COLUMN widget_settings.unique_selling_points IS 'Array of key differentiators and benefits';
COMMENT ON COLUMN widget_settings.common_questions IS 'Frequently asked questions and their answers';
COMMENT ON COLUMN widget_settings.sales_approach IS 'Preferred sales approach and conversation tone';
COMMENT ON COLUMN widget_settings.competitor_info IS 'Information about competitors and market positioning';
COMMENT ON COLUMN widget_settings.promotion_info IS 'Current promotions, discounts, and special offers';