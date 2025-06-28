import 'dotenv/config';
import 'expo-router/entry';

export default {
  cli: {
    appVersionSource: 'project',
  },
  expo: {
    name: 'Rebuild',
    slug: 'rebuild-disaster-recovery',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    platforms: ['ios', 'android', 'web'],
    web: {
      favicon: './assets/images/icon.png',
    },
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      EXPO_PUBLIC_TAVUS_API_KEY: process.env.EXPO_PUBLIC_TAVUS_API_KEY,
      EXPO_PUBLIC_ELEVENLABS_API_KEY:
        process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
      EXPO_ROUTER_APP_ROOT: process.env.EXPO_ROUTER_APP_ROOT ?? 'app',
    },
  },
};