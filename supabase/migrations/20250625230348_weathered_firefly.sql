/*
  # Video Logs Table for AI Video Check-ins - Fixed Migration

  1. Updates
    - Check if policy exists before creating
    - Ensure indexes exist
    - Maintain existing video_logs table structure
*/

-- Check if policy exists and drop it if needed to avoid errors
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'video_logs' 
    AND policyname = 'Users can manage their own video logs'
  ) THEN
    DROP POLICY "Users can manage their own video logs" ON video_logs;
  END IF;
END $$;

-- Create policy only if it doesn't exist
CREATE POLICY "Users can manage their own video logs"
  ON video_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure indexes exist (using IF NOT EXISTS to avoid errors)
CREATE INDEX IF NOT EXISTS idx_video_logs_user_id ON video_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_logs_status ON video_logs(status);
CREATE INDEX IF NOT EXISTS idx_video_logs_created_at ON video_logs(created_at);