/*
  # Useful Views for Analytics and Reporting

  1. Views
    - `user_recovery_dashboard` - Comprehensive user progress view
    - `resource_usage_stats` - Resource popularity and usage statistics
    - `wellness_trends` - Mental health and wellness trends
    - `emergency_response_metrics` - Emergency alert effectiveness
*/

-- User Recovery Dashboard View
CREATE OR REPLACE VIEW user_recovery_dashboard AS
SELECT 
  u.id as user_id,
  u.email,
  p.raw_user_meta_data->>'full_name' as full_name,
  rp.disaster_type,
  rp.status as recovery_status,
  rp.priority_score,
  rp.created_at as recovery_started,
  up.points,
  up.level,
  up.streak_days,
  up.last_active_date,
  COUNT(DISTINCT ua.id) as total_achievements,
  COUNT(DISTINCT ud.id) as total_documents,
  COUNT(DISTINCT we.id) as wellness_entries_count,
  COUNT(DISTINCT avc.id) as ai_checkins_count,
  AVG(CASE WHEN we.mood IN ('great', 'good', 'hopeful', 'grateful') THEN 1 ELSE 0 END) as positive_mood_ratio
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN recovery_plans rp ON u.id = rp.user_id AND rp.status = 'active'
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN user_documents ud ON u.id = ud.user_id
LEFT JOIN wellness_entries we ON u.id = we.user_id AND we.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN ai_video_checkins avc ON u.id = avc.user_id AND avc.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, p.raw_user_meta_data, rp.disaster_type, rp.status, rp.priority_score, rp.created_at, up.points, up.level, up.streak_days, up.last_active_date;

-- Resource Usage Statistics View
CREATE OR REPLACE VIEW resource_usage_stats AS
SELECT 
  lr.id,
  lr.name,
  lr.category,
  lr.rating,
  lr.verified,
  COUNT(uf.id) as favorite_count,
  COUNT(DISTINCT uf.user_id) as unique_users,
  lr.created_at
FROM local_resources lr
LEFT JOIN user_favorites uf ON lr.id = uf.resource_id
GROUP BY lr.id, lr.name, lr.category, lr.rating, lr.verified, lr.created_at
ORDER BY favorite_count DESC;

-- Wellness Trends View
CREATE OR REPLACE VIEW wellness_trends AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  entry_type,
  mood,
  COUNT(*) as entry_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(meditation_duration) as avg_meditation_duration
FROM wellness_entries
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), entry_type, mood
ORDER BY date DESC;

-- Emergency Response Metrics View
CREATE OR REPLACE VIEW emergency_response_metrics AS
SELECT 
  DATE_TRUNC('day', timestamp) as alert_date,
  type as alert_type,
  location,
  COUNT(*) as alert_count,
  COUNT(DISTINCT location) as affected_areas
FROM alerts
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), type, location
ORDER BY alert_date DESC;

-- Grant read access to authenticated users for their own data
GRANT SELECT ON user_recovery_dashboard TO authenticated;
GRANT SELECT ON resource_usage_stats TO authenticated;
GRANT SELECT ON wellness_trends TO authenticated;
GRANT SELECT ON emergency_response_metrics TO authenticated;