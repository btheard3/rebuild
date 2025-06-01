import React, { createContext, useContext, useState } from 'react';

type DisasterType = 'hurricane' | 'flood' | 'fire' | 'earthquake' | 'tornado' | 'other';

type WizardData = {
  disasterType?: DisasterType;
  personalInfo?: {
    name: string;
    phone: string;
    address: string;
    familySize: number;
  };
  insurance?: {
    hasInsurance: boolean;
    provider?: string;
    policyNumber?: string;
    contactPhone?: string;
  };
  immediateNeeds?: {
    shelter: boolean;
    food: boolean;
    medical: boolean;
    utilities: boolean;
    transportation: boolean;
    other: boolean;
    otherDetails?: string;
  };
  currentStep: number;
};

type WizardContextType = {
  data: WizardData;
  updateData: (newData: Partial<WizardData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
  isComplete: boolean;
};

const initialData: WizardData = {
  currentStep: 1,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const WizardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<WizardData>(initialData);
  
  const updateData = (newData: Partial<WizardData>) => {
    setData(prev => ({
      ...prev,
      ...newData,
    }));
  };
  
  const nextStep = () => {
    setData(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
  };
  
  const prevStep = () => {
    if (data.currentStep > 1) {
      setData(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };
  
  const resetWizard = () => {
    setData(initialData);
  };
  
  const isComplete = data.currentStep > 4;
  
  return (
    <WizardContext.Provider 
      value={{ 
        data, 
        updateData, 
        nextStep, 
        prevStep, 
        resetWizard, 
        isComplete 
      }}
    >
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};