import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Crown, Zap, Shield, Heart } from 'lucide-react-native';

interface PaywallScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallScreen({ visible, onClose }: PaywallScreenProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.heroSection}>
            <View style={[styles.crownContainer, { backgroundColor: colors.primary + '20' }]}>
              <Crown size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>All Features Unlocked</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              All premium features are available to you at no cost
            </Text>
          </View>

          <View style={[styles.featuresSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>What's Included:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Zap size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>AI Voice Affirmations</Text>
              </View>
              <View style={styles.featureItem}>
                <Crown size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>AI Video Check-ins</Text>
              </View>
              <View style={styles.featureItem}>
                <Shield size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>Blockchain Document Verification</Text>
              </View>
              <View style={styles.featureItem}>
                <Heart size={20} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>Advanced Analytics</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.continueButtonText}>Continue Using App</Text>
          </TouchableOpacity>

          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            All features are available to help you on your recovery journey.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    lineHeight: 24,
  },
  continueButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});