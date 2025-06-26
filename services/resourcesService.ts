import { supabase } from './supabaseClient';
import { analyticsService } from './analyticsService';

export type ResourceCategory = 'emergency' | 'financial' | 'housing' | 'medical' | 'legal' | 'mental-health' | 'food' | 'utilities';

export interface Resource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  type: 'hotline' | 'website' | 'location' | 'program';
  contact?: {
    phone?: string;
    website?: string;
    address?: string;
  };
  hours?: string;
  rating: number;
  isFavorite: boolean;
  image: string;
  tags: string[];
  eligibility?: string;
  languages?: string[];
  verified?: boolean;
  distance?: string;
}

class ResourcesService {
  private mockResources: Resource[] = [
    {
      id: '1',
      name: 'FEMA Disaster Relief',
      description: 'Federal assistance for disaster survivors including temporary housing, home repairs, and other disaster-related expenses.',
      category: 'emergency',
      type: 'program',
      contact: {
        phone: '1-800-621-3362',
        website: 'https://www.fema.gov',
      },
      hours: '24/7',
      rating: 4.2,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      tags: ['federal', 'housing', 'repairs', 'financial'],
      eligibility: 'Disaster survivors in declared disaster areas',
      languages: ['English', 'Spanish', 'ASL'],
    },
    {
      id: '2',
      name: 'Red Cross Emergency Shelter',
      description: 'Immediate shelter, food, and emergency supplies for disaster victims and their families.',
      category: 'emergency',
      type: 'location',
      contact: {
        phone: '1-800-733-2767',
        website: 'https://www.redcross.org',
        address: '1234 Relief Center Dr, Community City',
      },
      hours: '24/7',
      rating: 4.8,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      tags: ['shelter', 'food', 'supplies', 'immediate'],
      eligibility: 'All disaster victims',
      languages: ['English', 'Spanish', 'French'],
    },
    {
      id: '3',
      name: 'Disaster Financial Assistance',
      description: 'Low-interest loans and grants for disaster recovery, home repairs, and business restoration.',
      category: 'financial',
      type: 'program',
      contact: {
        phone: '1-800-659-2955',
        website: 'https://www.sba.gov/disaster',
      },
      hours: 'Mon-Fri 8am-8pm EST',
      rating: 4.0,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      tags: ['loans', 'grants', 'business', 'recovery'],
      eligibility: 'Property owners and renters in disaster areas',
      languages: ['English', 'Spanish'],
    },
    {
      id: '4',
      name: 'Community Housing Solutions',
      description: 'Temporary and transitional housing assistance for families displaced by disasters.',
      category: 'housing',
      type: 'program',
      contact: {
        phone: '(555) 123-4567',
        website: 'https://communityhousing.org',
        address: '789 Housing Ave, Safe Harbor',
      },
      hours: 'Mon-Fri 9am-5pm',
      rating: 4.5,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
      tags: ['temporary', 'transitional', 'families', 'displacement'],
      eligibility: 'Families with children, elderly, disabled',
      languages: ['English', 'Spanish', 'Mandarin'],
    },
    {
      id: '5',
      name: 'Crisis Mental Health Hotline',
      description: '24/7 mental health support for disaster survivors experiencing trauma, anxiety, or depression.',
      category: 'mental-health',
      type: 'hotline',
      contact: {
        phone: '988',
        website: 'https://988lifeline.org',
      },
      hours: '24/7',
      rating: 4.7,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      tags: ['crisis', 'trauma', 'anxiety', 'depression', 'counseling'],
      eligibility: 'Anyone in crisis',
      languages: ['English', 'Spanish', '150+ languages via interpreter'],
    },
    {
      id: '6',
      name: 'Mobile Medical Clinic',
      description: 'Free medical care, prescription assistance, and health screenings for disaster survivors.',
      category: 'medical',
      type: 'location',
      contact: {
        phone: '(555) 987-6543',
        address: 'Various locations - call for schedule',
      },
      hours: 'Mon-Sat 8am-6pm',
      rating: 4.3,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      tags: ['mobile', 'free', 'prescriptions', 'screenings'],
      eligibility: 'Uninsured and underinsured individuals',
      languages: ['English', 'Spanish', 'Creole'],
    },
    {
      id: '7',
      name: 'Legal Aid Society',
      description: 'Free legal assistance for disaster-related issues including insurance claims, FEMA appeals, and housing rights.',
      category: 'legal',
      type: 'program',
      contact: {
        phone: '(555) 456-7890',
        website: 'https://legalaid.org',
        address: '456 Justice Blvd, Legal District',
      },
      hours: 'Mon-Fri 9am-5pm',
      rating: 4.1,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
      tags: ['insurance', 'FEMA', 'appeals', 'housing', 'rights'],
      eligibility: 'Low-income disaster survivors',
      languages: ['English', 'Spanish', 'ASL'],
    },
    {
      id: '8',
      name: 'Community Food Bank',
      description: 'Emergency food assistance, hot meals, and nutrition programs for disaster-affected families.',
      category: 'food',
      type: 'location',
      contact: {
        phone: '(555) 234-5678',
        address: '321 Nutrition St, Food District',
      },
      hours: 'Mon-Fri 10am-4pm, Sat 9am-2pm',
      rating: 4.6,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      tags: ['emergency', 'hot meals', 'nutrition', 'families'],
      eligibility: 'Anyone in need',
      languages: ['English', 'Spanish', 'Vietnamese'],
    },
    {
      id: '9',
      name: 'Utility Assistance Program',
      description: 'Help with electricity, gas, water, and internet bills for disaster survivors facing financial hardship.',
      category: 'utilities',
      type: 'program',
      contact: {
        phone: '(555) 345-6789',
        website: 'https://utilityhelp.org',
      },
      hours: 'Mon-Fri 8am-6pm',
      rating: 3.9,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      tags: ['electricity', 'gas', 'water', 'internet', 'bills'],
      eligibility: 'Low to moderate income households',
      languages: ['English', 'Spanish'],
    },
    {
      id: '10',
      name: 'Disaster Unemployment Assistance',
      description: 'Financial support for workers who lost their jobs due to a disaster and don\'t qualify for regular unemployment benefits.',
      category: 'financial',
      type: 'program',
      contact: {
        phone: '(555) 789-0123',
        website: 'https://disasterunemployment.gov',
      },
      hours: 'Mon-Fri 8am-5pm',
      rating: 4.2,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/3760529/pexels-photo-3760529.jpeg',
      tags: ['unemployment', 'benefits', 'financial', 'jobs'],
      eligibility: 'Workers who lost employment due to disaster',
      languages: ['English', 'Spanish', 'Chinese'],
    },
    {
      id: '11',
      name: 'Disaster Case Management',
      description: 'Personalized recovery planning and resource coordination for complex disaster recovery situations.',
      category: 'housing',
      type: 'program',
      contact: {
        phone: '(555) 456-7890',
        website: 'https://disastercasemanagement.org',
        address: '789 Recovery Blvd, Hope City',
      },
      hours: 'Mon-Fri 9am-6pm',
      rating: 4.7,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg',
      tags: ['case management', 'coordination', 'planning', 'long-term'],
      eligibility: 'Disaster survivors with complex recovery needs',
      languages: ['English', 'Spanish', 'French', 'Haitian Creole'],
    },
    {
      id: '12',
      name: 'Crisis Counseling Program',
      description: 'Free, confidential counseling services to help people recover from the psychological effects of disasters.',
      category: 'mental-health',
      type: 'program',
      contact: {
        phone: '(555) 321-6547',
        website: 'https://crisiscounseling.org',
      },
      hours: 'Mon-Sun 8am-8pm',
      rating: 4.8,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg',
      tags: ['counseling', 'therapy', 'trauma', 'stress', 'anxiety'],
      eligibility: 'Anyone affected by disaster',
      languages: ['English', 'Spanish', 'ASL', 'Multiple languages via interpreter'],
    },
    {
      id: '13',
      name: 'Disaster Legal Services',
      description: 'Pro bono legal assistance for low-income disaster survivors with legal issues arising from the disaster.',
      category: 'legal',
      type: 'program',
      contact: {
        phone: '(555) 123-4567',
        website: 'https://disasterlegalservices.org',
      },
      hours: 'Mon-Fri 9am-5pm',
      rating: 4.4,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/5668859/pexels-photo-5668859.jpeg',
      tags: ['legal', 'pro bono', 'insurance', 'FEMA appeals', 'landlord-tenant'],
      eligibility: 'Low-income disaster survivors',
      languages: ['English', 'Spanish', 'Multiple languages via interpreter'],
    },
    {
      id: '14',
      name: 'Disaster Supplemental Nutrition Assistance',
      description: 'Emergency food benefits for households affected by a disaster that are not normally eligible for SNAP.',
      category: 'food',
      type: 'program',
      contact: {
        phone: '(555) 789-0123',
        website: 'https://d-snap.gov',
      },
      hours: 'Mon-Fri 8am-5pm',
      rating: 4.3,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/6994982/pexels-photo-6994982.jpeg',
      tags: ['food assistance', 'benefits', 'nutrition', 'emergency food'],
      eligibility: 'Disaster-affected households with limited income and resources',
      languages: ['English', 'Spanish', 'Chinese', 'Vietnamese'],
    },
    {
      id: '15',
      name: 'Disaster Recovery Center',
      description: 'One-stop shop for disaster assistance where survivors can speak directly with representatives from multiple agencies.',
      category: 'emergency',
      type: 'location',
      contact: {
        phone: '(555) 456-7890',
        address: '123 Recovery Way, Resilience City',
      },
      hours: 'Mon-Sat 9am-7pm, Sun 12pm-5pm',
      rating: 4.6,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      tags: ['multi-agency', 'in-person', 'assistance', 'information'],
      eligibility: 'All disaster survivors',
      languages: ['English', 'Spanish', 'Multiple languages via interpreter'],
    },
    {
      id: '16',
      name: 'Disaster Distress Helpline',
      description: '24/7 crisis counseling and emotional support for anyone experiencing distress related to disasters.',
      category: 'mental-health',
      type: 'hotline',
      contact: {
        phone: '1-800-985-5990',
        website: 'https://disasterdistress.samhsa.gov',
      },
      hours: '24/7',
      rating: 4.9,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/7176319/pexels-photo-7176319.jpeg',
      tags: ['crisis', 'counseling', 'emotional support', 'distress', 'trauma'],
      eligibility: 'Anyone experiencing emotional distress related to disasters',
      languages: ['English', 'Spanish', 'Multiple languages via interpreter'],
    },
    {
      id: '17',
      name: 'Disaster Debris Removal',
      description: 'Assistance with clearing and removing debris from homes and properties after a disaster.',
      category: 'housing',
      type: 'program',
      contact: {
        phone: '(555) 234-5678',
        website: 'https://debrisremoval.org',
      },
      hours: 'Mon-Fri 7am-4pm',
      rating: 4.1,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg',
      tags: ['debris', 'cleanup', 'property', 'removal'],
      eligibility: 'Property owners in disaster-affected areas',
      languages: ['English', 'Spanish'],
    },
    {
      id: '18',
      name: 'Disaster Tax Relief',
      description: 'Tax assistance and relief options for individuals and businesses affected by federally declared disasters.',
      category: 'financial',
      type: 'program',
      contact: {
        phone: '(555) 789-0123',
        website: 'https://irs.gov/disaster',
      },
      hours: 'Mon-Fri 8am-5pm',
      rating: 4.0,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg',
      tags: ['tax relief', 'financial', 'IRS', 'deadline extensions'],
      eligibility: 'Individuals and businesses in federally declared disaster areas',
      languages: ['English', 'Spanish'],
    },
    {
      id: '19',
      name: 'Disaster Medicaid',
      description: 'Temporary medical coverage for individuals who don\'t normally qualify for Medicaid but have medical needs due to a disaster.',
      category: 'medical',
      type: 'program',
      contact: {
        phone: '(555) 321-6547',
        website: 'https://disastermedicaid.gov',
      },
      hours: 'Mon-Fri 8am-6pm',
      rating: 4.5,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
      tags: ['medical', 'healthcare', 'coverage', 'temporary'],
      eligibility: 'Disaster survivors with limited income and resources',
      languages: ['English', 'Spanish', 'Chinese', 'Korean'],
    },
    {
      id: '20',
      name: 'Disaster Mortgage Assistance',
      description: 'Mortgage forbearance and loan modification options for homeowners affected by disasters.',
      category: 'housing',
      type: 'program',
      contact: {
        phone: '(555) 456-7890',
        website: 'https://disastermortgagehelp.gov',
      },
      hours: 'Mon-Fri 9am-5pm',
      rating: 4.2,
      isFavorite: false,
      image: 'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg',
      tags: ['mortgage', 'forbearance', 'loan modification', 'foreclosure prevention'],
      eligibility: 'Homeowners with federally backed mortgages in disaster areas',
      languages: ['English', 'Spanish'],
    }
  ];

  private favorites: Set<string> = new Set();

  async getResources(category?: ResourceCategory, searchQuery?: string): Promise<Resource[]> {
    try {
      // First try to get resources from Supabase
      if (supabase) {
        let query = supabase.from('local_resources').select('*');
        
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }
        
        const { data, error } = await query.order('rating', { ascending: false });
        
        if (!error && data && data.length > 0) {
          // Transform Supabase data to match Resource interface
          return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            category: item.category as ResourceCategory,
            type: item.type || 'program',
            contact: item.contact_info || {},
            hours: item.availability?.hours || '',
            rating: item.rating || 0,
            isFavorite: this.favorites.has(item.id),
            image: item.image_url || this.getDefaultImageForCategory(item.category),
            tags: item.tags || [],
            eligibility: item.eligibility || '',
            languages: item.languages || ['English'],
            verified: item.verified || false
          }));
        }
      }
      
      // Fall back to mock data if Supabase query fails or returns no results
      analyticsService.trackEvent('using_mock_resources_data', {
        reason: 'supabase_unavailable_or_empty'
      });
      
      let filteredResources = [...this.mockResources];
      
      if (category && category !== 'all') {
        filteredResources = filteredResources.filter(resource => resource.category === category);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredResources = filteredResources.filter(resource => 
          resource.name.toLowerCase().includes(query) || 
          resource.description.toLowerCase().includes(query) ||
          resource.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // Update favorite status
      return filteredResources.map(resource => ({
        ...resource,
        isFavorite: this.favorites.has(resource.id)
      }));
    } catch (error) {
      console.error('Error fetching resources:', error);
      analyticsService.trackError('resources_fetch_failed', 'ResourcesService', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return mock data as fallback
      return this.mockResources;
    }
  }

  async getNearbyResources(latitude: number, longitude: number, radiusKm: number = 10): Promise<Resource[]> {
    try {
      // In a real implementation, this would query Supabase with geospatial functions
      // For now, we'll return mock data with simulated distances
      
      const mockNearbyResources = this.mockResources.map(resource => ({
        ...resource,
        distance: `${(Math.random() * radiusKm).toFixed(1)} km`
      }));
      
      // Sort by simulated distance
      return mockNearbyResources.sort((a, b) => {
        const distA = parseFloat(a.distance || '0');
        const distB = parseFloat(b.distance || '0');
        return distA - distB;
      });
    } catch (error) {
      console.error('Error fetching nearby resources:', error);
      analyticsService.trackError('nearby_resources_fetch_failed', 'ResourcesService', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return [];
    }
  }

  async toggleFavorite(resourceId: string, userId?: string): Promise<boolean> {
    try {
      if (this.favorites.has(resourceId)) {
        this.favorites.delete(resourceId);
        
        // If user is logged in, remove from Supabase
        if (userId && supabase) {
          await supabase
            .from('user_favorites')
            .delete()
            .eq('user_id', userId)
            .eq('resource_id', resourceId);
        }
        
        analyticsService.trackEvent('resource_unfavorited', {
          resource_id: resourceId,
          user_id: userId || 'anonymous'
        });
      } else {
        this.favorites.add(resourceId);
        
        // If user is logged in, add to Supabase
        if (userId && supabase) {
          await supabase
            .from('user_favorites')
            .insert([{
              user_id: userId,
              resource_id: resourceId
            }]);
        }
        
        analyticsService.trackEvent('resource_favorited', {
          resource_id: resourceId,
          user_id: userId || 'anonymous'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      analyticsService.trackError('favorite_toggle_failed', 'ResourcesService', {
        error: error instanceof Error ? error.message : 'Unknown error',
        resource_id: resourceId
      });
      
      return false;
    }
  }

  async getFavorites(userId?: string): Promise<Resource[]> {
    try {
      if (userId && supabase) {
        // Get favorites from Supabase
        const { data, error } = await supabase
          .from('user_favorites')
          .select('resource_id')
          .eq('user_id', userId);
          
        if (!error && data) {
          // Update local favorites set
          this.favorites = new Set(data.map(item => item.resource_id));
          
          // Get full resource details for favorites
          const favoriteResources = await Promise.all(
            data.map(async (item) => {
              const { data: resourceData } = await supabase
                .from('local_resources')
                .select('*')
                .eq('id', item.resource_id)
                .single();
                
              if (resourceData) {
                return {
                  id: resourceData.id,
                  name: resourceData.name,
                  description: resourceData.description || '',
                  category: resourceData.category as ResourceCategory,
                  type: resourceData.type || 'program',
                  contact: resourceData.contact_info || {},
                  hours: resourceData.availability?.hours || '',
                  rating: resourceData.rating || 0,
                  isFavorite: true,
                  image: resourceData.image_url || this.getDefaultImageForCategory(resourceData.category),
                  tags: resourceData.tags || [],
                  eligibility: resourceData.eligibility || '',
                  languages: resourceData.languages || ['English'],
                  verified: resourceData.verified || false
                };
              }
              return null;
            })
          );
          
          return favoriteResources.filter(Boolean) as Resource[];
        }
      }
      
      // Fall back to local favorites
      return this.mockResources.filter(resource => this.favorites.has(resource.id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      analyticsService.trackError('favorites_fetch_failed', 'ResourcesService', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return [];
    }
  }

  private getDefaultImageForCategory(category: string): string {
    const categoryImages: Record<string, string> = {
      emergency: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
      financial: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
      housing: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
      medical: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
      legal: 'https://images.pexels.com/photos/5668859/pexels-photo-5668859.jpeg',
      'mental-health': 'https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg',
      food: 'https://images.pexels.com/photos/6994982/pexels-photo-6994982.jpeg',
      utilities: 'https://images.pexels.com/photos/3760529/pexels-photo-3760529.jpeg'
    };
    
    return categoryImages[category] || 'https://images.pexels.com/photos/3807316/pexels-photo-3807316.jpeg';
  }

  // Method to seed the database with mock data (for development/testing)
  async seedMockData(): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      // Check if data already exists
      const { count, error: countError } = await supabase
        .from('local_resources')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Error checking resource count:', countError);
        return false;
      }
      
      // Only seed if table is empty
      if (count === 0) {
        const resourcesData = this.mockResources.map(resource => ({
          name: resource.name,
          description: resource.description,
          category: resource.category,
          type: resource.type,
          contact_info: resource.contact,
          availability: { hours: resource.hours },
          rating: resource.rating,
          image_url: resource.image,
          tags: resource.tags,
          eligibility: resource.eligibility,
          languages: resource.languages,
          verified: Math.random() > 0.5 // Randomly verify some resources
        }));
        
        const { error } = await supabase
          .from('local_resources')
          .insert(resourcesData);
          
        if (error) {
          console.error('Error seeding resources:', error);
          return false;
        }
        
        console.log('✅ Successfully seeded resources table');
        return true;
      }
      
      console.log('Resources table already contains data, skipping seed');
      return true;
    } catch (error) {
      console.error('Error seeding mock data:', error);
      return false;
    }
  }
}

export const resourcesService = new ResourcesService();