import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, DollarSign, Phone, ExternalLink, Search, Filter } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

type FinancialProgram = {
  id: string;
  name: string;
  description: string;
  type: 'federal' | 'state' | 'local' | 'nonprofit';
  maxAmount: string;
  eligibility: string;
  applicationProcess: string;
  contact: {
    phone?: string;
    website?: string;
  };
  image: string;
};

export default function FinancialAidScreen() {
  const { colors } = useTheme();
  const { deviceType } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMaxWidth = getResponsiveValue('100%', 800, 1000);
  
  const padding = getPadding(deviceType);
  const maxWidth = getMaxWidth(deviceType);

  const programs: FinancialProgram[] = [
    {
      id: '1',
      name: 'FEMA Individual Assistance',
      description: 'Federal assistance for disaster survivors including temporary housing, home repairs, and other disaster-related expenses.',
      type: 'federal',
      maxAmount: 'Up to $37,900',
      eligibility: 'Disaster survivors in declared disaster areas with uninsured losses',
      applicationProcess: 'Apply online at DisasterAssistance.gov or call 1-800-621-3362',
      contact: {
        phone: '1-800-621-3362',
        website: 'https://www.disasterassistance.gov',
      },
      image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
    },
    {
      id: '2',
      name: 'SBA Disaster Loans',
      description: 'Low-interest disaster loans for homeowners, renters, and businesses to repair or replace damaged property.',
      type: 'federal',
      maxAmount: 'Up to $500,000',
      eligibility: 'Property owners and renters in disaster-declared areas',
      applicationProcess: 'Apply online at SBA.gov/disaster or visit a Disaster Loan Outreach Center',
      contact: {
        phone: '1-800-659-2955',
        website: 'https://www.sba.gov/disaster',
      },
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
    },
    {
      id: '3',
      name: 'Red Cross Emergency Financial Assistance',
      description: 'Immediate financial assistance for emergency needs like food, clothing, shelter, and medical expenses.',
      type: 'nonprofit',
      maxAmount: 'Varies by need',
      eligibility: 'Disaster victims with immediate emergency needs',
      applicationProcess: 'Contact local Red Cross chapter or visit a disaster relief operation',
      contact: {
        phone: '1-800-733-2767',
        website: 'https://www.redcross.org',
      },
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
    },
    {
      id: '4',
      name: 'State Disaster Relief Fund',
      description: 'State-funded assistance for disaster survivors not covered by federal programs.',
      type: 'state',
      maxAmount: 'Up to $15,000',
      eligibility: 'State residents affected by declared disasters',
      applicationProcess: 'Apply through state emergency management agency',
      contact: {
        phone: '(555) 123-4567',
        website: 'https://state.gov/disaster-relief',
      },
      image: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
    },
  ];

  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type: FinancialProgram['type']) => {
    switch (type) {
      case 'federal':
        return colors.primary;
      case 'state':
        return colors.success;
      case 'local':
        return colors.warning;
      case 'nonprofit':
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  const renderProgram = (program: FinancialProgram) => (
    <View key={program.id} style={[styles.programCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: program.image }} style={styles.programImage} />
      
      <View style={styles.programContent}>
        <View style={styles.programHeader}>
          <Text style={[styles.programName, { color: colors.text }]}>{program.name}</Text>
          <View style={[styles.typeTag, { backgroundColor: getTypeColor(program.type) + '20' }]}>
            <Text style={[styles.typeTagText, { color: getTypeColor(program.type) }]}>
              {program.type.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.programDescription, { color: colors.textSecondary }]}>
          {program.description}
        </Text>

        <View style={styles.programDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.primary }]}>Max Amount:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{program.maxAmount}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.primary }]}>Eligibility:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{program.eligibility}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.primary }]}>How to Apply:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{program.applicationProcess}</Text>
          </View>
        </View>

        <View style={styles.contactButtons}>
          {program.contact.phone && (
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: colors.success }]}
              onPress={() => console.log(`Calling ${program.contact.phone}`)}
            >
              <Phone size={16} color="white" />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          
          {program.contact.website && (
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: colors.primary }]}
              onPress={() => console.log(`Opening ${program.contact.website}`)}
            >
              <ExternalLink size={16} color="white" />
              <Text style={styles.contactButtonText}>Website</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Financial Aid Programs
        </Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={[styles.content, { paddingHorizontal: padding, maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg' }}
          style={styles.heroImage}
        />

        <View style={styles.introSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            Financial Aid Programs
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Find financial assistance programs to help with disaster recovery costs, including housing, repairs, and essential needs.
          </Text>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search financial programs..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={[styles.tipBox, { backgroundColor: colors.primaryLight }]}>
          <DollarSign size={20} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.text }]}>
            Apply for assistance as soon as possible. Many programs have deadlines and limited funding.
          </Text>
        </View>

        <View style={styles.programsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Available Programs ({filteredPrograms.length})
          </Text>
          
          {filteredPrograms.map(renderProgram)}
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
          <Text style={[styles.infoTitle, { color: colors.warning }]}>Important Notes</Text>
          <Text style={[styles.infoText, { color: colors.text }]}>
            • Keep all receipts and documentation related to disaster expenses{'\n'}
            • Apply for FEMA assistance before applying for SBA loans{'\n'}
            • Be aware of application deadlines - they vary by program{'\n'}
            • Watch out for scams - legitimate agencies will never ask for upfront fees
          </Text>
        </View>
      </ScrollView>
      <BoltBadge />
    </SafeAreaView>
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
    paddingBottom: 80,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  introSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 16,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  tipText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  programsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  programCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  programImage: {
    width: '100%',
    height: 120,
  },
  programContent: {
    padding: 16,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  programDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  programDetails: {
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});