import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useWizard } from './WizardContext';
import { FileText, Share as ShareIcon, Download, CheckCircle } from 'lucide-react-native';

export default function SummaryStep() {
  const { colors } = useTheme();
  const { data } = useWizard();
  
  const disasterNames: Record<string, string> = {
    hurricane: 'Hurricane',
    flood: 'Flood',
    fire: 'Fire',
    earthquake: 'Earthquake',
    tornado: 'Tornado',
    other: 'Other Disaster',
  };

  const disasterTypeImage: Record<string, string> = {
    hurricane: 'https://images.pexels.com/photos/753619/pexels-photo-753619.jpeg',
    flood: 'https://images.pexels.com/photos/1756932/pexels-photo-1756932.jpeg',
    fire: 'https://images.pexels.com/photos/51951/forest-fire-fire-smoke-conservation-51951.jpeg',
    earthquake: 'https://images.pexels.com/photos/5461212/pexels-photo-5461212.jpeg',
    tornado: 'https://images.pexels.com/photos/1446076/pexels-photo-1446076.jpeg',
    other: 'https://images.pexels.com/photos/6170463/pexels-photo-6170463.jpeg',
  };
  
  const disasterTypeDisplayName = data.disasterType ? disasterNames[data.disasterType] : 'Unknown';
  const disasterImage = data.disasterType ? disasterTypeImage[data.disasterType] : disasterTypeImage.other;
  
  const renderSelectedNeeds = () => {
    if (!data.immediateNeeds) return null;
    
    const selectedNeeds = Object.entries(data.immediateNeeds)
      .filter(([key, value]) => value === true && key !== 'other')
      .map(([key]) => key);
    
    if (selectedNeeds.length === 0 && !data.immediateNeeds.other) {
      return <Text style={[styles.detailText, { color: colors.textSecondary }]}>None specified</Text>;
    }
    
    return (
      <>
        {selectedNeeds.map(need => (
          <View key={need} style={styles.needItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.needText, { color: colors.text }]}>
              {need.charAt(0).toUpperCase() + need.slice(1)}
            </Text>
          </View>
        ))}
        {data.immediateNeeds.other && data.immediateNeeds.otherDetails && (
          <View style={styles.needItem}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={[styles.needText, { color: colors.text }]}>
              Other: {data.immediateNeeds.otherDetails}
            </Text>
          </View>
        )}
      </>
    );
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `My disaster recovery plan for ${disasterTypeDisplayName} recovery.\n\nContact information: ${data.personalInfo?.name}, ${data.personalInfo?.phone}\n\nCurrent location: ${data.personalInfo?.address}\n\nImmediate needs: ${data.immediateNeeds?.shelter ? 'Shelter, ' : ''}${data.immediateNeeds?.food ? 'Food, ' : ''}${data.immediateNeeds?.medical ? 'Medical, ' : ''}${data.immediateNeeds?.utilities ? 'Utilities, ' : ''}${data.immediateNeeds?.transportation ? 'Transportation, ' : ''}${data.immediateNeeds?.other ? 'Other' : ''}\n\nGenerated with Rebuild app`,
        title: 'My Recovery Plan',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Your Recovery Plan</Text>
      
      <View style={[
        styles.summaryCard, 
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border, 
        }
      ]}>
        <View style={styles.disasterHeader}>
          <Image source={{ uri: disasterImage }} style={styles.disasterImage} />
          <View style={[styles.disasterOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
          <Text style={styles.disasterTitle}>{disasterTypeDisplayName} Recovery</Text>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.sectionDivider} />
          
          <View style={styles.summarySection}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Contact Information</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Name:</Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {data.personalInfo?.name || 'Not provided'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone:</Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {data.personalInfo?.phone || 'Not provided'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Location:</Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {data.personalInfo?.address || 'Not provided'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Family Size:</Text>
              <Text style={[styles.detailText, { color: colors.text }]}>
                {data.personalInfo?.familySize || '1'} {data.personalInfo?.familySize === 1 ? 'person' : 'people'}
              </Text>
            </View>
          </View>
          
          <View style={styles.sectionDivider} />
          
          <View style={styles.summarySection}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Insurance</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Coverage:</Text>
              <Text style={[
                styles.detailText, 
                { 
                  color: data.insurance?.hasInsurance ? colors.success : colors.warning 
                }
              ]}>
                {data.insurance?.hasInsurance ? 'Yes' : 'No'}
              </Text>
            </View>
            
            {data.insurance?.hasInsurance && (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Provider:</Text>
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {data.insurance?.provider || 'Not provided'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Policy Number:</Text>
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {data.insurance?.policyNumber || 'Not provided'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Contact:</Text>
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {data.insurance?.contactPhone || 'Not provided'}
                  </Text>
                </View>
              </>
            )}
          </View>
          
          <View style={styles.sectionDivider} />
          
          <View style={styles.summarySection}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Immediate Needs</Text>
            <View style={styles.needsContainer}>
              {renderSelectedNeeds()}
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => console.log('Download PDF')}
        >
          <Download size={20} color="white" />
          <Text style={styles.actionButtonText}>Save PDF</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={handleShare}
        >
          <ShareIcon size={20} color="white" />
          <Text style={styles.actionButtonText}>Share Plan</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[
        styles.recommendationsCard, 
        { 
          backgroundColor: colors.success + '15',
          borderColor: colors.success,
        }
      ]}>
        <Text style={[styles.recommendationsTitle, { color: colors.success }]}>
          Next Steps
        </Text>
        
        <View style={styles.recommendationItem}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.recommendationText, { color: colors.text }]}>
            Contact your insurance provider to initiate a claim
          </Text>
        </View>
        
        <View style={styles.recommendationItem}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.recommendationText, { color: colors.text }]}>
            Visit the "Resources" tab to find nearby support services
          </Text>
        </View>
        
        <View style={styles.recommendationItem}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.recommendationText, { color: colors.text }]}>
            Upload important documents to your Document Vault
          </Text>
        </View>
        
        <View style={styles.recommendationItem}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.recommendationText, { color: colors.text }]}>
            Check in with the Mental Health resources regularly
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
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
  },
  disasterHeader: {
    height: 100,
    position: 'relative',
  },
  disasterImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  disasterOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  disasterTitle: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    top: '50%',
    marginTop: -16,
  },
  cardContent: {
    padding: 16,
  },
  summarySection: {
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    width: 100,
  },
  detailText: {
    fontSize: 15,
    flex: 1,
  },
  needsContainer: {
    marginTop: 4,
  },
  needItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  needText: {
    fontSize: 15,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  recommendationsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
  },
});