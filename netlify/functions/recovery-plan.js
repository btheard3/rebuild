const { supabase } = require('../../services/supabaseClient');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { userId, planData } = body;

      if (!userId || !planData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      // Process and validate the recovery plan data
      const processedPlan = {
        user_id: userId,
        disaster_type: planData.disasterType,
        personal_info: planData.personalInfo,
        insurance_info: planData.insurance,
        immediate_needs: planData.immediateNeeds,
        status: 'active',
        created_at: new Date().toISOString(),
        priority_score: calculatePriorityScore(planData),
      };

      // Save to Supabase
      const { data, error } = await supabase
        .from('recovery_plans')
        .insert([processedPlan])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to save recovery plan' }),
        };
      }

      // Generate personalized recommendations
      const recommendations = generateRecommendations(planData);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          planId: data.id,
          recommendations,
          priorityScore: processedPlan.priority_score,
        }),
      };
    }

    if (event.httpMethod === 'GET') {
      const userId = event.queryStringParameters?.userId;

      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User ID required' }),
        };
      }

      const { data, error } = await supabase
        .from('recovery_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch recovery plans' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ plans: data }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function calculatePriorityScore(planData) {
  let score = 0;
  
  // Higher priority for certain disaster types
  const disasterWeights = {
    hurricane: 10,
    flood: 8,
    fire: 9,
    earthquake: 10,
    tornado: 9,
    other: 5,
  };
  
  score += disasterWeights[planData.disasterType] || 5;
  
  // Add points for immediate needs
  if (planData.immediateNeeds) {
    const needsCount = Object.values(planData.immediateNeeds).filter(Boolean).length;
    score += needsCount * 2;
  }
  
  // Family size factor
  if (planData.personalInfo?.familySize > 1) {
    score += planData.personalInfo.familySize;
  }
  
  // Insurance status
  if (!planData.insurance?.hasInsurance) {
    score += 5; // Higher priority for uninsured
  }
  
  return Math.min(score, 50); // Cap at 50
}

function generateRecommendations(planData) {
  const recommendations = [];
  
  // Disaster-specific recommendations
  switch (planData.disasterType) {
    case 'hurricane':
      recommendations.push('Contact FEMA for disaster assistance');
      recommendations.push('Document all property damage with photos');
      break;
    case 'fire':
      recommendations.push('Contact your insurance company immediately');
      recommendations.push('Keep receipts for temporary housing expenses');
      break;
    case 'flood':
      recommendations.push('Apply for SBA disaster loans');
      recommendations.push('Check for mold and water damage');
      break;
  }
  
  // Insurance-based recommendations
  if (!planData.insurance?.hasInsurance) {
    recommendations.push('Apply for FEMA Individual Assistance');
    recommendations.push('Look into local disaster relief programs');
  }
  
  // Needs-based recommendations
  if (planData.immediateNeeds?.shelter) {
    recommendations.push('Contact Red Cross for emergency shelter');
  }
  if (planData.immediateNeeds?.medical) {
    recommendations.push('Locate nearest mobile medical clinic');
  }
  
  return recommendations;
}