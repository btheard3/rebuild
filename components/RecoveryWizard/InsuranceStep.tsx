import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useWizard } from './WizardContext';
import { HelpCircle } from 'lucide-react-native';

export default function InsuranceStep() {
  const { colors } = useTheme();
  const { data, updateData } = useWizard();
  
  const [hasInsurance, setHasInsurance] = useState(data.insurance?.hasInsurance ?? false);
  const [provider, setProvider] = useState(data.insurance?.provider || '');
  const [policyNumber, setPolicyNumber] = useState(data.insurance?.policyNumber || '');
  const [contactPhone, setContactPhone] = useState(data.insurance?.contactPhone || '');
  const [showHelp, setShowHelp] = useState(false);
  
  useEffect(() => {
    updateData({
      insurance: {
        hasInsurance,
        provider,
        policyNumber,
        contactPhone,
      },
    });
  }, [hasInsurance, provider, policyNumber, contactPhone]);
  
  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Insurance Information</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        This helps us guide you through the insurance claims process.
      </Text>
      
      <View style={styles.toggleContainer}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>Do you have insurance coverage?</Text>
        <View style={styles.switchContainer}>
          <Text style={[
            styles.switchLabel, 
            { color: hasInsurance ? colors.textSecondary : colors.text }
          ]}>No</Text>
          <Switch
            value={hasInsurance}
            onValueChange={setHasInsurance}
            trackColor={{ false: colors.disabled, true: colors.primary + '70' }}
            thumbColor={hasInsurance ? colors.primary : colors.border}
          />
          <Text style={[
            styles.switchLabel, 
            { color: hasInsurance ? colors.text : colors.textSecondary }
          ]}>Yes</Text>
        </View>
      </View>
      
      {hasInsurance && (
        <>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Insurance Provider</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              placeholder="e.g., State Farm, Allstate"
              placeholderTextColor={colors.textSecondary}
              value={provider}
              onChangeText={setProvider}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Policy Number</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              placeholder="Your policy number"
              placeholderTextColor={colors.textSecondary}
              value={policyNumber}
              onChangeText={setPolicyNumber}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Insurance Contact Number</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.surface, 
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              placeholder="Insurance company phone"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={setContactPhone}
            />
          </View>
        </>
      )}
      
      <TouchableOpacity 
        style={[styles.helpButton, { borderColor: colors.border }]}
        onPress={() => setShowHelp(!showHelp)}
      >
        <HelpCircle size={20} color={colors.primary} />
        <Text style={[styles.helpButtonText, { color: colors.primary }]}>
          {showHelp ? 'Hide insurance tips' : 'Need help with insurance?'}
        </Text>
      </TouchableOpacity>
      
      {showHelp && (
        <View style={[
          styles.helpContainer,
          { backgroundColor: colors.primaryLight }
        ]}>
          <Text style={[styles.helpTitle, { color: colors.primary }]}>Insurance Claim Tips:</Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            1. Document all damage with photos before cleanup
          </Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            2. Keep receipts for all expenses related to recovery
          </Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            3. Contact your insurance provider as soon as possible
          </Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            4. Take detailed notes of all conversations with agents
          </Text>
          <Text style={[styles.helpText, { color: colors.text }]}>
            5. Ask about temporary housing assistance if needed
          </Text>
        </View>
      )}
      
      {!hasInsurance && (
        <View style={[
          styles.noInsuranceContainer,
          { backgroundColor: colors.warning + '20' }
        ]}>
          <Text style={[styles.noInsuranceTitle, { color: colors.warning }]}>
            No Insurance? Don't worry.
          </Text>
          <Text style={[styles.noInsuranceText, { color: colors.text }]}>
            We'll help you connect with disaster relief programs and community resources that can assist with recovery.
          </Text>
        </View>
      )}
    </ScrollView>
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
  toggleContainer: {
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 16,
    marginHorizontal: 8,
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
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  helpButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  helpContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  noInsuranceContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  noInsuranceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noInsuranceText: {
    fontSize: 14,
    lineHeight: 22,
  },
});