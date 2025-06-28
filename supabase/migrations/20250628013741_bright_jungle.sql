/*
  # Initial Schema Setup for Search and Rescue Application

  1. New Tables
    - `profiles`
      - User profiles with role-based access
    - `cases`
      - Missing person case records
    - `case_updates`
      - Updates and status changes for cases
    - `search_teams`
      - Search team information and assignments
    - `team_locations`
      - Real-time location tracking for search teams
    
  2. Security
    - Enable RLS on all tables
    - Set up access policies for different user roles
    - Secure sensitive information
*/

-- Create profiles table with text column for role instead of enum
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'viewer' CHECK (role IN ('admin', 'coordinator', 'field_agent', 'viewer')),
  phone text,
  organization text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cases table with text column for status instead of enum
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE NOT NULL,
  subject_name text NOT NULL,
  subject_age int,
  subject_description text,
  last_seen_location point,
  last_seen_timestamp timestamptz,
  reporter_name text NOT NULL,
  reporter_contact text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'active', 'resolved', 'closed')),
  priority int DEFAULT 1,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create case_updates table
CREATE TABLE IF NOT EXISTS case_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  update_type text NOT NULL,
  description text NOT NULL,
  location point,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create search_teams table with text column for status instead of enum
CREATE TABLE IF NOT EXISTS search_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  leader_id uuid REFERENCES profiles(id),
  status text DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'unavailable')),
  current_case_id uuid REFERENCES cases(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_locations table
CREATE TABLE IF NOT EXISTS team_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES search_teams(id) ON DELETE CASCADE,
  location point NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts
DO $$ 
BEGIN
  -- Drop policies for profiles
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'profiles') THEN
    DROP POLICY "Users can view their own profile" ON profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
    DROP POLICY "Users can update their own profile" ON profiles;
  END IF;
  
  -- Drop policies for cases
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view cases' AND tablename = 'cases') THEN
    DROP POLICY "Authenticated users can view cases" ON cases;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coordinators and admins can create cases' AND tablename = 'cases') THEN
    DROP POLICY "Coordinators and admins can create cases" ON cases;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coordinators and admins can update cases' AND tablename = 'cases') THEN
    DROP POLICY "Coordinators and admins can update cases" ON cases;
  END IF;
  
  -- Drop policies for case updates
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view case updates' AND tablename = 'case_updates') THEN
    DROP POLICY "Authenticated users can view case updates" ON case_updates;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Field agents and above can create updates' AND tablename = 'case_updates') THEN
    DROP POLICY "Field agents and above can create updates" ON case_updates;
  END IF;
  
  -- Drop policies for search teams
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view search teams' AND tablename = 'search_teams') THEN
    DROP POLICY "Authenticated users can view search teams" ON search_teams;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coordinators and admins can manage teams' AND tablename = 'search_teams') THEN
    DROP POLICY "Coordinators and admins can manage teams" ON search_teams;
  END IF;
  
  -- Drop policies for team locations
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view team locations' AND tablename = 'team_locations') THEN
    DROP POLICY "Authenticated users can view team locations" ON team_locations;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Field agents can update their team location' AND tablename = 'team_locations') THEN
    DROP POLICY "Field agents can update their team location" ON team_locations;
  END IF;
END $$;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for cases
CREATE POLICY "Authenticated users can view cases"
  ON cases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coordinators and admins can create cases"
  ON cases
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'admin')
    )
  );

CREATE POLICY "Coordinators and admins can update cases"
  ON cases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'admin')
    )
  );

-- Create policies for case updates
CREATE POLICY "Authenticated users can view case updates"
  ON case_updates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Field agents and above can create updates"
  ON case_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('field_agent', 'coordinator', 'admin')
    )
  );

-- Create policies for search teams
CREATE POLICY "Authenticated users can view search teams"
  ON search_teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coordinators and admins can manage teams"
  ON search_teams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'admin')
    )
  );

-- Create policies for team locations
CREATE POLICY "Authenticated users can view team locations"
  ON team_locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Field agents can update their team location"
  ON team_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM search_teams
      WHERE leader_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS cases_status_idx ON cases(status);
CREATE INDEX IF NOT EXISTS cases_created_at_idx ON cases(created_at);
CREATE INDEX IF NOT EXISTS case_updates_case_id_idx ON case_updates(case_id);
CREATE INDEX IF NOT EXISTS team_locations_team_id_idx ON team_locations(team_id);
CREATE INDEX IF NOT EXISTS cases_last_seen_location_idx ON cases USING GIST (last_seen_location);
CREATE INDEX IF NOT EXISTS team_locations_location_idx ON team_locations USING GIST (location);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cases_updated_at') THEN
    CREATE TRIGGER update_cases_updated_at
      BEFORE UPDATE ON cases
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_search_teams_updated_at') THEN
    CREATE TRIGGER update_search_teams_updated_at
      BEFORE UPDATE ON search_teams
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;