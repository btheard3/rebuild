const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are missing for Netlify function.');
  throw new Error('Supabase environment variables not set for Netlify function.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };