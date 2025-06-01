import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useWizard } from './WizardContext';

export default function PersonalInfoStep() {
  const { colors } = useTheme();
  const { data, updateData } = useWizard();
  
  const [name, setName] = useState(data.personalInfo?.name || '');
  const [phone, setPhone] = useState(data.personalInfo?.phone || '');
  const [address, setAddress] = useState(data.personalInfo?.address || '');
  const [familySize, setFamilySize] = useState(data.personalInfo?.familySize?.toString() || '1');
  
  const handleUpdateFamilySize = (value: string) => {
    // Only allow numeric input
    if (/^\d*$/.test(value)) {
      setFamilySize(value);
    }
  };
  
  useEffect(() => {
    updateData({
      personalInfo: {
        name,
        phone,
        address,
        familySize: parseInt(familySize || '1', 10),
      },
    });
  }, [name, phone, address, familySize]);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>Your Contact Information</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This helps customize your recovery plan and connect you with local resources.
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border
              }
            ]}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border
              }
            ]}
            placeholder="(123) 456-7890"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Current Address</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border
              }
            ]}
            placeholder="Where you're currently staying"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Family Size</Text>
          <View style={styles.counterContainer}>
            <TouchableOpacity
              style={[styles.counterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                const currentValue = parseInt(familySize || '1', 10);
                if (currentValue > 1) {
                  setFamilySize((currentValue - 1).toString());
                }
              }}
              disabled={parseInt(familySize || '1', 10) <= 1}
            >
              <Text style={[styles.counterButtonText, { color: colors.text }]}>-</Text>
            </TouchableOpacity>
            
            <TextInput
              style={[
                styles.counterInput,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              keyboardType="number-pad"
              value={familySize}
              onChangeText={handleUpdateFamilySize}
              textAlign="center"
            />
            
            <TouchableOpacity
              style={[styles.counterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                const currentValue = parseInt(familySize || '1', 10);
                setFamilySize((currentValue + 1).toString());
              }}
            >
              <Text style={[styles.counterButtonText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[
          styles.privacyNote, 
          { 
            backgroundColor: colors.primaryLight,
          }
        ]}>
          <Text style={[styles.privacyNoteText, { color: colors.primary }]}>
            Your information is stored securely on your device and is only shared with organizations you approve.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  counterInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  privacyNote: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  privacyNoteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});