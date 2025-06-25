/*
  # Fix Video Logs Table Migration

  This migration ensures the video_logs table exists without trying to recreate
  existing policies that are causing conflicts.
*/

-- Check if the table exists and create it if it doesn't
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

-- Enable RLS if not already enabled
ALTER TABLE video_logs ENABLE ROW LEVEL SECURITY;

-- Create the policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'video_logs' 
    AND policyname = 'Users can manage their own video logs'
  ) THEN
    CREATE POLICY "Users can manage their own video logs"
      ON video_logs
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_video_logs_user_id ON video_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_logs_status ON video_logs(status);
CREATE INDEX IF NOT EXISTS idx_video_logs_created_at ON video_logs(created_at);