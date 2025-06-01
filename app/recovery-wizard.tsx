import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { WizardProvider, useWizard } from '@/components/RecoveryWizard/WizardContext';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import DisasterTypeStep from '@/components/RecoveryWizard/DisasterTypeStep';
import PersonalInfoStep from '@/components/RecoveryWizard/PersonalInfoStep';
import InsuranceStep from '@/components/RecoveryWizard/InsuranceStep';
import ImmediateNeedsStep from '@/components/RecoveryWizard/ImmediateNeedsStep';
import SummaryStep from '@/components/RecoveryWizard/SummaryStep';

function WizardContent() {
  const { colors } = useTheme();
  const { data, prevStep, nextStep, isComplete } = useWizard();
  
  const renderStep = () => {
    switch (data.currentStep) {
      case 1:
        return <DisasterTypeStep />;
      case 2:
        return <PersonalInfoStep />;
      case 3:
        return <InsuranceStep />;
      case 4:
        return <ImmediateNeedsStep />;
      case 5:
        return <SummaryStep />;
      default:
        return <DisasterTypeStep />;
    }
  };

  const steps = [
    'Disaster Type',
    'Personal Info',
    'Insurance',
    'Immediate Needs',
    'Summary'
  ];
  
  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <View 
            style={[
              styles.stepCircle, 
              { 
                backgroundColor: 
                  data.currentStep > index + 1 
                    ? colors.primary
                    : data.currentStep === index + 1 
                      ? colors.primary + '60'
                      : colors.disabled 
              }
            ]}
          >
            {data.currentStep > index + 1 ? (
              <Check size={16} color="white" />
            ) : (
              <Text style={[
                styles.stepNumber, 
                { color: data.currentStep === index + 1 ? 'white' : colors.textSecondary }
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          
          {index < steps.length - 1 && (
            <View 
              style={[
                styles.stepLine,
                { backgroundColor: data.currentStep > index + 1 ? colors.primary : colors.disabled }
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            if (data.currentStep === 1) {
              router.back();
            } else {
              prevStep();
            }
          }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Recovery Wizard
        </Text>
        <View style={styles.placeholderButton} />
      </View>
      
      <View style={styles.content}>
        {renderStepIndicator()}
        
        <View style={styles.stepContent}>
          {renderStep()}
        </View>
        
        <View style={styles.navigationContainer}>
          {!isComplete && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
              onPress={nextStep}
            >
              <Text style={styles.nextButtonText}>
                {data.currentStep === steps.length ? 'Complete' : 'Next'}
              </Text>
              {data.currentStep !== steps.length && (
                <ChevronRight size={20} color="white" />
              )}
            </TouchableOpacity>
          )}
          
          {isComplete && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.nextButtonText}>
                Return Home
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function RecoveryWizard() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderButton: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepLine: {
    height: 2,
    width: 24,
  },
  stepContent: {
    flex: 1,
  },
  navigationContainer: {
    marginTop: 16,
  },
  nextButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
});