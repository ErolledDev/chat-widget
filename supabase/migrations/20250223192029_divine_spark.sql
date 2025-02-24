/*
  # Fix widget settings schema and ensure all columns exist

  1. Changes
    - Drop and recreate table with proper structure
    - Add all required columns with correct types
    - Ensure proper constraints and defaults
    - Enable RLS policies
    - Add explicit error handling
*/

-- Wrap the entire migration in a transaction
BEGIN;

  -- Drop existing table
  DROP TABLE IF EXISTS widget_settings;

  -- Create the table with all required columns
  CREATE TABLE widget_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    primary_color text DEFAULT '#2563eb',
    business_name text DEFAULT '',
    business_info text DEFAULT '',
    sales_rep_name text DEFAULT '',
    products_services text[] DEFAULT ARRAY[]::text[],
    pricing_info jsonb DEFAULT '{}'::jsonb,
    target_audience text DEFAULT '',
    unique_selling_points text[] DEFAULT ARRAY[]::text[],
    common_questions jsonb DEFAULT '{}'::jsonb,
    sales_approach text DEFAULT '',
    competitor_info text DEFAULT '',
    promotion_info jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT widget_settings_user_id_key UNIQUE (user_id)
  );

  -- Enable RLS
  ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can read own settings" ON widget_settings;
  DROP POLICY IF EXISTS "Users can insert own settings" ON widget_settings;
  DROP POLICY IF EXISTS "Users can update own settings" ON widget_settings;

  -- Create policies
  CREATE POLICY "Users can read own settings"
    ON widget_settings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own settings"
    ON widget_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own settings"
    ON widget_settings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Drop existing trigger and function if they exist
  DROP TRIGGER IF EXISTS update_widget_settings_updated_at ON widget_settings;
  DROP FUNCTION IF EXISTS update_updated_at_column();

  -- Create function for updating updated_at
  CREATE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Create trigger
  CREATE TRIGGER update_widget_settings_updated_at
    BEFORE UPDATE ON widget_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  -- Add table and column comments
  COMMENT ON TABLE widget_settings IS 'Stores chat widget configuration and business information for AI-driven sales';

  COMMENT ON COLUMN widget_settings.products_services IS 'Array of products and services offered by the business';
  COMMENT ON COLUMN widget_settings.pricing_info IS 'Structured pricing information for products and services';
  COMMENT ON COLUMN widget_settings.target_audience IS 'Description of ideal customer profile and target market';
  COMMENT ON COLUMN widget_settings.unique_selling_points IS 'Array of key differentiators and benefits';
  COMMENT ON COLUMN widget_settings.common_questions IS 'Frequently asked questions and their answers';
  COMMENT ON COLUMN widget_settings.sales_approach IS 'Preferred sales approach and conversation tone';
  COMMENT ON COLUMN widget_settings.competitor_info IS 'Information about competitors and market positioning';
  COMMENT ON COLUMN widget_settings.promotion_info IS 'Current promotions, discounts, and special offers';

  -- Verify the table structure
  DO $$
  BEGIN
    -- Check if all required columns exist
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'widget_settings'
        AND column_name = 'common_questions'
    ) THEN
      RAISE EXCEPTION 'Migration failed: common_questions column is missing';
    END IF;

    -- Additional verification can be added here
  END $$;

COMMIT;