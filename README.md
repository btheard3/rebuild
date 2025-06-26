# Rebuild - Disaster Recovery App

![Rebuild Logo](https://images.pexels.com/photos/3807316/pexels-photo-3807316.jpeg)

## About

Rebuild is a comprehensive disaster recovery application designed to help individuals and communities navigate the challenging aftermath of natural disasters. Built with React Native and Expo, this cross-platform solution provides essential tools, resources, and emotional support during critical recovery periods.

## Features

### 🏠 Personalized Recovery Plans
- Step-by-step guidance tailored to specific disaster types
- Customized recommendations based on individual circumstances
- Progress tracking with achievement system

### 📱 AI-Powered Support
- Voice-based emotional support and check-ins
- Personalized affirmations and coping strategies
- Mental wellness tools including meditation and journaling

### 🔒 Secure Document Storage
- Blockchain-verified document security
- Critical document organization and access
- Insurance information management

### 🗺️ Resource Locator
- Nearby emergency services and shelters
- Financial assistance programs
- Community support networks

### 🧠 Mental Health Tools
- Guided meditation sessions
- Mood tracking and journaling
- Coping strategies for disaster-related stress

### ⚠️ Emergency Alerts
- Real-time notifications for your area
- Critical updates during ongoing situations
- Safety instructions and evacuation routes

## Technology Stack

- **Frontend**: React Native, Expo
- **Routing**: Expo Router
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **AI Integration**: OpenAI, ElevenLabs
- **Security**: Blockchain verification, secure storage

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
```bash
git clone https://github.com/rebuild-team/rebuild-app.git
cd rebuild-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Edit the `.env` file with your API keys and configuration.

4. Start the development server
```bash
npm run dev
```

### Environment Setup

This project uses the following environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## Deployment

### EAS Build

```bash
# Build for Android
npm run deploy

# Build for iOS
npm run deploy:ios

# Build for both platforms
npm run deploy:all
```

### Updates

```bash
# Publish an update
npm run publish
```

## Project Structure

```
rebuild-app/
├── app/                    # Application routes
│   ├── (auth)/             # Authentication screens
│   ├── (onboarding)/       # Onboarding screens
│   ├── (tabs)/             # Main tab navigation
│   └── _layout.tsx         # Root layout
├── assets/                 # Static assets
├── components/             # Reusable components
├── context/                # React context providers
├── hooks/                  # Custom React hooks
├── services/               # API and utility services
├── supabase/               # Supabase configuration and migrations
└── types/                  # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Database powered by [Supabase](https://supabase.com/)
- AI capabilities by [OpenAI](https://openai.com/) and [ElevenLabs](https://elevenlabs.io/)
- Icons from [Lucide](https://lucide.dev/)
- Images from [Pexels](https://www.pexels.com/)

## Contact

Rebuild Team - contact@rebuild-app.com

Project Link: [https://github.com/rebuild-team/rebuild-app](https://github.com/rebuild-team/rebuild-app)