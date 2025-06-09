import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeButton from '@/components/HomeButton';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import ResponsiveGrid from '@/components/ResponsiveGrid';
import { Search, Filter, Plus, MapPin, Clock, Phone, ExternalLink, Star, Heart } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

type ResourceCategory = 'all' | 'emergency' | 'financial' | 'housing' | 'medical' | 'legal' | 'mental-health' | 'food' | 'utilities';

type Resource = {
  id: string;
  title: string;
  description: string;
  category: Exclude<ResourceCategory, 'all'>;
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
};

export default function CasesScreen() {
  const { colors } = useTheme();
  const { deviceType, padding } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const categories = [
    { id: 'all', label: 'All Resources', icon: '🏠' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
    { id: 'financial', label: 'Financial Aid', icon: '💰' },
    { id: 'housing', label: 'Housing', icon: '🏘️' },
    { id: 'medical', label: 'Medical', icon: '🏥' },
    { id: 'legal', label: 'Legal Aid', icon: '⚖️' },
    { id: 'mental-health', label: 'Mental Health', icon: '🧠' },
    { id: 'food', label: 'Food Assistance', icon: '🍽️' },
    { id: 'utilities', label: 'Utilities', icon: '⚡' },
  ];

  const resources: Resource[] = [
    {
      id: '1',
      title: 'FEMA Disaster Relief',
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
      title: 'Red Cross Emergency Shelter',
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
      title: 'Disaster Financial Assistance',
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
      title: 'Community Housing Solutions',
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
      title: 'Crisis Mental Health Hotline',
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
      title: 'Mobile Medical Clinic',
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
      title: 'Legal Aid Society',
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
      title: 'Community Food Bank',
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
      title: 'Utility Assistance Program',
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
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (resourceId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(resourceId)) {
      newFavorites.delete(resourceId);
    } else {
      newFavorites.add(resourceId);
    }
    setFavorites(newFavorites);
  };

  const handleContact = (resource: Resource, type: 'phone' | 'website') => {
    if (type === 'phone' && resource.contact?.phone) {
      Alert.alert(
        'Call Resource',
        `Would you like to call ${resource.title}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => console.log(`Calling ${resource.contact?.phone}`) },
        ]
      );
    } else if (type === 'website' && resource.contact?.website) {
      console.log(`Opening ${resource.contact.website}`);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={14} 
            color={star <= Math.round(rating) ? colors.warning : colors.disabled} 
            fill={star <= Math.round(rating) ? colors.warning : 'transparent'}
          />
        ))}
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const renderCategoryChip = (category: typeof categories[0]) => {
    const isSelected = category.id === selectedCategory;
    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryChip,
          { 
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
            paddingHorizontal: deviceType === 'mobile' ? 12 : 16,
            paddingVertical: deviceType === 'mobile' ? 8 : 10,
          }
        ]}
        onPress={() => setSelectedCategory(category.id as ResourceCategory)}
      >
        <Text style={styles.categoryEmoji}>{category.icon}</Text>
        <Text
          style={[
            styles.categoryChipText,
            { 
              color: isSelected ? 'white' : colors.text,
              fontSize: deviceType === 'mobile' ? 14 : 15,
            }
          ]}
        >
          {category.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderResourceCard = (resource: Resource) => (
    <View
      key={resource.id}
      style={[
        styles.resourceCard,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: deviceType === 'mobile' ? 12 : 16,
        }
      ]}
    >
      <Image source={{ uri: resource.image }} style={styles.resourceImage} />
      
      <View style={styles.resourceContent}>
        <View style={styles.resourceHeader}>
          <View style={styles.resourceTitleContainer}>
            <Text style={[
              styles.resourceTitle, 
              { 
                color: colors.text,
                fontSize: deviceType === 'mobile' ? 16 : 18,
              }
            ]} numberOfLines={2}>
              {resource.title}
            </Text>
            <TouchableOpacity
              onPress={() => toggleFavorite(resource.id)}
              style={styles.favoriteButton}
            >
              <Heart 
                size={20} 
                color={favorites.has(resource.id) ? colors.error : colors.textSecondary}
                fill={favorites.has(resource.id) ? colors.error : 'transparent'}
              />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.typeTag, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.typeTagText, { color: colors.primary }]}>
              {resource.type.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[
          styles.resourceDescription, 
          { 
            color: colors.textSecondary,
            fontSize: deviceType === 'mobile' ? 14 : 15,
          }
        ]} numberOfLines={3}>
          {resource.description}
        </Text>

        <View style={styles.resourceDetails}>
          {resource.contact?.address && (
            <View style={styles.detailRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                {resource.contact.address}
              </Text>
            </View>
          )}
          
          {resource.hours && (
            <View style={styles.detailRow}>
              <Clock size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {resource.hours}
              </Text>
            </View>
          )}

          {resource.eligibility && (
            <View style={styles.detailRow}>
              <Text style={[styles.eligibilityLabel, { color: colors.primary }]}>Eligibility: </Text>
              <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={2}>
                {resource.eligibility}
              </Text>
            </View>
          )}
        </View>

        {renderStars(resource.rating)}

        <View style={styles.actionButtons}>
          {resource.contact?.phone && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => handleContact(resource, 'phone')}
            >
              <Phone size={16} color="white" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          
          {resource.contact?.website && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => handleContact(resource, 'website')}
            >
              <ExternalLink size={16} color="white" />
              <Text style={styles.actionButtonText}>Visit</Text>
            </TouchableOpacity>
          )}
        </View>

        {resource.languages && resource.languages.length > 0 && (
          <View style={styles.languagesContainer}>
            <Text style={[styles.languagesLabel, { color: colors.textSecondary }]}>Languages: </Text>
            <Text style={[styles.languagesText, { color: colors.textSecondary }]} numberOfLines={1}>
              {resource.languages.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeButton />
      <ResponsiveContainer>
        <View style={[styles.content, { marginTop: deviceType === 'mobile' ? 70 : 80 }]}>
          <View style={styles.header}>
            <Text style={[
              styles.headerTitle, 
              { 
                color: colors.text,
                fontSize: deviceType === 'mobile' ? 24 : 28,
              }
            ]}>
              Recovery Resources
            </Text>
            <Text style={[
              styles.headerSubtitle, 
              { 
                color: colors.textSecondary,
                fontSize: deviceType === 'mobile' ? 16 : 18,
              }
            ]}>
              Find help and support services in your area
            </Text>
          </View>

          <View style={styles.searchSection}>
            <View style={[
              styles.searchContainer, 
              { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                height: deviceType === 'mobile' ? 44 : 48,
              }
            ]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[
                  styles.searchInput, 
                  { 
                    color: colors.text,
                    fontSize: deviceType === 'mobile' ? 16 : 17,
                  }
                ]}
                placeholder="Search resources, services, or keywords..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                  width: deviceType === 'mobile' ? 44 : 48,
                  height: deviceType === 'mobile' ? 44 : 48,
                }
              ]}
              onPress={() => console.log('Filter pressed')}
            >
              <Filter size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesList}
          >
            {categories.map(renderCategoryChip)}
          </ScrollView>
          
          <View style={styles.resultsHeader}>
            <Text style={[
              styles.resultsText, 
              { 
                color: colors.text,
                fontSize: deviceType === 'mobile' ? 14 : 15,
              }
            ]}>
              {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'} found
            </Text>
            {favorites.size > 0 && (
              <Text style={[
                styles.favoritesText, 
                { 
                  color: colors.primary,
                  fontSize: deviceType === 'mobile' ? 14 : 15,
                }
              ]}>
                {favorites.size} saved
              </Text>
            )}
          </View>
          
          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            <ResponsiveGrid minItemWidth={320} gap={deviceType === 'mobile' ? 12 : 16}>
              {filteredResources.map(renderResourceCard)}
            </ResponsiveGrid>
          </ScrollView>
        </View>
      </ResponsiveContainer>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    // fontSize handled in component
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
  },
  filterButton: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontWeight: '500',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsText: {
    fontWeight: '500',
  },
  favoritesText: {
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  resourceCard: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  resourceImage: {
    width: '100%',
    height: 120,
  },
  resourceContent: {
    // padding handled in component
  },
  resourceHeader: {
    marginBottom: 8,
  },
  resourceTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  resourceTitle: {
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  resourceDescription: {
    lineHeight: 20,
    marginBottom: 12,
  },
  resourceDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  eligibilityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languagesLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  languagesText: {
    fontSize: 11,
    flex: 1,
  },
});