/*
  # User Documents Schema

  1. New Tables
    - `user_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text)
      - `type` (text)
      - `category` (text)
      - `size` (text)
      - `file_path` (text)
      - `preview_url` (text)
      - `blockchain_hash` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_documents` table
    - Add policy for users to manage their own documents
*/

CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('document', 'image')),
  category text NOT NULL CHECK (category IN ('Documents', 'Images', 'Insurance', 'Medical', 'Legal')),
  size text,
  file_path text,
  preview_url text,
  blockchain_hash text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own documents"
  ON user_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_category ON user_documents(category);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON user_documents(type);
CREATE INDEX IF NOT EXISTS idx_user_documents_blockchain ON user_documents(blockchain_hash) WHERE blockchain_hash IS NOT NULL;