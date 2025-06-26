import { identityVaultService } from '@/services/identityVaultService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, storedHash, userId } = body;

    if (!data || !storedHash) {
      return Response.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verify data integrity against stored hash
    const isValid = await identityVaultService.verifyDataIntegrity(data, storedHash, userId);
    
    return Response.json({
      success: true,
      verified: isValid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Blockchain verification error:', error);
    return Response.json({ 
      success: false, 
      message: 'Verification failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get('txId');
    
    if (!transactionId) {
      return Response.json({ 
        success: false, 
        message: 'Transaction ID is required' 
      }, { status: 400 });
    }
    
    // Get transaction details from blockchain
    const transactionDetails = await identityVaultService.getTransactionDetails(transactionId);
    
    return Response.json({
      success: true,
      transaction: transactionDetails,
      explorerUrl: identityVaultService.getAlgoExplorerUrl(transactionId)
    });
  } catch (error) {
    console.error('Transaction lookup error:', error);
    return Response.json({ 
      success: false, 
      message: 'Failed to retrieve transaction details', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}