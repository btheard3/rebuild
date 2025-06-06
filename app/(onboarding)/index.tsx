import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive, getResponsiveValue } from '@/hooks/useResponsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import BoltBadge from '@/components/BoltBadge';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Rebuild',
    description: 'Your comprehensive disaster recovery assistant to help you through difficult times.',
    image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg'
  },
  {
    id: '2',
    title: 'Crisis Recovery',
    description: 'Step-by-step guidance to navigate through disaster recovery and access essential resources.',
    image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg'
  },
  {
    id: '3',
    title: 'Secure Document Storage',
    description: 'Keep your important documents safe and accessible when you need them most.',
    image: 'https://images.pexels.com/photos/5699398/pexels-photo-5699398.jpeg'
  },
  {
    id: '4',
    title: 'Mental Wellbeing',
    description: 'Tools to support your mental health during challenging recovery periods.',
    image: 'https://images.pexels.com/photos/5699479/pexels-photo-5699479.jpeg'
  }
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { deviceType, width: screenWidth } = useResponsive();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const getImageSize = getResponsiveValue(
    screenWidth * 0.8,
    screenWidth * 0.6,
    screenWidth * 0.4
  );
  
  const getTitleSize = getResponsiveValue(24, 28, 32);
  const getDescriptionSize = getResponsiveValue(16, 18, 20);
  const getPaddingHorizontal = getResponsiveValue(20, 40, 60);
  
  const imageSize = getImageSize(deviceType);
  const titleSize = getTitleSize(deviceType);
  const descriptionSize = getDescriptionSize(deviceType);
  const paddingHorizontal = getPaddingHorizontal(deviceType);
  
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(index);
  };

  const handleSkip = () => {
    router.replace('/(auth)');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      }
    } else {
      router.replace('/(auth)');
    }
  };

  const flatListRef = useRef<any>(null);

  const renderItem = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={[styles.slide, { width: screenWidth, backgroundColor: colors.background }]}>
        <Image 
          source={{ uri: item.image }} 
          style={[styles.image, { width: imageSize, height: imageSize }]}
          resizeMode="cover"
        />
        <View style={[styles.textContainer, { paddingHorizontal }]}>
          <Text style={[styles.title, { color: colors.text, fontSize: titleSize }]}>{item.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary, fontSize: descriptionSize }]}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={[styles.paginationContainer, { paddingHorizontal }]}>
        <View style={styles.paginationDots}>
          {slides.map((_, index) => {
            const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity, backgroundColor: colors.primary },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipButton, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      />
      {renderPagination()}
      <BoltBadge position="bottom-left" size={deviceType === 'mobile' ? 'small' : 'medium'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 20,
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});