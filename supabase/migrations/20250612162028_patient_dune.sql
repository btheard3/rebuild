/*
  # Video Logs Table for AI Video Check-ins

  1. New Tables
    - `video_logs` (if not exists as ai_video_checkins)
      - Stores AI-generated video check-in logs
      - Links to user profiles
      - Tracks video generation history

  2. Security
    - Enable RLS on video_logs table
    - Add policies for user access
*/

-- Create video_logs table if ai_video_checkins doesn't exist
CREATE TABLE IF NOT EXISTS video_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  script text NOT NULL,
  mood text,
  video_url text,
  status text DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed')),
  journal_entry text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own video logs"
  ON video_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_logs_user_id ON video_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_logs_status ON video_logs(status);
CREATE INDEX IF NOT EXISTS idx_video_logs_created_at ON video_logs(created_at);