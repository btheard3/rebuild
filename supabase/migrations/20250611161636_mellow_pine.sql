/*
  # Recovery Plans Schema

  1. New Tables
    - `recovery_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `disaster_type` (text)
      - `personal_info` (jsonb)
      - `insurance_info` (jsonb)
      - `immediate_needs` (jsonb)
      - `status` (text)
      - `priority_score` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `recovery_plans` table
    - Add policy for users to manage their own recovery plans
*/

CREATE TABLE IF NOT EXISTS recovery_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  disaster_type text NOT NULL,
  personal_info jsonb DEFAULT '{}',
  insurance_info jsonb DEFAULT '{}',
  immediate_needs jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  priority_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recovery_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recovery plans"
  ON recovery_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_recovery_plans_user_id ON recovery_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_plans_status ON recovery_plans(status);
CREATE INDEX IF NOT EXISTS idx_recovery_plans_priority ON recovery_plans(priority_score DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recovery_plans_updated_at
  BEFORE UPDATE ON recovery_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();