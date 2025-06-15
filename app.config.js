import 'dotenv/config';

export default {
  expo: {
    name: 'Rebuild - Disaster Recovery',
    slug: 'rebuild-disaster-recovery',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'rebuild',
    userInterfaceStyle: 'automatic',
    platforms: ['ios', 'android', 'web'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.rebuild.disasterrecovery',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/icon.png',
        backgroundColor: '#2563EB',
      },
      package: 'com.rebuild.disasterrecovery',
    },
    web: {
      bundler: 'webpack',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    extra: {
      // Expose environment variables to the app
      EXPO_PUBLIC_ELEVENLABS_API_KEY:
        process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
      EXPO_PUBLIC_OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-camera',
      'expo-document-picker',
      'expo-file-system',
      'expo-secure-store',
      'expo-av', // Added for audio playback
    ],
    experiments: {
      typedRoutes: true,
    },
    description:
      'A comprehensive disaster recovery application with AI-powered tools, secure document storage, and personalized support.',
  },
};
