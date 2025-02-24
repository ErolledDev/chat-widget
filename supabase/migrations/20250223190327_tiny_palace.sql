/*
  # Enhance widget settings with sales-focused fields

  1. New Fields
    - `products_services` (text[]): Array of products/services offered
    - `pricing_info` (jsonb): Pricing information for products/services
    - `target_audience` (text): Description of target customer base
    - `unique_selling_points` (text[]): Key differentiators and benefits
    - `common_questions` (jsonb): Frequently asked questions and answers
    - `sales_approach` (text): Preferred sales approach/tone
    - `competitor_info` (text): Information about competitors
    - `promotion_info` (jsonb): Current promotions and special offers

  2. Changes
    - Adds new columns to widget_settings table
    - Maintains existing RLS policies
    - Adds default values for new columns

  3. Security
    - Maintains existing RLS policies
    - All new fields inherit existing security rules
*/

-- Add new columns to widget_settings table
ALTER TABLE widget_settings
ADD COLUMN IF NOT EXISTS products_services text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pricing_info jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_audience text DEFAULT '',
ADD COLUMN IF NOT EXISTS unique_selling_points text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS common_questions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sales_approach text DEFAULT '',
ADD COLUMN IF NOT EXISTS competitor_info text DEFAULT '',
ADD COLUMN IF NOT EXISTS promotion_info jsonb DEFAULT '{}';

-- Add a comment to the table
COMMENT ON TABLE widget_settings IS 'Stores chat widget configuration and business information for AI-driven sales';

-- Add comments to the new columns
COMMENT ON COLUMN widget_settings.products_services IS 'Array of products and services offered by the business';
COMMENT ON COLUMN widget_settings.pricing_info IS 'Structured pricing information for products and services';
COMMENT ON COLUMN widget_settings.target_audience IS 'Description of ideal customer profile and target market';
COMMENT ON COLUMN widget_settings.unique_selling_points IS 'Array of key differentiators and benefits';
COMMENT ON COLUMN widget_settings.common_questions IS 'Frequently asked questions and their answers';
COMMENT ON COLUMN widget_settings.sales_approach IS 'Preferred sales approach and conversation tone';
COMMENT ON COLUMN widget_settings.competitor_info IS 'Information about competitors and market positioning';
COMMENT ON COLUMN widget_settings.promotion_info IS 'Current promotions, discounts, and special offers';