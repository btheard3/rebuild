/*
  # Emergency Contacts Schema

  1. New Tables
    - `emergency_contacts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `relationship` (text)
      - `phone` (text)
      - `email` (text)
      - `is_primary` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `emergency_contacts` table
    - Add policy for users to manage their own contacts
*/

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own emergency contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON emergency_contacts(is_primary) WHERE is_primary = true;

-- Function to ensure only one primary contact per user
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE emergency_contacts 
    SET is_primary = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_contact_trigger
  BEFORE INSERT OR UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_contact();