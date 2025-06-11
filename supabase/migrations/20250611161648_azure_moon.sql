/*
  # Wellness and Mental Health Schema

  1. New Tables
    - `wellness_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `entry_type` (text)
      - `mood` (text)
      - `content` (text)
      - `meditation_duration` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `wellness_entries` table
    - Add policy for users to manage their own wellness data
*/

CREATE TABLE IF NOT EXISTS wellness_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('journal', 'mood', 'meditation', 'affirmation')),
  mood text CHECK (mood IN ('great', 'good', 'okay', 'sad', 'stressed', 'anxious', 'hopeful', 'grateful', 'determined')),
  content text,
  meditation_duration integer DEFAULT 0, -- in seconds
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wellness_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wellness entries"
  ON wellness_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for analytics and mood tracking
CREATE INDEX IF NOT EXISTS idx_wellness_entries_user_id ON wellness_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_type ON wellness_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_wellness_entries_mood ON wellness_entries(mood) WHERE mood IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wellness_entries_date ON wellness_entries(created_at);