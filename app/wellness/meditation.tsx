import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Play, Pause, RotateCcw, Clock, Heart, Sparkles } from 'lucide-react-native';

interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: 'breathing' | 'mindfulness' | 'body-scan' | 'loving-kindness';
  color: string;
}

export default function MeditationScreen() {
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCount, setBreathingCount] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(1));

  const sessions: MeditationSession[] = [
    {
      id: '1',
      title: 'Deep Breathing',
      description: 'Simple breathing exercise to reduce stress and anxiety',
      duration: 5,
      type: 'breathing',
      color: '#10B981'
    },
    {
      id: '2',
      title: 'Mindful Moment',
      description: 'Present-moment awareness meditation',
      duration: 10,
      type: 'mindfulness',
      color: '#3B82F6'
    },
    {
      id: '3',
      title: 'Body Scan',
      description: 'Progressive relaxation through body awareness',
      duration: 15,
      type: 'body-scan',
      color: '#8B5CF6'
    },
    {
      id: '4',
      title: 'Loving Kindness',
      description: 'Cultivate compassion for yourself and others',
      duration: 12,
      type: 'loving-kindness',
      color: '#EF4444'
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      Alert.alert('Session Complete', 'Great job! You\'ve completed your meditation session.');
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  useEffect(() => {
    let breathingInterval: NodeJS.Timeout;
    
    if (isActive && selectedSession?.type === 'breathing') {
      breathingInterval = setInterval(() => {
        setBreathingCount(prev => {
          const newCount = prev + 1;
          const cycle = newCount % 16; // 4s inhale + 4s hold + 8s exhale = 16s cycle
          
          if (cycle < 4) {
            setBreathingPhase('inhale');
            animateBreathing(1.3);
          } else if (cycle < 8) {
            setBreathingPhase('hold');
            animateBreathing(1.3);
          } else {
            setBreathingPhase('exhale');
            animateBreathing(0.8);
          }
          
          return newCount;
        });
      }, 1000);
    }
    
    return () => clearInterval(breathingInterval);
  }, [isActive, selectedSession]);

  const animateBreathing = (toValue: number) => {
    Animated.timing(scaleAnim, {
      toValue,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const startSession = (session: MeditationSession) => {
    setSelectedSession(session);
    setTimeLeft(session.duration * 60);
    setIsActive(true);
    setBreathingCount(0);
    setBreathingPhase('inhale');
  };

  const pauseSession = () => {
    setIsActive(false);
  };

  const resumeSession = () => {
    setIsActive(true);
  };

  const resetSession = () => {
    setIsActive(false);
    setTimeLeft(selectedSession ? selectedSession.duration * 60 : 0);
    setBreathingCount(0);
    setBreathingPhase('inhale');
    scaleAnim.setValue(1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Breathe in slowly...';
      case 'hold':
        return 'Hold your breath...';
      case 'exhale':
        return 'Breathe out slowly...';
    }
  };

  if (selectedSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setSelectedSession(null);
              setIsActive(false);
            }}
          >
            <ArrowLeft size={24} color="#F8FAFC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedSession.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.sessionContainer}>
          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: selectedSession.color }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={styles.timerLabel}>remaining</Text>
          </View>

          {/* Breathing Animation */}
          {selectedSession.type === 'breathing' && (
            <View style={styles.breathingContainer}>
              <Animated.View 
                style={[
                  styles.breathingCircle,
                  { 
                    backgroundColor: selectedSession.color + '30',
                    borderColor: selectedSession.color,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <Text style={[styles.breathingText, { color: selectedSession.color }]}>
                  {getBreathingInstruction()}
                </Text>
              </Animated.View>
            </View>
          )}

          {/* Session Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sessionDescription}>
              {selectedSession.description}
            </Text>
            
            {selectedSession.type === 'breathing' && (
              <Text style={styles.instructionText}>
                Follow the circle's movement: inhale as it grows, hold when it pauses, exhale as it shrinks.
              </Text>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: selectedSession.color + '20' }]}
              onPress={resetSession}
            >
              <RotateCcw size={24} color={selectedSession.color} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: selectedSession.color }]}
              onPress={isActive ? pauseSession : resumeSession}
            >
              {isActive ? (
                <Pause size={32} color="white" />
              ) : (
                <Play size={32} color="white" />
              )}
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meditation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Sparkles size={32} color="#3B82F6" />
          <Text style={styles.introTitle}>Find Your Peace</Text>
          <Text style={styles.introText}>
            Take a moment to center yourself with guided meditation sessions designed to reduce stress and promote wellbeing.
          </Text>
        </View>

        <View style={styles.sessionsContainer}>
          <Text style={styles.sectionTitle}>Choose a Session</Text>
          
          {sessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={[styles.sessionCard, { borderColor: session.color + '30' }]}
              onPress={() => startSession(session)}
              activeOpacity={0.8}
            >
              <View style={[styles.sessionIcon, { backgroundColor: session.color + '20' }]}>
                <Clock size={24} color={session.color} />
              </View>
              
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionDesc}>{session.description}</Text>
                <Text style={[styles.sessionDuration, { color: session.color }]}>
                  {session.duration} minutes
                </Text>
              </View>
              
              <View style={[styles.playIcon, { backgroundColor: session.color }]}>
                <Play size={16} color="white" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.benefitsCard}>
          <Heart size={24} color="#EF4444" />
          <Text style={styles.benefitsTitle}>Benefits of Meditation</Text>
          <Text style={styles.benefitsText}>
            • Reduces stress and anxiety{'\n'}
            • Improves focus and concentration{'\n'}
            • Promotes emotional wellbeing{'\n'}
            • Enhances self-awareness{'\n'}
            • Better sleep quality
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  introSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  sessionsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sessionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  playIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  timerLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 40,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  descriptionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sessionDescription: {
    fontSize: 18,
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 16,
  },
  benefitsText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    textAlign: 'center',
  },
});