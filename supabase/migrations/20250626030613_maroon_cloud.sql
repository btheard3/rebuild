/*
  # Local Resources Schema

  1. New Tables
    - `local_resources`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `contact_info` (jsonb)
      - `location` (jsonb)
      - `availability` (jsonb)
      - `rating` (numeric)
      - `verified` (boolean)
      - `created_at` (timestamp)

    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `resource_id` (uuid, foreign key to local_resources)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_favorites` table
    - Public read access for `local_resources`
    - Admin write access for `local_resources`
*/

-- Create local_resources table if it doesn't exist
CREATE TABLE IF NOT EXISTS local_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('emergency', 'financial', 'housing', 'medical', 'legal', 'mental-health', 'food', 'utilities')),
  contact_info jsonb DEFAULT '{}', -- phone, website, email
  location jsonb DEFAULT '{}', -- address, coordinates, service_area
  availability jsonb DEFAULT '{}', -- hours, days, special_notes
  rating numeric(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid REFERENCES local_resources(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- Enable RLS on tables
ALTER TABLE local_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'local_resources' 
    AND policyname = 'Anyone can read local resources'
  ) THEN
    DROP POLICY "Anyone can read local resources" ON local_resources;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'local_resources' 
    AND policyname = 'Admins can manage local resources'
  ) THEN
    DROP POLICY "Admins can manage local resources" ON local_resources;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_favorites' 
    AND policyname = 'Users can manage their own favorites'
  ) THEN
    DROP POLICY "Users can manage their own favorites" ON user_favorites;
  END IF;
END $$;

-- Create policies
CREATE POLICY "Anyone can read local resources"
  ON local_resources
  FOR SELECT
  TO public
  USING (true);

-- Admin write access for resources
CREATE POLICY "Admins can manage local resources"
  ON local_resources
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role')::text = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role')::text = 'admin');

CREATE POLICY "Users can manage their own favorites"
  ON user_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_local_resources_category ON local_resources(category);
CREATE INDEX IF NOT EXISTS idx_local_resources_verified ON local_resources(verified);
CREATE INDEX IF NOT EXISTS idx_local_resources_rating ON local_resources(rating DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_resource_id ON user_favorites(resource_id);

-- Full-text search index for resources
CREATE INDEX IF NOT EXISTS idx_local_resources_search 
  ON local_resources 
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));