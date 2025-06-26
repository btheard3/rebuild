import { resourcesService } from '@/services/resourcesService';

export async function GET(request: Request) {
  try {
    // This endpoint is for development/testing only
    // In production, you would want to secure this endpoint
    
    const success = await resourcesService.seedMockData();
    
    if (success) {
      return Response.json({
        success: true,
        message: 'Resources database seeded successfully'
      });
    } else {
      return Response.json({
        success: false,
        message: 'Failed to seed resources database'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}