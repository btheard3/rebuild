import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { analyticsService } from './analyticsService';

interface UserIdentityData {
  fullName: string;
  governmentId: string;
  insurancePolicyNumber: string;
  insuranceProvider: string;
  primaryContactName: string;
  primaryContactPhone: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  currentAddress: string;
  city: string;
  state: string;
  zipCode: string;
  [key: string]: any;
}

interface BlockchainRecord {
  hash: string;
  transactionId: string;
  timestamp: Date;
  verified: boolean;
}

class IdentityVaultService {
  private secureStorage: Map<string, any> = new Map();
  private backupHistory: BlockchainRecord[] = [];

  /**
   * Generates a SHA-256 hash of the provided data
   * @param data User identity data to hash
   * @returns Promise resolving to a hex string hash
   */
  async generateDataHash(data: UserIdentityData, userId?: string): Promise<string> {
    try {
      // Add metadata to ensure uniqueness
      const dataWithMetadata = {
        ...data,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      // Convert to string for hashing
      const dataString = JSON.stringify(dataWithMetadata);
      
      // Use expo-crypto for secure hashing
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      return hash;
    } catch (error) {
      console.error('Hash generation failed:', error);
      analyticsService.trackError('hash_generation_failed', 'IdentityVaultService', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to generate secure hash');
    }
  }

  /**
   * Simulates storing a hash on the Algorand blockchain
   * @param hash The SHA-256 hash to store
   * @returns Promise resolving to a transaction ID
   */
  async storeHashOnBlockchain(hash: string): Promise<string> {
    try {
      // In a real implementation, this would interact with Algorand SDK
      // For demo purposes, we'll simulate the blockchain interaction
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a realistic-looking Algorand transaction ID
      const prefix = 'ALGO';
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 10).toUpperCase();
      const txId = `${prefix}${timestamp}${random}`;
      
      analyticsService.trackEvent('blockchain_hash_stored', {
        hash_length: hash.length,
        transaction_id: txId
      });
      
      return txId;
    } catch (error) {
      console.error('Blockchain storage failed:', error);
      analyticsService.trackError('blockchain_storage_failed', 'IdentityVaultService', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to store hash on blockchain');
    }
  }

  /**
   * Creates a blockchain backup of user identity data
   * @param data User identity data to backup
   * @param userId Optional user ID for tracking
   * @returns Promise resolving to a blockchain record
   */
  async createBlockchainBackup(data: UserIdentityData, userId?: string): Promise<BlockchainRecord> {
    try {
      // Generate hash of user data
      const hash = await this.generateDataHash(data, userId);
      
      // Store hash on blockchain (simulated)
      const transactionId = await this.storeHashOnBlockchain(hash);
      
      // Create blockchain record
      const record: BlockchainRecord = {
        hash,
        transactionId,
        timestamp: new Date(),
        verified: false
      };
      
      // Store in backup history
      this.backupHistory.push(record);
      
      // Store encrypted data in secure storage (simulated)
      this.secureStorage.set(hash, {
        data,
        timestamp: new Date(),
        userId
      });
      
      return record;
    } catch (error) {
      console.error('Blockchain backup failed:', error);
      analyticsService.trackError('blockchain_backup_failed', 'IdentityVaultService', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to create blockchain backup');
    }
  }

  /**
   * Verifies the integrity of user data against a blockchain record
   * @param data Current user data to verify
   * @param storedHash Previously stored hash to compare against
   * @param userId Optional user ID for tracking
   * @returns Promise resolving to a boolean indicating verification success
   */
  async verifyDataIntegrity(data: UserIdentityData, storedHash: string, userId?: string): Promise<boolean> {
    try {
      // Generate hash of current data
      const currentHash = await this.generateDataHash(data, userId);
      
      // Compare with stored hash
      const isValid = currentHash === storedHash;
      
      analyticsService.trackEvent('data_integrity_verification', {
        success: isValid,
        user_id: userId || 'anonymous'
      });
      
      return isValid;
    } catch (error) {
      console.error('Data verification failed:', error);
      analyticsService.trackError('data_verification_failed', 'IdentityVaultService', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Failed to verify data integrity');
    }
  }

  /**
   * Simulates retrieving transaction details from Algorand blockchain
   * @param transactionId The transaction ID to look up
   * @returns Promise resolving to transaction details
   */
  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      // In a real implementation, this would query the Algorand blockchain
      // For demo purposes, we'll return simulated data
      
      // Find the matching record in our history
      const record = this.backupHistory.find(r => r.transactionId === transactionId);
      
      if (!record) {
        throw new Error('Transaction not found');
      }
      
      return {
        id: transactionId,
        confirmed: true,
        round: 12345678,
        timestamp: record.timestamp.getTime() / 1000,
        sender: 'ALGORAND1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        receiver: 'ALGORAND0987654321ZYXWVUTSRQPONMLKJIHGFEDCBA',
        amount: 0,
        note: Buffer.from(record.hash).toString('base64'),
        type: 'pay'
      };
    } catch (error) {
      console.error('Transaction lookup failed:', error);
      analyticsService.trackError('transaction_lookup_failed', 'IdentityVaultService', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transaction_id: transactionId
      });
      throw new Error('Failed to retrieve transaction details');
    }
  }

  /**
   * Gets the URL for viewing a transaction on AlgoExplorer
   * @param transactionId The transaction ID to view
   * @param network The Algorand network (mainnet, testnet, etc.)
   * @returns The AlgoExplorer URL
   */
  getAlgoExplorerUrl(transactionId: string, network: 'mainnet' | 'testnet' = 'testnet'): string {
    return `https://${network !== 'mainnet' ? network + '.' : ''}algoexplorer.io/tx/${transactionId}`;
  }

  /**
   * Formats a hash for display by showing only the first and last few characters
   * @param hash The full hash string
   * @param prefixLength Number of characters to show at the beginning
   * @param suffixLength Number of characters to show at the end
   * @returns Formatted hash string
   */
  formatHashForDisplay(hash: string, prefixLength: number = 6, suffixLength: number = 6): string {
    if (!hash || hash.length <= prefixLength + suffixLength) {
      return hash || '';
    }
    
    return `${hash.substring(0, prefixLength)}...${hash.substring(hash.length - suffixLength)}`;
  }

  /**
   * Gets the backup history for a user
   * @param userId The user ID to filter by
   * @returns Array of blockchain records
   */
  getBackupHistory(userId?: string): BlockchainRecord[] {
    // In a real implementation, this would filter by user ID
    return [...this.backupHistory];
  }

  /**
   * Clears all stored data (for testing/development)
   */
  clearAllData(): void {
    this.secureStorage.clear();
    this.backupHistory = [];
  }
}

export const identityVaultService = new IdentityVaultService();