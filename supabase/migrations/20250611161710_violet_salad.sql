/*
  # AI Interactions Schema

  1. New Tables
    - `ai_video_checkins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `video_id` (text)
      - `script` (text)
      - `mood` (text)
      - `status` (text)
      - `video_url` (text)
      - `created_at` (timestamp)

    - `ai_voice_interactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `interaction_type` (text)
      - `input_text` (text)
      - `audio_url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own AI interactions
*/

CREATE TABLE IF NOT EXISTS ai_video_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  script text NOT NULL,
  mood text CHECK (mood IN ('hopeful', 'overwhelmed', 'grateful', 'anxious', 'determined')),
  status text DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  video_url text,
  is_emergency_alert boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_voice_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('affirmation', 'journal_reading', 'emergency_alert')),
  input_text text NOT NULL,
  audio_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_video_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_voice_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own video checkins"
  ON ai_video_checkins
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own voice interactions"
  ON ai_voice_interactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_video_checkins_user_id ON ai_video_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_video_checkins_status ON ai_video_checkins(status);
CREATE INDEX IF NOT EXISTS idx_ai_video_checkins_emergency ON ai_video_checkins(is_emergency_alert);
CREATE INDEX IF NOT EXISTS idx_ai_voice_interactions_user_id ON ai_voice_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_voice_interactions_type ON ai_voice_interactions(interaction_type);