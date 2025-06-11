/*
  # Gamification System Schema

  1. New Tables
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `achievement_id` (text)
      - `unlocked_at` (timestamp)
    
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `points` (integer)
      - `level` (integer)
      - `streak_days` (integer)
      - `last_active_date` (date)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own progress
*/

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_active_date date DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own achievements"
  ON user_achievements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for leaderboards and analytics
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_points ON user_progress(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON user_progress(streak_days DESC);

-- Update trigger for user_progress
CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();