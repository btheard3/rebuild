import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import BoltBadge from '@/components/BoltBadge';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.contentContainer}>
          <View style={[styles.successContainer, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.successTitle, { color: colors.success, fontFamily: 'Inter-Bold' }]}>Check your email</Text>
            <Text style={[styles.successText, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
              We've sent password reset instructions to {email}. Please check your inbox.
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { fontFamily: 'Inter-SemiBold' }]}>Return to Login</Text>
          </TouchableOpacity>
        </View>
        <BoltBadge />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error, fontFamily: 'Inter-Medium' }]}>{error}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text, fontFamily: 'Inter-Medium' }]}>Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border,
                fontFamily: 'Inter-Regular'
              }]}
              placeholder="your@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={[styles.buttonText, { fontFamily: 'Inter-SemiBold' }]}>Send Reset Instructions</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backContainer}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  successContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  backContainer: {
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
  },
});