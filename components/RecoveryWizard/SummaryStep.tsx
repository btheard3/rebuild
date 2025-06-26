import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { useWizard } from './WizardContext';
import { analyticsService } from '@/services/analyticsService';
import { openaiService } from '@/services/openaiService';
import { FileText, Share as ShareIcon, Download, CircleCheck as CheckCircle, Sparkles } from 'lucide-react-native';

export default function SummaryStep() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data } = useWizard();
  const { deviceType } = useResponsive();
  
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  const getMaxWidth = getResponsiveValue('100%', 600, 800);
  const maxWidth = getMaxWidth(deviceType);
  
  const disasterNames: Record<string, string> = {
    hurricane: 'Hurricane',
    flood: 'Flood',
    fire: 'Fire',
    earthquake: 'Earthquake',
    tornado: 'Tornado',
    other: 'Other Disaster',
  };

  const disasterTypeImage: Record<string, string> = {
    hurricane: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
    flood: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
    fire: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
    earthquake: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
    tornado: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
    other: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
  };
  
  const disasterTypeDisplayName = data.disasterType ? disasterNames[data.disasterType] : 'Unknown';
  const disasterImage = data.disasterType ? disasterTypeImage[data.disasterType] : disasterTypeImage.other;
  
  const saveRecoveryPlan = async () => {
    try {
      const apiUrl = '/.netlify/functions/recovery-plan';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          planData: {
            ...data,
            aiRecommendations, // Include AI-generated recommendations
          },
        }),
      });

      if (!response.ok) {
        // If response is not ok, read as text to get the actual error message
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        analyticsService.trackEvent('recovery_plan_saved', {
          planId: result.planId,
          priorityScore: result.priorityScore,
          recommendationsCount: result.recommendations?.length || 0,
          aiRecommendationsCount: aiRecommendations.length,
        });
        
        console.log('Recovery plan saved successfully:', result);
      } else {
        console.error('Failed to save recovery plan:', result.error);
      }
    } catch (error) {
      console.error('Error saving recovery plan:', error);
    }
  };

  const generateAIRecommendations = async () => {
    if (!data.disasterType) return;
    
    setLoadingRecommendations(true);
    analyticsService.trackEvent('ai_recommendations_generation_started', {
      disasterType: data.disasterType,
      hasInsurance: data.insurance?.hasInsurance,
    });

    try {
      const recommendations = await openaiService.generateRecoveryRecommendations(data);
      setAiRecommendations(recommendations);
      
      analyticsService.trackEvent('ai_recommendations_generated', {
        disasterType: data.disasterType,
        recommendationsCount: recommendations.length,
      });
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      analyticsService.trackError('ai_recommendations_failed', 'SummaryStep', {
        error: error.message,
        disasterType: data.disasterType,
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    // Auto-save the recovery plan when the summary is displayed
    if (user && data.disasterType) {
      saveRecoveryPlan();
    }
    
    // Generate AI recommendations
    generateAIRecommendations();
  }, [user, data]);
  
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
      
      analyticsService.trackEvent('recovery_plan_shared', {
        disasterType: data.disasterType,
        hasInsurance: data.insurance?.hasInsurance,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  return (
    <ScrollView style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
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
      
      <View style={[
        styles.actionButtons,
        deviceType === 'mobile' ? styles.actionButtonsMobile : styles.actionButtonsDesktop
      ]}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            analyticsService.trackEvent('recovery_plan_download_requested');
            console.log('Download PDF');
          }}
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
      
      {/* AI-Generated Recommendations Section */}
      <View style={[
        styles.recommendationsCard, 
        { 
          backgroundColor: colors.primary + '15',
          borderColor: colors.primary,
        }
      ]}>
        <View style={styles.recommendationsHeader}>
          <Sparkles size={24} color={colors.primary} />
          <Text style={[styles.recommendationsTitle, { color: colors.primary }]}>
            AI-Powered Recommendations
          </Text>
        </View>
        
        {loadingRecommendations ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Generating personalized recommendations...
            </Text>
          </View>
        ) : (
          <>
            {aiRecommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <CheckCircle size={20} color={colors.primary} />
                <Text style={[styles.recommendationText, { color: colors.text }]}>
                  {recommendation}
                </Text>
              </View>
            ))}
            
            {aiRecommendations.length === 0 && (
              <Text style={[styles.noRecommendationsText, { color: colors.textSecondary }]}>
                Unable to generate recommendations at this time. Please check your internet connection and try again.
              </Text>
            )}
          </>
        )}
      </View>

      {/* Standard Next Steps */}
      <View style={[
        styles.recommendationsCard, 
        { 
          backgroundColor: colors.success + '15',
          borderColor: colors.success,
        }
      ]}>
        <Text style={[styles.recommendationsTitle, { color: colors.success }]}>
          Essential Next Steps
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
    marginBottom: 24,
  },
  actionButtonsMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  actionButtonsDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
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
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
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
    lineHeight: 22,
  },
  noRecommendationsText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});