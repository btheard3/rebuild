import 'dotenv/config';

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
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.btheard.rebuild',
    },
    android: {
      package: 'com.btheard.rebuild',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      favicon: './assets/images/favicon.png',
    },
    extra: {
      eas: {
        projectId: '9517aa5e-0ac4-4c01-8bf7-5358034f8e98',
      },
      openaiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      elevenlabsKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
