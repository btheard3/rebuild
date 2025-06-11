/*
  # Analytics and Feedback Schema

  1. New Tables
    - `user_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `event_name` (text)
      - `event_data` (jsonb)
      - `session_id` (text)
      - `created_at` (timestamp)

    - `app_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `feedback_type` (text)
      - `rating` (integer)
      - `message` (text)
      - `feature_area` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
*/

CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'rating')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  message text,
  feature_area text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own analytics"
  ON user_analytics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own feedback"
  ON app_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all feedback for product improvement
CREATE POLICY "Admins can read all feedback"
  ON app_feedback
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event ON user_analytics(event_name);
CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_app_feedback_type ON app_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_app_feedback_rating ON app_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_app_feedback_date ON app_feedback(created_at);