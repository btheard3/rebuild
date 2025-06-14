# Rebuild - Disaster Recovery Application

A comprehensive disaster recovery application built with React Native, Expo, and modern web technologies. This app helps users navigate through disaster recovery with AI-powered tools, secure document storage, and personalized support.

## 🚀 Features

### Core Functionality
- **Recovery Wizard**: AI-powered personalized disaster recovery planning using OpenAI
- **AI Voice Check-ins**: Emotional support through voice messages generated with ElevenLabs
- **Document Vault**: Secure document storage with blockchain verification via Algorand
- **Resource Directory**: Comprehensive database of local recovery resources
- **Mental Wellness Tools**: Mood tracking, journaling, and meditation features
- **Emergency Alerts**: Real-time emergency notifications and alerts
- **Progress Tracking**: Gamified recovery milestones and achievements

### Technical Features
- **Cross-platform**: Works on iOS, Android, and Web
- **Real-time Updates**: Live data synchronization with Supabase
- **Offline Support**: Core features work without internet connection
- **Responsive Design**: Optimized for all device sizes
- **Accessibility**: Full accessibility support with screen readers
- **Premium Features**: Subscription management with RevenueCat

## 🛠 Technology Stack

### Frontend
- **React Native** with Expo SDK 53
- **Expo Router** for navigation
- **TypeScript** for type safety
- **Lucide React Native** for icons
- **React Native Reanimated** for animations

### Backend & Services
- **Supabase** - Database, authentication, and real-time features
- **OpenAI API** - AI-powered recovery recommendations and scripts
- **ElevenLabs API** - Voice synthesis for audio messages
- **Algorand** - Blockchain document verification
- **RevenueCat** - Subscription and payment management

### Development Tools
- **Expo CLI** for development and building
- **TypeScript** for static type checking
- **ESLint** for code quality
- **Prettier** for code formatting

## 🏗 Project Structure

```
├── app/                    # App routes (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (onboarding)/      # Onboarding flow
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── services/             # API services and utilities
├── supabase/             # Database migrations and functions
└── types/                # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd rebuild-app
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
EXPO_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key
```

### Development

Start the development server:
```bash
npm run dev
```

This will start the Expo development server. You can then:
- Press `w` to open in web browser
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your device

### Database Setup

1. Set up Supabase project at [supabase.com](https://supabase.com)
2. Run migrations:
```bash
npx supabase db push
```

### Building for Production

Web build:
```bash
npm run build:web
```

Native builds require Expo Application Services (EAS):
```bash
npx eas build --platform all
```

## 🔧 Configuration

### API Keys Required
- **Supabase**: Database and authentication
- **OpenAI**: AI-powered features
- **ElevenLabs**: Voice synthesis
- **RevenueCat**: Subscription management
- **Algorand**: Blockchain features (optional)

### Feature Flags
The app includes several feature flags that can be configured:
- Real-time updates
- Premium features
- Analytics tracking
- Offline mode

## 📱 Key Features

### Recovery Wizard
Guides users through creating a personalized disaster recovery plan using AI-powered recommendations based on their specific situation, disaster type, and immediate needs.

### AI Voice Check-ins
Provides emotional support through personalized voice messages generated based on the user's mood and journal entries, helping maintain mental wellness during recovery.

### Document Vault
Secure storage for important documents with optional blockchain verification for tamper-proof records. Supports photos, PDFs, and other document types.

### Resource Directory
Comprehensive database of local recovery resources including:
- Emergency services
- Financial assistance programs
- Housing support
- Medical facilities
- Legal aid
- Mental health services

### Progress Tracking
Gamified system that tracks recovery milestones, awards achievements, and provides motivation through:
- Point system
- Level progression
- Achievement badges
- Streak tracking

## 🔒 Security & Privacy

- End-to-end encryption for sensitive documents
- Secure authentication with Supabase
- GDPR-compliant data handling
- Optional blockchain verification for documents
- Local data encryption for offline storage

## 🌐 Deployment

The application is deployed on Netlify with automatic deployments from the main branch. The production URL is available at the deployment link provided in the Netlify dashboard.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

## 🏆 Built with Bolt.new

This application was built using [Bolt.new](https://bolt.new), showcasing the power of AI-assisted development.