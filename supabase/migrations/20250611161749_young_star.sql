/*
  # Security and Utility Functions

  1. Functions
    - `get_user_recovery_status` - Get comprehensive user recovery information
    - `update_user_streak` - Update user activity streak
    - `cleanup_old_analytics` - Clean up old analytics data
    - `get_nearby_resources` - Get resources near user location (placeholder)
*/

-- Function to get comprehensive user recovery status
CREATE OR REPLACE FUNCTION get_user_recovery_status(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Ensure user can only access their own data
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'user_id', target_user_id,
    'recovery_plan', (
      SELECT jsonb_build_object(
        'disaster_type', disaster_type,
        'status', status,
        'priority_score', priority_score,
        'created_at', created_at
      )
      FROM recovery_plans 
      WHERE user_id = target_user_id AND status = 'active'
      LIMIT 1
    ),
    'progress', (
      SELECT jsonb_build_object(
        'points', points,
        'level', level,
        'streak_days', streak_days,
        'last_active_date', last_active_date
      )
      FROM user_progress 
      WHERE user_id = target_user_id
    ),
    'achievements_count', (
      SELECT COUNT(*) FROM user_achievements WHERE user_id = target_user_id
    ),
    'documents_count', (
      SELECT COUNT(*) FROM user_documents WHERE user_id = target_user_id
    ),
    'recent_mood', (
      SELECT mood 
      FROM wellness_entries 
      WHERE user_id = target_user_id AND mood IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to update user activity streak
CREATE OR REPLACE FUNCTION update_user_streak(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_progress user_progress%ROWTYPE;
  days_since_last_active integer;
BEGIN
  -- Ensure user can only update their own streak
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get current progress
  SELECT * INTO current_progress
  FROM user_progress
  WHERE user_id = target_user_id;

  -- If no progress record exists, create one
  IF current_progress IS NULL THEN
    INSERT INTO user_progress (user_id, streak_days, last_active_date)
    VALUES (target_user_id, 1, CURRENT_DATE);
    RETURN;
  END IF;

  -- Calculate days since last active
  days_since_last_active := CURRENT_DATE - current_progress.last_active_date;

  -- Update streak based on activity pattern
  IF days_since_last_active = 0 THEN
    -- Same day, no change needed
    RETURN;
  ELSIF days_since_last_active = 1 THEN
    -- Consecutive day, increment streak
    UPDATE user_progress
    SET streak_days = streak_days + 1,
        last_active_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE user_id = target_user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE user_progress
    SET streak_days = 1,
        last_active_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE user_id = target_user_id;
  END IF;
END;
$$;

-- Function to clean up old analytics data (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete analytics data older than 1 year
  DELETE FROM user_analytics 
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete old AI interactions (keep for 6 months)
  DELETE FROM ai_voice_interactions 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Keep video checkins for 1 year
  DELETE FROM ai_video_checkins 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_recovery_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_streak(uuid) TO authenticated;