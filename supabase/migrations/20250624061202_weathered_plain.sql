/*
  # AI Video Check-ins Table

  1. New Tables
    - `ai_video_checkins`
      - Stores AI-generated video check-in data
      - Links to user profiles
      - Tracks video generation status and URLs

  2. Security
    - Enable RLS on ai_video_checkins table
    - Add policies for user access
*/

-- Create ai_video_checkins table
CREATE TABLE IF NOT EXISTS ai_video_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  script text NOT NULL,
  mood text CHECK (mood IN ('supportive', 'hopeful', 'encouraging', 'empathetic', 'motivational')),
  status text DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  video_url text,
  journal_entry text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_video_checkins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own video check-ins"
  ON ai_video_checkins
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_video_checkins_user_id ON ai_video_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_video_checkins_status ON ai_video_checkins(status);
CREATE INDEX IF NOT EXISTS idx_ai_video_checkins_created_at ON ai_video_checkins(created_at);