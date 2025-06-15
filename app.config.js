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
      bundler: 'metro',
      output: 'server',
      favicon: './assets/images/favicon.png',
    },
    extra: {
      EXPO_PUBLIC_ELEVENLABS_API_KEY:
        process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-camera',
      'expo-document-picker',
      'expo-file-system',
      'expo-secure-store',
    ],
    experiments: {
      typedRoutes: true,
    },
    description:
      'A comprehensive disaster recovery application with AI-powered tools, secure document storage, and personalized support.',
  },
};
