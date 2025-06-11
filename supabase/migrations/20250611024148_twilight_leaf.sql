/*
  # Recovery Plans Table

  1. New Tables
    - `recovery_plans`
      - Stores user recovery plans with processed data
      - Links to user profiles
      - Tracks priority and status
    
  2. Security
    - Enable RLS on recovery_plans table
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS recovery_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  disaster_type text NOT NULL,
  personal_info jsonb,
  insurance_info jsonb,
  immediate_needs jsonb,
  status text DEFAULT 'active',
  priority_score int DEFAULT 0,
  recommendations text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recovery_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recovery plans"
  ON recovery_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recovery plans"
  ON recovery_plans
  FOR INSERT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recovery plans"
  ON recovery_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS recovery_plans_user_id_idx ON recovery_plans(user_id);
CREATE INDEX IF NOT EXISTS recovery_plans_status_idx ON recovery_plans(status);
CREATE INDEX IF NOT EXISTS recovery_plans_priority_idx ON recovery_plans(priority_score DESC);