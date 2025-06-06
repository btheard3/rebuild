import algosdk from 'algosdk';
import { Platform } from 'react-native';

class AlgorandService {
  private algodClient: algosdk.Algodv2 | null = null;
  private indexerClient: algosdk.Indexer | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    if (Platform.OS === 'web') {
      // For web, we'll use mock implementations
      return;
    }

    try {
      const algodUrl = process.env.EXPO_PUBLIC_ALGONODE_API_URL || 'https://testnet-api.algonode.cloud';
      const indexerUrl = process.env.EXPO_PUBLIC_ALGONODE_INDEXER_URL || 'https://testnet-idx.algonode.cloud';
      
      this.algodClient = new algosdk.Algodv2('', algodUrl, '');
      this.indexerClient = new algosdk.Indexer('', indexerUrl, '');
    } catch (error) {
      console.error('Failed to initialize Algorand clients:', error);
    }
  }

  async storeDocumentHash(documentContent: string, userAddress?: string): Promise<{ txId: string; hash: string } | null> {
    try {
      // Generate SHA-256 hash of the document
      const encoder = new TextEncoder();
      const data = encoder.encode(documentContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (Platform.OS === 'web' || !this.algodClient) {
        // Mock transaction for web or when client is not available
        return {
          txId: `mock_tx_${Date.now()}`,
          hash
        };
      }

      // In a real implementation, you would:
      // 1. Create a transaction with the hash in the note field
      // 2. Sign the transaction with the user's private key
      // 3. Submit the transaction to the network
      
      // For now, return mock data
      return {
        txId: `mock_tx_${Date.now()}`,
        hash
      };
    } catch (error) {
      console.error('Failed to store document hash:', error);
      return null;
    }
  }

  async verifyDocumentHash(documentContent: string, expectedHash: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(documentContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return actualHash === expectedHash;
    } catch (error) {
      console.error('Failed to verify document hash:', error);
      return false;
    }
  }

  async sendPayment(toAddress: string, amount: number, note?: string): Promise<string | null> {
    if (Platform.OS === 'web' || !this.algodClient) {
      // Mock payment for web
      console.log(`Mock payment: ${amount} ALGO to ${toAddress}`);
      return `mock_payment_tx_${Date.now()}`;
    }

    try {
      // In a real implementation, you would:
      // 1. Get suggested transaction parameters
      // 2. Create a payment transaction
      // 3. Sign the transaction
      // 4. Submit to the network
      
      // For now, return mock transaction ID
      return `mock_payment_tx_${Date.now()}`;
    } catch (error) {
      console.error('Failed to send payment:', error);
      return null;
    }
  }

  async getTransactionInfo(txId: string): Promise<any> {
    if (Platform.OS === 'web' || !this.indexerClient || txId.startsWith('mock_')) {
      // Mock transaction info
      return {
        id: txId,
        confirmed: true,
        timestamp: Date.now(),
        type: 'payment'
      };
    }

    try {
      const txInfo = await this.indexerClient.lookupTransactionByID(txId).do();
      return txInfo.transaction;
    } catch (error) {
      console.error('Failed to get transaction info:', error);
      return null;
    }
  }
}

export const algorandService = new AlgorandService();