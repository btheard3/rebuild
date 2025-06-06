import Purchases, { PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

class RevenueCatService {
  private initialized = false;

  async initialize() {
    if (this.initialized || Platform.OS === 'web') {
      return;
    }

    try {
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
      if (!apiKey) {
        console.warn('RevenueCat API key not found');
        return;
      }

      await Purchases.configure({ apiKey });
      this.initialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  async getOfferings(): Promise<PurchasesOffering[]> {
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

    try {
      const offerings = await Purchases.getOfferings();
      const targetPackage = Object.values(offerings.all)
        .flatMap(offering => offering.availablePackages)
        .find(pkg => pkg.identifier === packageIdentifier);

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

    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo.entitlements.active['premium'] !== undefined;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  onCustomerInfoUpdated(callback: (customerInfo: CustomerInfo) => void) {
    if (Platform.OS === 'web') {
      return;
    }

    Purchases.addCustomerInfoUpdateListener(callback);
  }
}

export const revenueCatService = new RevenueCatService();