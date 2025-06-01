import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
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
    image: 'https://images.pexels.com/photos/753619/pexels-photo-753619.jpeg',
  },
  {
    id: 'flood',
    title: 'Flood',
    image: 'https://images.pexels.com/photos/1756932/pexels-photo-1756932.jpeg',
  },
  {
    id: 'fire',
    title: 'Fire',
    image: 'https://images.pexels.com/photos/51951/forest-fire-fire-smoke-conservation-51951.jpeg',
  },
  {
    id: 'earthquake',
    title: 'Earthquake',
    image: 'https://images.pexels.com/photos/5461212/pexels-photo-5461212.jpeg',
  },
  {
    id: 'tornado',
    title: 'Tornado',
    image: 'https://images.pexels.com/photos/1446076/pexels-photo-1446076.jpeg',
  },
  {
    id: 'other',
    title: 'Other',
    image: 'https://images.pexels.com/photos/6170463/pexels-photo-6170463.jpeg',
  },
];

export default function DisasterTypeStep() {
  const { colors } = useTheme();
  const { data, updateData } = useWizard();

  const handleSelectDisaster = (disasterType: DisasterOption['id']) => {
    updateData({ disasterType });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>What type of disaster are you recovering from?</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        We'll customize your recovery plan based on your selection.
      </Text>
      
      <View style={styles.optionsGrid}>
        {disasters.map((disaster) => (
          <TouchableOpacity
            key={disaster.id}
            style={[
              styles.disasterOption,
              { 
                borderColor: data.disasterType === disaster.id ? colors.primary : colors.border,
                borderWidth: data.disasterType === disaster.id ? 2 : 1,
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
  disasterOption: {
    width: '48%',
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