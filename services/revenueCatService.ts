import { Platform } from 'react-native';

// Import types conditionally to avoid errors when the package isn't available
let Purchases: any = null;
let PurchasesOffering: any = null;
let CustomerInfo: any = null;

// Safely import RevenueCat only on native platforms
if (Platform.OS !== 'web') {
  try {
    const RevenueCatModule = require('react-native-purchases');
    Purchases = RevenueCatModule.default || RevenueCatModule.Purchases;
    PurchasesOffering = RevenueCatModule.PurchasesOffering;
    CustomerInfo = RevenueCatModule.CustomerInfo;
  } catch (error) {
    console.warn('RevenueCat not available:', error);
  }
}

class RevenueCatService {
  private initialized = false;

  async initialize() {
    if (this.initialized || Platform.OS === 'web') {
      return;
    }

    // Check if Purchases is available
    if (!Purchases) {
      console.warn('RevenueCat Purchases module not available');
      return;
    }

    try {
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
      if (!apiKey || apiKey.includes('placeholder')) {
        console.warn('RevenueCat API key not configured');
        return;
      }

      await Purchases.configure({ apiKey });
      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true;
    }

    if (!Purchases) {
      console.warn('RevenueCat Purchases module not available');
      return false;
    }

    if (!this.initialized) {
      await this.initialize();
    }

    // Double-check that Purchases is properly configured
    try {
      if (!Purchases.isConfigured) {
        console.warn('RevenueCat is not configured, attempting to reinitialize');
        await this.initialize();
      }
    } catch (error) {
      console.error('Error checking RevenueCat configuration:', error);
      return false;
    }

    return this.initialized;
  }

  async getOfferings(): Promise<any[]> {
    if (Platform.OS === 'web') {
      // Mock offerings for web
      return [
        {
          identifier: 'premium_monthly',
          serverDescription: 'Premium Monthly Subscription',
          metadata: {},
          availablePackages: [
            {
              identifier: 'premium_monthly',
              packageType: 'MONTHLY',
              product: {
                identifier: 'premium_monthly',
                description: 'Premium features including AI voice, video check-ins, and advanced analytics',
                title: 'Premium Monthly',
                price: 9.99,
                priceString: '$9.99',
                currencyCode: 'USD',
                introPrice: null,
                discounts: []
              },
              offeringIdentifier: 'premium_monthly'
            }
          ],
          lifetime: null,
          annual: null,
          sixMonth: null,
          threeMonth: null,
          twoMonth: null,
          monthly: null,
          weekly: null
        }
      ];
    }

    const isInitialized = await this.ensureInitialized();
    if (!isInitialized) {
      console.error('RevenueCat not initialized, cannot get offerings');
      return [];
    }

    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return [];
    }
  }

  async purchasePackage(packageIdentifier: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Mock purchase for web
      console.log('Mock purchase for web:', packageIdentifier);
      return true;
    }

    const isInitialized = await this.ensureInitialized();
    if (!isInitialized) {
      console.error('RevenueCat not initialized, cannot purchase package');
      return false;
    }

    try {
      const offerings = await Purchases.getOfferings();
      const targetPackage = Object.values(offerings.all)
        .flatMap((offering: any) => offering.availablePackages)
        .find((pkg: any) => pkg.identifier === packageIdentifier);

      if (!targetPackage) {
        throw new Error('Package not found');
      }

      const { customerInfo } = await Purchases.purchasePackage(targetPackage);
      return customerInfo.entitlements.active['premium'] !== undefined;
    } catch (error) {
      console.error('Purchase failed:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    const isInitialized = await this.ensureInitialized();
    if (!isInitialized) {
      console.error('RevenueCat not initialized, cannot restore purchases');
      return false;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo.entitlements.active['premium'] !== undefined;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  async getCustomerInfo(): Promise<any | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    const isInitialized = await this.ensureInitialized();
    if (!isInitialized) {
      console.error('RevenueCat not initialized, cannot get customer info');
      return null;
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  async onCustomerInfoUpdated(callback: (customerInfo: any) => void) {
    if (Platform.OS === 'web') {
      return;
    }

    const isInitialized = await this.ensureInitialized();
    if (!isInitialized) {
      console.error('RevenueCat not initialized, cannot add customer info listener');
      return;
    }

    try {
      Purchases.addCustomerInfoUpdateListener(callback);
    } catch (error) {
      console.error('Failed to add customer info listener:', error);
    }
  }
}

export const revenueCatService = new RevenueCatService();