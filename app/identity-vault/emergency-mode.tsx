import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { analyticsService } from '@/services/analyticsService';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  FileText, 
  User, 
  Heart, 
  Shield, 
  Clock,
  Share as ShareIcon
} from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface EmergencyDocument {
  id: string;
  name: string;
  type: string;
  previewUrl: string;
}

interface EmergencyLocation {
  name: string;
  address: string;
  distance: string;
  type: string;
  phone: string;
}

export default function EmergencyModeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [documents, setDocuments] = useState<EmergencyDocument[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<EmergencyLocation[]>([]);
  const [activationTime, setActivationTime] = useState<Date>(new Date());

  useEffect(() => {
    analyticsService.trackScreen('emergency_mode');
    analyticsService.trackEvent('emergency_mode_activated', {
      user_id: user?.id,
      timestamp: new Date().toISOString()
    });
    
    loadEmergencyData();
  }, []);

  const loadEmergencyData = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would fetch data from Supabase or local storage
      // For demo purposes, we'll use mock data
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Load personal info
      setPersonalInfo({
        fullName: 'John A. Smith',
        governmentId: '*****1234',
        insuranceProvider: 'State Farm',
        insurancePolicyNumber: '*****7890',
        bloodType: 'O+',
        allergies: 'Penicillin',
        medicalConditions: 'None',
      });
      
      // Load emergency contacts
      setEmergencyContacts([
        {
          name: 'Jane Smith',
          relationship: 'Spouse',
          phone: '(555) 123-4567',
        },
        {
          name: 'Robert Johnson',
          relationship: 'Brother',
          phone: '(555) 987-6543',
        }
      ]);
      
      // Load critical documents
      setDocuments([
        {
          id: '1',
          name: 'Driver\'s License',
          type: 'ID',
          previewUrl: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
        },
        {
          id: '2',
          name: 'Insurance Card',
          type: 'Insurance',
          previewUrl: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
        },
        {
          id: '3',
          name: 'Medical Information',
          type: 'Medical',
          previewUrl: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
        }
      ]);
      
      // Load nearby emergency locations
      setNearbyLocations([
        {
          name: 'Community Relief Center',
          address: '123 Main St, Anytown, USA',
          distance: '0.7 mi',
          type: 'shelter',
          phone: '(555) 123-4567',
        },
        {
          name: 'First Aid Station',
          address: '456 Oak Ave, Anytown, USA',
          distance: '1.2 mi',
          type: 'medical',
          phone: '(555) 987-6543',
        }
      ]);
      
    } catch (error) {
      console.error('Failed to load emergency data:', error);
      Alert.alert('Error', 'Failed to load emergency information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallEmergencyContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Could not open phone app');
    });
    
    analyticsService.trackEvent('emergency_contact_called', {
      phone_number: phone
    });
  };

  const handleViewDocument = (document: EmergencyDocument) => {
    // In a real app, this would open the document viewer
    Alert.alert('Document Viewer', `Viewing ${document.name}`);
    
    analyticsService.trackEvent('emergency_document_viewed', {
      document_id: document.id,
      document_type: document.type
    });
  };

  const handleGetDirections = (location: EmergencyLocation) => {
    // In a real app, this would open maps with directions
    Alert.alert('Maps', `Getting directions to ${location.name}`);
    
    analyticsService.trackEvent('emergency_directions_requested', {
      location_name: location.name,
      location_type: location.type
    });
  };

  const handleCallLocation = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Could not open phone app');
    });
    
    analyticsService.trackEvent('emergency_location_called', {
      phone_number: phone
    });
  };

  const handleShareEmergencyInfo = () => {
    // In a real app, this would generate a shareable summary
    const emergencyInfo = `
EMERGENCY INFORMATION FOR: ${personalInfo?.fullName}

MEDICAL:
- Blood Type: ${personalInfo?.bloodType}
- Allergies: ${personalInfo?.allergies}
- Medical Conditions: ${personalInfo?.medicalConditions}

INSURANCE:
- Provider: ${personalInfo?.insuranceProvider}
- Policy #: ${personalInfo?.insurancePolicyNumber}

EMERGENCY CONTACTS:
${emergencyContacts.map(contact => `- ${contact.name} (${contact.relationship}): ${contact.phone}`).join('\n')}

NEARBY HELP:
${nearbyLocations.map(location => `- ${location.name}: ${location.address} (${location.distance})`).join('\n')}
    `;
    
    Alert.alert('Share Emergency Info', 'This would share your emergency information with first responders or emergency services.');
    
    analyticsService.trackEvent('emergency_info_shared');
  };

  const handleExitEmergencyMode = () => {
    Alert.alert(
      'Exit Emergency Mode',
      'Are you sure you want to exit emergency mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: () => {
            analyticsService.trackEvent('emergency_mode_deactivated', {
              duration_seconds: Math.floor((new Date().getTime() - activationTime.getTime()) / 1000)
            });
            router.back();
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text, fontFamily: 'Inter-Medium' }]}>
            Loading Emergency Information...
          </Text>
        </View>
        <BoltBadge />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.emergencyHeader, { backgroundColor: colors.error }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleExitEmergencyMode}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily: 'Inter-Bold' }]}>EMERGENCY MODE</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShareEmergencyInfo}
          >
            <ShareIcon size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.emergencyBanner, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
          <AlertTriangle size={24} color={colors.error} />
          <Text style={[styles.emergencyText, { color: colors.error, fontFamily: 'Inter-SemiBold' }]}>
            Emergency mode is active. Critical information is displayed below.
          </Text>
        </View>

        {/* Personal Information */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Personal Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>Name:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontFamily: 'Inter-Regular' }]}>{personalInfo?.fullName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>ID Number:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontFamily: 'Inter-Regular' }]}>{personalInfo?.governmentId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>Blood Type:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontFamily: 'Inter-Regular' }]}>{personalInfo?.bloodType}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>Allergies:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontFamily: 'Inter-Regular' }]}>{personalInfo?.allergies}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary, fontFamily: 'Inter-Medium' }]}>Medical:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontFamily: 'Inter-Regular' }]}>{personalInfo?.medicalConditions}</Text>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Phone size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Emergency Contacts</Text>
          </View>
          
          {emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>{contact.name}</Text>
                <Text style={[styles.contactRelationship, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>{contact.relationship}</Text>
                <Text style={[styles.contactPhone, { color: colors.primary, fontFamily: 'Inter-Medium' }]}>{contact.phone}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.callButton, { backgroundColor: colors.success }]}
                onPress={() => handleCallEmergencyContact(contact.phone)}
              >
                <Phone size={20} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Critical Documents */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Critical Documents</Text>
          </View>
          
          <View style={styles.documentsGrid}>
            {documents.map((document) => (
              <TouchableOpacity 
                key={document.id} 
                style={styles.documentCard}
                onPress={() => handleViewDocument(document)}
              >
                <Image source={{ uri: document.previewUrl }} style={styles.documentPreview} />
                <View style={[styles.documentType, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.documentTypeText, { color: colors.primary, fontFamily: 'Inter-SemiBold' }]}>{document.type}</Text>
                </View>
                <Text style={[styles.documentName, { color: colors.text, fontFamily: 'Inter-Medium' }]}>{document.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Emergency Locations */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Nearby Emergency Locations</Text>
          </View>
          
          {nearbyLocations.map((location, index) => (
            <View key={index} style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, { color: colors.text, fontFamily: 'Inter-SemiBold' }]}>{location.name}</Text>
                <Text style={[styles.locationAddress, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>{location.address}</Text>
                <View style={styles.locationMeta}>
                  <Text style={[styles.locationType, { color: colors.primary, fontFamily: 'Inter-Medium' }]}>{location.type}</Text>
                  <Text style={[styles.locationDistance, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>{location.distance}</Text>
                </View>
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity 
                  style={[styles.locationButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleGetDirections(location)}
                >
                  <MapPin size={16} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.locationButton, { backgroundColor: colors.success }]}
                  onPress={() => handleCallLocation(location.phone)}
                >
                  <Phone size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Blockchain Verification */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter-Bold' }]}>Blockchain Verification</Text>
          </View>
          
          <View style={styles.verificationInfo}>
            <View style={[styles.verificationBadge, { backgroundColor: colors.success + '20' }]}>
              <CheckCircle size={16} color={colors.success} />
              <Text style={[styles.verificationText, { color: colors.success, fontFamily: 'Inter-SemiBold' }]}>VERIFIED</Text>
            </View>
            <Text style={[styles.verificationDescription, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
              Your identity information is blockchain-verified and tamper-proof.
            </Text>
          </View>
        </View>

        {/* Emergency Mode Info */}
        <View style={[styles.infoSection, { backgroundColor: colors.error + '15' }]}>
          <View style={styles.infoHeader}>
            <Clock size={20} color={colors.error} />
            <Text style={[styles.infoTitle, { color: colors.error, fontFamily: 'Inter-Bold' }]}>
              Emergency Mode Active
            </Text>
          </View>
          <Text style={[styles.infoText, { color: colors.text, fontFamily: 'Inter-Regular' }]}>
            Emergency Mode displays your critical information for first responders and emergency personnel. 
            This mode will remain active until you manually exit.
          </Text>
          <Text style={[styles.activationTime, { color: colors.textSecondary, fontFamily: 'Inter-Regular' }]}>
            Activated at: {activationTime.toLocaleTimeString()}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.exitButton, { backgroundColor: 'transparent', borderColor: colors.error }]}
          onPress={handleExitEmergencyMode}
        >
          <Text style={[styles.exitButtonText, { color: colors.error, fontFamily: 'Inter-SemiBold' }]}>Exit Emergency Mode</Text>
        </TouchableOpacity>
      </ScrollView>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
  },
  headerRight: {},
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  emergencyText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  documentCard: {
    width: '48%',
    marginBottom: 12,
    position: 'relative',
  },
  documentPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  documentType: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  documentTypeText: {
    fontSize: 10,
  },
  documentName: {
    marginTop: 8,
    fontSize: 14,
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    marginBottom: 4,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationType: {
    fontSize: 12,
    marginRight: 8,
    textTransform: 'uppercase',
  },
  locationDistance: {
    fontSize: 12,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationInfo: {
    alignItems: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  verificationDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  activationTime: {
    fontSize: 12,
  },
  exitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
  },
  exitButtonText: {
    fontSize: 16,
  },
});