/*
  # Notification Preferences Schema

  1. New Tables
    - `notification_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `emergency_alerts` (boolean)
      - `wellness_reminders` (boolean)
      - `progress_updates` (boolean)
      - `resource_updates` (boolean)
      - `ai_checkin_reminders` (boolean)
      - `email_notifications` (boolean)
      - `push_notifications` (boolean)
      - `quiet_hours_start` (time)
      - `quiet_hours_end` (time)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notification_preferences` table
    - Add policy for users to manage their own preferences
*/

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  emergency_alerts boolean DEFAULT true,
  wellness_reminders boolean DEFAULT true,
  progress_updates boolean DEFAULT true,
  resource_updates boolean DEFAULT false,
  ai_checkin_reminders boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  quiet_hours_start time DEFAULT '22:00:00',
  quiet_hours_end time DEFAULT '08:00:00',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Update trigger
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences when a user signs up
CREATE TRIGGER create_default_notification_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();