import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { useWizard } from './WizardContext';

type DisasterOption = {
  id: 'hurricane' | 'flood' | 'fire' | 'earthquake' | 'tornado' | 'other';
  title: string;
  image: string;
};

const disasters: DisasterOption[] = [
  {
    id: 'hurricane',
    title: 'Hurricane',
    image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
  },
  {
    id: 'flood',
    title: 'Flood',
    image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
  },
  {
    id: 'fire',
    title: 'Fire',
    image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg',
  },
  {
    id: 'earthquake',
    title: 'Earthquake',
    image: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg',
  },
  {
    id: 'tornado',
    title: 'Tornado',
    image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg',
  },
  {
    id: 'other',
    title: 'Other',
    image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg',
  },
];

export default function DisasterTypeStep() {
  const { colors } = useTheme();
  const { data, updateData } = useWizard();
  const { deviceType } = useResponsive();

  const getCardWidth = getResponsiveValue('48%', '32%', '30%');
  const cardWidth = getCardWidth(deviceType);

  const handleSelectDisaster = (disasterType: DisasterOption['id']) => {
    updateData({ disasterType });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>What type of disaster are you recovering from?</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        We'll customize your recovery plan based on your selection.
      </Text>
      
      <View style={[
        styles.optionsGrid,
        deviceType === 'desktop' ? styles.optionsGridDesktop : null
      ]}>
        {disasters.map((disaster) => (
          <TouchableOpacity
            key={disaster.id}
            style={[
              styles.disasterOption,
              { 
                borderColor: data.disasterType === disaster.id ? colors.primary : colors.border,
                borderWidth: data.disasterType === disaster.id ? 2 : 1,
                width: cardWidth,
              }
            ]}
            onPress={() => handleSelectDisaster(disaster.id)}
          >
            <Image source={{ uri: disaster.image }} style={styles.disasterImage} />
            <View style={[
              styles.disasterOverlay,
              { 
                backgroundColor: data.disasterType === disaster.id 
                  ? colors.primary + '60' 
                  : 'rgba(0,0,0,0.4)' 
              }
            ]} />
            <Text style={styles.disasterTitle}>{disaster.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionsGridDesktop: {
    justifyContent: 'flex-start',
  },
  disasterOption: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disasterImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  disasterOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  disasterTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    zIndex: 1,
  },
});