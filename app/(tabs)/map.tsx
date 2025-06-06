import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Phone, MapPin, Clock, Star, Filter, Compass } from 'lucide-react-native';
import BoltBadge from '@/components/BoltBadge';

type ResourceLocation = {
  id: string;
  name: string;
  type: 'shelter' | 'medical' | 'food' | 'supplies' | 'other';
  address: string;
  distance: string;
  status: 'open' | 'closed';
  hours: string;
  phone: string;
  rating: number;
  image: string;
};

export default function MapScreen() {
  const { colors } = useTheme();
  const { deviceType } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ResourceLocation['type']>('all');

  const getPadding = getResponsiveValue(16, 24, 32);
  const getMapHeight = getResponsiveValue(200, 250, 300);
  const getCardWidth = getResponsiveValue('100%', '48%', '32%');
  
  const padding = getPadding(deviceType);
  const mapHeight = getMapHeight(deviceType);
  const cardWidth = getCardWidth(deviceType);

  const resourceTypes = [
    { id: 'all', label: 'All', icon: Compass },
    { id: 'shelter', label: 'Shelters', icon: MapPin },
    { id: 'medical', label: 'Medical', icon: MapPin },
    { id: 'food', label: 'Food', icon: MapPin },
    { id: 'supplies', label: 'Supplies', icon: MapPin },
    { id: 'other', label: 'Other', icon: MapPin },
  ];

  // Updated with more inclusive images
  const resources: ResourceLocation[] = [
    {
      id: '1',
      name: 'Community Relief Center',
      type: 'shelter',
      address: '1234 Main St, Anytown, USA',
      distance: '0.7 mi',
      status: 'open',
      hours: '24 hours',
      phone: '(555) 123-4567',
      rating: 4.5,
      image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
    },
    {
      id: '2',
      name: 'First Aid Station',
      type: 'medical',
      address: '789 Oak Ave, Anytown, USA',
      distance: '1.2 mi',
      status: 'open',
      hours: '8am - 8pm',
      phone: '(555) 987-6543',
      rating: 4.2,
      image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
    },
    {
      id: '3',
      name: 'Food Distribution Center',
      type: 'food',
      address: '456 Elm St, Anytown, USA',
      distance: '1.5 mi',
      status: 'open',
      hours: '9am - 5pm',
      phone: '(555) 333-2222',
      rating: 4.0,
      image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
    },
    {
      id: '4',
      name: 'Supply Depot',
      type: 'supplies',
      address: '321 Pine St, Anytown, USA',
      distance: '2.3 mi',
      status: 'closed',
      hours: '10am - 6pm',
      phone: '(555) 444-5555',
      rating: 3.8,
      image: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
    },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          resource.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    return matchesSearch && matchesType;
  });

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={16} 
            color={star <= Math.round(rating) ? colors.warning : colors.disabled} 
            fill={star <= Math.round(rating) ? colors.warning : 'transparent'}
          />
        ))}
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const renderResourceItem = (resource: ResourceLocation) => (
    <TouchableOpacity
      key={resource.id}
      style={[
        styles.resourceCard,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          width: cardWidth,
          marginBottom: deviceType === 'mobile' ? 12 : 16,
        }
      ]}
      onPress={() => console.log(`View details for ${resource.name}`)}
    >
      <Image source={{ uri: resource.image }} style={styles.resourceImage} />
      <View style={styles.resourceContent}>
        <View style={styles.resourceHeader}>
          <Text style={[styles.resourceName, { color: colors.text }]}>{resource.name}</Text>
          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: resource.status === 'open' 
                ? colors.success + '20' 
                : colors.error + '20' 
            }
          ]}>
            <Text style={[
              styles.statusText, 
              { 
                color: resource.status === 'open' 
                  ? colors.success 
                  : colors.error 
              }
            ]}>
              {resource.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.resourceDetails}>
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {resource.address} ({resource.distance})
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {resource.hours}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {resource.phone}
            </Text>
          </View>
        </View>

        {renderStars(resource.rating)}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.mapPlaceholder, { height: mapHeight }]}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg' }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <View style={styles.mapOverlay}>
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>(Placeholder for actual map implementation)</Text>
        </View>
      </View>

      <View style={[styles.contentContainer, { paddingHorizontal: padding }]}>
        <View style={styles.header}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for resources nearby..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => console.log('Filter pressed')}
          >
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.resourceTypesContainer}
          contentContainerStyle={styles.resourceTypesList}
        >
          {resourceTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.resourceTypeChip,
                { 
                  backgroundColor: selectedType === type.id ? colors.primary : colors.surface,
                  borderColor: selectedType === type.id ? colors.primary : colors.border,
                }
              ]}
              onPress={() => setSelectedType(type.id as any)}
            >
              <type.icon 
                size={16} 
                color={selectedType === type.id ? 'white' : colors.text} 
              />
              <Text
                style={[
                  styles.resourceTypeText,
                  { color: selectedType === type.id ? 'white' : colors.text }
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <Text style={[styles.resultsText, { color: colors.text }]}>
          {filteredResources.length} {filteredResources.length === 1 ? 'result' : 'results'} found
        </Text>
        
        <ScrollView style={styles.resultsContainer}>
          <View style={[
            styles.resultsGrid,
            deviceType !== 'mobile' ? styles.gridContainer : null
          ]}>
            {filteredResources.map(renderResourceItem)}
          </View>
        </ScrollView>
      </View>
      <BoltBadge />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    width: '100%',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  mapSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  resourceTypesContainer: {
    marginBottom: 16,
  },
  resourceTypesList: {
    paddingRight: 8,
  },
  resourceTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  resourceTypeText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  resultsText: {
    fontSize: 14,
    marginBottom: 12,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsGrid: {
    gap: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resourceCard: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  resourceImage: {
    width: 100,
    height: '100%',
  },
  resourceContent: {
    flex: 1,
    padding: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resourceName: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
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
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
});