import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useWizard } from './WizardContext';

type NeedType = 'shelter' | 'food' | 'medical' | 'utilities' | 'transportation' | 'other';

export default function ImmediateNeedsStep() {
  const { colors } = useTheme();
  const { data, updateData } = useWizard();
  
  const [needs, setNeeds] = useState({
    shelter: data.immediateNeeds?.shelter ?? false,
    food: data.immediateNeeds?.food ?? false,
    medical: data.immediateNeeds?.medical ?? false,
    utilities: data.immediateNeeds?.utilities ?? false,
    transportation: data.immediateNeeds?.transportation ?? false,
    other: data.immediateNeeds?.other ?? false,
  });
  
  const [otherDetails, setOtherDetails] = useState(data.immediateNeeds?.otherDetails || '');
  
  const toggleNeed = (need: NeedType) => {
    setNeeds(prev => ({
      ...prev,
      [need]: !prev[need],
    }));
  };
  
  useEffect(() => {
    updateData({
      immediateNeeds: {
        ...needs,
        otherDetails,
      },
    });
  }, [needs, otherDetails]);
  
  const needsData = [
    { id: 'shelter', label: 'Emergency Shelter' },
    { id: 'food', label: 'Food and Water' },
    { id: 'medical', label: 'Medical Assistance' },
    { id: 'utilities', label: 'Utilities (Power, Water, Gas)' },
    { id: 'transportation', label: 'Transportation' },
    { id: 'other', label: 'Other Needs' },
  ];
  
  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Immediate Needs</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Select the resources you need most urgently. This helps us prioritize your recovery plan.
      </Text>
      
      <View style={[
        styles.needsContainer, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border 
        }
      ]}>
        {needsData.map(need => (
          <View key={need.id} style={styles.needItem}>
            <Text style={[styles.needLabel, { color: colors.text }]}>{need.label}</Text>
            <Switch
              value={needs[need.id as NeedType]}
              onValueChange={() => toggleNeed(need.id as NeedType)}
              trackColor={{ false: colors.disabled, true: colors.success + '70' }}
              thumbColor={needs[need.id as NeedType] ? colors.success : colors.border}
            />
          </View>
        ))}
      </View>
      
      {needs.other && (
        <View style={styles.otherDetailsContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Please specify other needs:</Text>
          <TextInput
            style={[
              styles.textArea,
              { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border
              }
            ]}
            placeholder="Describe any other needs you have..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={otherDetails}
            onChangeText={setOtherDetails}
          />
        </View>
      )}
      
      <View style={[styles.infoBox, { backgroundColor: colors.info + '20' }]}>
        <Text style={[styles.infoTitle, { color: colors.primary }]}>What happens next?</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          Based on your selections, we'll create a personalized recovery plan with:
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Step-by-step recovery checklist
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Local resources tailored to your needs
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Important forms and document templates
          </Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>
            • Agency contact information
          </Text>
        </View>
      </View>
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
  needsContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  needItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  needLabel: {
    fontSize: 16,
  },
  otherDetailsContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  infoBox: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  bulletPoints: {
    marginLeft: 8,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
  },
});