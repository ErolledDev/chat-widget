/*
  # Fix duplicate widget settings

  1. Changes
    - Remove duplicate entries from widget_settings table
    - Keep only the most recently updated row for each user
    - Ensure user_id constraint is properly enforced

  2. Security
    - Maintains existing RLS policies
*/

-- Create a temporary table to store the latest settings for each user
CREATE TEMP TABLE latest_settings AS
SELECT DISTINCT ON (user_id)
  id,
  user_id,
  primary_color,
  business_name,
  business_info,
  sales_rep_name,
  created_at,
  updated_at
FROM widget_settings
ORDER BY user_id, updated_at DESC;

-- Delete all rows from widget_settings
DELETE FROM widget_settings;

-- Reinsert only the latest settings for each user
INSERT INTO widget_settings
SELECT * FROM latest_settings;

-- Drop the temporary table
DROP TABLE latest_settings;

-- Ensure the unique constraint on user_id is properly enforced
ALTER TABLE widget_settings DROP CONSTRAINT IF EXISTS widget_settings_user_id_key;
ALTER TABLE widget_settings ADD CONSTRAINT widget_settings_user_id_key UNIQUE (user_id);