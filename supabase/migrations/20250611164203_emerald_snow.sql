/*
  # Enhanced Database Schema for Disaster Recovery App

  1. New Tables
    - `disaster_events` - Track actual disaster events and their impact areas
    - `community_posts` - Allow users to share updates and help requests
    - `resource_requests` - Users can request specific resources
    - `volunteer_opportunities` - Connect volunteers with those in need
    - `insurance_claims` - Track insurance claim progress
    - `recovery_milestones` - Track specific recovery goals and progress
    - `user_locations` - Store user location data for proximity-based features
    - `push_notification_tokens` - Store device tokens for push notifications
    - `data_exports` - Track user data export requests for GDPR compliance

  2. Enhanced Tables
    - Add columns to existing tables for better functionality
    - Improve indexing for performance
    - Add better constraints and validation

  3. Security
    - Enhanced RLS policies
    - Better data protection
    - Audit logging capabilities
*/

-- Create disaster_events table to track actual disasters
CREATE TABLE IF NOT EXISTS disaster_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('hurricane', 'flood', 'fire', 'earthquake', 'tornado', 'other')),
  severity text NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'catastrophic')),
  affected_area geometry(POLYGON, 4326), -- Geographic area affected
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved')),
  official_declaration_number text,
  federal_disaster_declaration boolean DEFAULT false,
  estimated_damage_cost bigint, -- in cents to avoid floating point issues
  population_affected integer,
  description text,
  response_agencies text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create community_posts table for user-generated content and mutual aid
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  disaster_event_id uuid REFERENCES disaster_events(id) ON DELETE SET NULL,
  post_type text NOT NULL CHECK (post_type IN ('update', 'help_request', 'help_offer', 'information', 'resource_share')),
  title text NOT NULL,
  content text NOT NULL,
  location point,
  location_description text,
  urgency_level text DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
  tags text[],
  images text[], -- URLs to uploaded images
  contact_info jsonb DEFAULT '{}', -- phone, email, preferred contact method
  expiry_date timestamptz, -- when the post becomes irrelevant
  is_resolved boolean DEFAULT false,
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resource_requests table for specific resource needs
CREATE TABLE IF NOT EXISTS resource_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  disaster_event_id uuid REFERENCES disaster_events(id) ON DELETE SET NULL,
  community_post_id uuid REFERENCES community_posts(id) ON DELETE SET NULL,
  resource_type text NOT NULL,
  quantity_needed integer,
  quantity_unit text, -- 'items', 'hours', 'days', etc.
  description text NOT NULL,
  urgency_level text DEFAULT 'normal' CHECK (urgency_level IN ('low', 'normal', 'high', 'critical')),
  location point,
  location_description text,
  preferred_delivery_method text, -- 'pickup', 'delivery', 'either'
  status text DEFAULT 'open' CHECK (status IN ('open', 'partially_filled', 'fulfilled', 'expired', 'cancelled')),
  fulfillment_deadline timestamptz,
  special_requirements text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create volunteer_opportunities table
CREATE TABLE IF NOT EXISTS volunteer_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  disaster_event_id uuid REFERENCES disaster_events(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  skills_needed text[],
  time_commitment text, -- 'one-time', 'ongoing', 'flexible'
  estimated_hours integer,
  location point,
  location_description text,
  remote_possible boolean DEFAULT false,
  volunteers_needed integer,
  volunteers_registered integer DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  contact_info jsonb NOT NULL,
  requirements text, -- background check, training, etc.
  status text DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create volunteer_registrations table
CREATE TABLE IF NOT EXISTS volunteer_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'completed', 'cancelled', 'no_show')),
  hours_contributed integer DEFAULT 0,
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  registered_at timestamptz DEFAULT now(),
  UNIQUE(volunteer_id, opportunity_id)
);

-- Create insurance_claims table to track claim progress
CREATE TABLE IF NOT EXISTS insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  disaster_event_id uuid REFERENCES disaster_events(id) ON DELETE SET NULL,
  claim_number text,
  insurance_company text NOT NULL,
  policy_number text,
  claim_type text NOT NULL CHECK (claim_type IN ('property', 'auto', 'business', 'life', 'health', 'other')),
  damage_description text,
  estimated_damage_amount bigint, -- in cents
  claim_amount bigint, -- in cents
  status text DEFAULT 'filed' CHECK (status IN ('filed', 'under_review', 'approved', 'denied', 'settled', 'appealed')),
  adjuster_name text,
  adjuster_contact text,
  important_dates jsonb DEFAULT '{}', -- filing_date, inspection_date, decision_date, etc.
  documents_submitted text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create recovery_milestones table for tracking specific goals
CREATE TABLE IF NOT EXISTS recovery_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_plan_id uuid REFERENCES recovery_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('housing', 'financial', 'medical', 'legal', 'emotional', 'employment', 'education', 'other')),
  target_date date,
  completion_date date,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  blockers text,
  resources_needed text[],
  support_contacts jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_locations table for proximity-based features
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  location point NOT NULL,
  location_type text DEFAULT 'current' CHECK (location_type IN ('current', 'home', 'work', 'temporary', 'evacuation')),
  address text,
  is_primary boolean DEFAULT false,
  is_safe_location boolean DEFAULT true,
  privacy_level text DEFAULT 'private' CHECK (privacy_level IN ('private', 'contacts_only', 'community', 'public')),
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create push_notification_tokens table
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_info jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_used timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Create data_exports table for GDPR compliance
CREATE TABLE IF NOT EXISTS data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type text NOT NULL CHECK (export_type IN ('full_data', 'recovery_plan', 'documents', 'wellness_data', 'analytics')),
  status text DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'failed', 'expired')),
  file_url text,
  file_size_bytes bigint,
  expiry_date timestamptz DEFAULT (now() + INTERVAL '7 days'),
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create alerts table for emergency notifications
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text CHECK (type IN ('emergency', 'warning', 'info', 'weather', 'evacuation', 'all_clear')),
  location text,
  affected_area geometry(POLYGON, 4326),
  severity text CHECK (severity IN ('minor', 'moderate', 'severe', 'extreme')),
  timestamp timestamptz DEFAULT now(),
  expiry_timestamp timestamptz,
  description text,
  instructions text[],
  source_agency text,
  official_alert_id text,
  is_test boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to existing tables
ALTER TABLE recovery_plans ADD COLUMN IF NOT EXISTS recommendations text[];
ALTER TABLE user_documents ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('Documents', 'Images', 'Insurance', 'Medical', 'Legal'));

-- Enable RLS on all new tables
ALTER TABLE disaster_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Disaster events - public read access
CREATE POLICY "Anyone can read disaster events"
  ON disaster_events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage disaster events"
  ON disaster_events
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Community posts - users can manage their own, read others based on privacy
CREATE POLICY "Users can manage their own community posts"
  ON community_posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read community posts"
  ON community_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Resource requests - users can manage their own, read others
CREATE POLICY "Users can manage their own resource requests"
  ON resource_requests
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read resource requests"
  ON resource_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Volunteer opportunities - creators can manage, others can read
CREATE POLICY "Users can manage volunteer opportunities they created"
  ON volunteer_opportunities
  FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can read volunteer opportunities"
  ON volunteer_opportunities
  FOR SELECT
  TO authenticated
  USING (true);

-- Volunteer registrations - users can manage their own
CREATE POLICY "Users can manage their own volunteer registrations"
  ON volunteer_registrations
  FOR ALL
  TO authenticated
  USING (auth.uid() = volunteer_id)
  WITH CHECK (auth.uid() = volunteer_id);

CREATE POLICY "Opportunity creators can view registrations"
  ON volunteer_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteer_opportunities vo
      WHERE vo.id = opportunity_id AND vo.created_by = auth.uid()
    )
  );

-- Insurance claims - users can only access their own
CREATE POLICY "Users can manage their own insurance claims"
  ON insurance_claims
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recovery milestones - users can only access their own
CREATE POLICY "Users can manage their own recovery milestones"
  ON recovery_milestones
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User locations - users can only access their own
CREATE POLICY "Users can manage their own locations"
  ON user_locations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Push notification tokens - users can only access their own
CREATE POLICY "Users can manage their own notification tokens"
  ON push_notification_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Data exports - users can only access their own
CREATE POLICY "Users can manage their own data exports"
  ON data_exports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alerts - public read access
CREATE POLICY "Allow read access to alerts"
  ON alerts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage alerts"
  ON alerts
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create comprehensive indexes for performance

-- Disaster events indexes
CREATE INDEX IF NOT EXISTS idx_disaster_events_type ON disaster_events(type);
CREATE INDEX IF NOT EXISTS idx_disaster_events_status ON disaster_events(status);
CREATE INDEX IF NOT EXISTS idx_disaster_events_dates ON disaster_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_disaster_events_area ON disaster_events USING GIST (affected_area);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_urgency ON community_posts(urgency_level);
CREATE INDEX IF NOT EXISTS idx_community_posts_location ON community_posts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_community_posts_disaster ON community_posts(disaster_event_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_search ON community_posts USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_community_posts_tags ON community_posts USING gin(tags);

-- Resource requests indexes
CREATE INDEX IF NOT EXISTS idx_resource_requests_user_id ON resource_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_requests_type ON resource_requests(resource_type);
CREATE INDEX IF NOT EXISTS idx_resource_requests_status ON resource_requests(status);
CREATE INDEX IF NOT EXISTS idx_resource_requests_urgency ON resource_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_resource_requests_location ON resource_requests USING GIST (location);

-- Volunteer opportunities indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_creator ON volunteer_opportunities(created_by);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_status ON volunteer_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_dates ON volunteer_opportunities(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_location ON volunteer_opportunities USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_skills ON volunteer_opportunities USING gin(skills_needed);

-- Insurance claims indexes
CREATE INDEX IF NOT EXISTS idx_insurance_claims_user_id ON insurance_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_company ON insurance_claims(insurance_company);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_type ON insurance_claims(claim_type);

-- Recovery milestones indexes
CREATE INDEX IF NOT EXISTS idx_recovery_milestones_user_id ON recovery_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_milestones_plan_id ON recovery_milestones(recovery_plan_id);
CREATE INDEX IF NOT EXISTS idx_recovery_milestones_status ON recovery_milestones(status);
CREATE INDEX IF NOT EXISTS idx_recovery_milestones_priority ON recovery_milestones(priority);
CREATE INDEX IF NOT EXISTS idx_recovery_milestones_category ON recovery_milestones(category);
CREATE INDEX IF NOT EXISTS idx_recovery_milestones_target_date ON recovery_milestones(target_date);

-- User locations indexes
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_type ON user_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_user_locations_location ON user_locations USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_user_locations_primary ON user_locations(is_primary) WHERE is_primary = true;

-- Push notification tokens indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON push_notification_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_notification_tokens(is_active) WHERE is_active = true;

-- Data exports indexes
CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_expiry ON data_exports(expiry_date);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_area ON alerts USING GIST (affected_area);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(timestamp, expiry_timestamp) WHERE expiry_timestamp IS NULL OR expiry_timestamp > now();

-- Create updated_at triggers for new tables
CREATE TRIGGER update_disaster_events_updated_at
  BEFORE UPDATE ON disaster_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_requests_updated_at
  BEFORE UPDATE ON resource_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_opportunities_updated_at
  BEFORE UPDATE ON volunteer_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at
  BEFORE UPDATE ON insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recovery_milestones_updated_at
  BEFORE UPDATE ON recovery_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helpful utility functions

-- Function to get nearby resources based on user location
CREATE OR REPLACE FUNCTION get_nearby_resources(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision DEFAULT 50,
  resource_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  distance_km double precision,
  contact_info jsonb,
  location jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    lr.id,
    lr.name,
    lr.category,
    ST_Distance(
      ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
      ST_GeogFromText('POINT(' || (lr.location->>'longitude')::double precision || ' ' || (lr.location->>'latitude')::double precision || ')')
    ) / 1000 as distance_km,
    lr.contact_info,
    lr.location
  FROM local_resources lr
  WHERE 
    lr.location ? 'latitude' 
    AND lr.location ? 'longitude'
    AND ST_DWithin(
      ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
      ST_GeogFromText('POINT(' || (lr.location->>'longitude')::double precision || ' ' || (lr.location->>'latitude')::double precision || ')'),
      radius_km * 1000
    )
    AND (resource_category IS NULL OR lr.category = resource_category)
  ORDER BY distance_km;
$$;

-- Function to calculate recovery progress score
CREATE OR REPLACE FUNCTION calculate_recovery_progress(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_milestones integer;
  completed_milestones integer;
  progress_percentage numeric;
  days_since_disaster integer;
  recovery_plan_data recovery_plans%ROWTYPE;
BEGIN
  -- Ensure user can only access their own data
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get recovery plan
  SELECT * INTO recovery_plan_data
  FROM recovery_plans
  WHERE user_id = target_user_id AND status = 'active'
  LIMIT 1;

  -- Count milestones
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
  INTO total_milestones, completed_milestones
  FROM recovery_milestones
  WHERE user_id = target_user_id;

  -- Calculate progress percentage
  IF total_milestones > 0 THEN
    progress_percentage := (completed_milestones::numeric / total_milestones::numeric) * 100;
  ELSE
    progress_percentage := 0;
  END IF;

  -- Calculate days since disaster
  IF recovery_plan_data.created_at IS NOT NULL THEN
    days_since_disaster := EXTRACT(DAY FROM now() - recovery_plan_data.created_at);
  ELSE
    days_since_disaster := 0;
  END IF;

  SELECT jsonb_build_object(
    'total_milestones', total_milestones,
    'completed_milestones', completed_milestones,
    'progress_percentage', progress_percentage,
    'days_since_disaster', days_since_disaster,
    'disaster_type', recovery_plan_data.disaster_type,
    'priority_score', recovery_plan_data.priority_score,
    'status', recovery_plan_data.status
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION get_nearby_resources(double precision, double precision, double precision, text) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_recovery_progress(uuid) TO authenticated;

-- Create materialized view for analytics dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS recovery_analytics AS
SELECT 
  DATE_TRUNC('day', rp.created_at) as date,
  rp.disaster_type,
  COUNT(*) as new_recovery_plans,
  AVG(rp.priority_score) as avg_priority_score,
  COUNT(DISTINCT rp.user_id) as unique_users,
  COUNT(rm.id) as total_milestones,
  COUNT(rm.id) FILTER (WHERE rm.status = 'completed') as completed_milestones
FROM recovery_plans rp
LEFT JOIN recovery_milestones rm ON rp.id = rm.recovery_plan_id
WHERE rp.created_at >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('day', rp.created_at), rp.disaster_type
ORDER BY date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_recovery_analytics_date ON recovery_analytics(date);
CREATE INDEX IF NOT EXISTS idx_recovery_analytics_disaster_type ON recovery_analytics(disaster_type);

-- Grant access to materialized view
GRANT SELECT ON recovery_analytics TO authenticated;

-- Create function to refresh analytics (call this periodically)
CREATE OR REPLACE FUNCTION refresh_recovery_analytics()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW recovery_analytics;
$$;

GRANT EXECUTE ON FUNCTION refresh_recovery_analytics() TO authenticated;