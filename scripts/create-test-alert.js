const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAlert() {
  try {
    console.log('Creating test emergency alert...');
    
    const alertData = {
      title: 'Flash Flood Warning',
      type: 'emergency',
      location: 'Downtown District',
      timestamp: new Date().toISOString(),
      description: 'Heavy rainfall has caused flash flooding in the downtown area. Avoid low-lying roads and seek higher ground immediately. Emergency shelters are open at Community Center and High School.'
    };

    const { data, error } = await supabase
      .from('alerts')
      .insert([alertData])
      .select();

    if (error) {
      console.error('Error creating alert:', error);
      return;
    }

    console.log('✅ Test alert created successfully:', data[0]);
    console.log('📱 This alert should now appear in the app\'s alerts tab');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

createTestAlert();