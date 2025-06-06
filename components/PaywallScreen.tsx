import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { revenueCatService } from '@/services/revenueCatService';
import { analyticsService } from '@/services/analyticsService';
import { X, Check, Crown, Zap, Shield, Heart } from 'lucide-react-native';

interface PaywallScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallScreen({ visible, onClose }: PaywallScreenProps) {
  const { colors } = useTheme();
  const { updatePremiumStatus } = useAuth();
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadOfferings();
      analyticsService.trackScreen('paywall');
    }
  }, [visible]);

  const loadOfferings = async () => {
    setLoading(true);
    try {
      const availableOfferings = await revenueCatService.getOfferings();
      setOfferings(availableOfferings);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      analyticsService.trackError('paywall_load_offerings_failed', 'PaywallScreen', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageIdentifier: string) => {
    setPurchasing(packageIdentifier);
    analyticsService.trackEvent('paywall_purchase_initiated', { package: packageIdentifier });
    
    try {
      const success = await revenueCatService.purchasePackage(packageIdentifier);
      if (success) {
        updatePremiumStatus(true);
        analyticsService.trackEvent('paywall_purchase_completed', { package: packageIdentifier });
        onClose();
      } else {
        analyticsService.trackEvent('paywall_purchase_failed', { package: packageIdentifier });
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      analyticsService.trackError('paywall_purchase_error', 'PaywallScreen', { 
        package: packageIdentifier, 
        error: error.message 
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    analyticsService.trackEvent('paywall_restore_initiated');
    
    try {
      const success = await revenueCatService.restorePurchases();
      if (success) {
        updatePremiumStatus(true);
        analyticsService.trackEvent('paywall_restore_completed');
        onClose();
      } else {
        analyticsService.trackEvent('paywall_restore_no_purchases');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      analyticsService.trackError('paywall_restore_error', 'PaywallScreen', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const premiumFeatures = [
    {
      icon: Zap,
      title: 'AI Voice Affirmations',
      description: 'Personalized voice messages for emotional support'
    },
    {
      icon: Crown,
      title: 'AI Video Check-ins',
      description: 'Personalized video messages from your AI companion'
    },
    {
      icon: Shield,
      title: 'Blockchain Document Verification',
      description: 'Secure, tamper-proof document storage'
    },
    {
      icon: Heart,
      title: 'Advanced Analytics',
      description: 'Detailed insights into your recovery progress'
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <View style={[styles.crownContainer, { backgroundColor: colors.primary + '20' }]}>
              <Crown size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Unlock Premium Features</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Get the most out of your recovery journey with advanced AI-powered tools
            </Text>
          </View>

          <View style={styles.featuresSection}>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={[styles.featureItem, { borderColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + '20' }]}>
                  <feature.icon size={24} color={colors.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
                <Check size={20} color={colors.success} />
              </View>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading subscription options...
              </Text>
            </View>
          ) : (
            <View style={styles.pricingSection}>
              {offerings.map((offering) => (
                <View key={offering.identifier} style={styles.offeringContainer}>
                  {offering.availablePackages?.map((pkg: any) => (
                    <TouchableOpacity
                      key={pkg.identifier}
                      style={[
                        styles.packageCard,
                        { 
                          backgroundColor: colors.surface,
                          borderColor: colors.primary,
                          borderWidth: 2
                        }
                      ]}
                      onPress={() => handlePurchase(pkg.identifier)}
                      disabled={purchasing !== null}
                    >
                      <View style={styles.packageHeader}>
                        <Text style={[styles.packageTitle, { color: colors.text }]}>
                          {pkg.product.title}
                        </Text>
                        <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.popularText}>Most Popular</Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.packagePrice, { color: colors.primary }]}>
                        {pkg.product.priceString}
                      </Text>
                      
                      <Text style={[styles.packageDescription, { color: colors.textSecondary }]}>
                        {pkg.product.description}
                      </Text>

                      <View style={[styles.purchaseButton, { backgroundColor: colors.primary }]}>
                        {purchasing === pkg.identifier ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text style={styles.purchaseButtonText}>Start Premium</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          <View style={styles.footerSection}>
            <TouchableOpacity onPress={handleRestore} disabled={loading}>
              <Text style={[styles.restoreText, { color: colors.primary }]}>
                Restore Purchases
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              By subscribing, you agree to our Terms of Service and Privacy Policy. 
              Subscription automatically renews unless cancelled.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 60,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  pricingSection: {
    marginBottom: 32,
  },
  offeringContainer: {
    gap: 16,
  },
  packageCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  popularBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  packagePrice: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  packageDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  purchaseButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerSection: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  restoreText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});