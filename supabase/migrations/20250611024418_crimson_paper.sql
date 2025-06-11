/*
  # User Documents Table

  1. New Tables
    - `user_documents`
      - Stores user uploaded documents and photos
      - Links to user profiles
      - Tracks blockchain verification status
    
  2. Security
    - Enable RLS on user_documents table
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('document', 'image')),
  category text NOT NULL,
  size text,
  file_path text,
  preview_url text,
  blockchain_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON user_documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
  ON user_documents
  FOR INSERT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON user_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON user_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_documents_user_id_idx ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS user_documents_type_idx ON user_documents(type);
CREATE INDEX IF NOT EXISTS user_documents_category_idx ON user_documents(category);
CREATE INDEX IF NOT EXISTS user_documents_blockchain_hash_idx ON user_documents(blockchain_hash);

-- Create trigger for updated_at
CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();