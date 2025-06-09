import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gap?: number;
  minItemWidth?: number;
}

export default function ResponsiveGrid({
  children,
  style,
  gap = 12,
  minItemWidth = 280,
}: ResponsiveGridProps) {
  const { width, deviceType } = useResponsive();

  const getItemsPerRow = () => {
    if (deviceType === 'mobile') return 1;
    const availableWidth = width - (gap * 2); // Account for container padding
    const itemsPerRow = Math.floor(availableWidth / (minItemWidth + gap));
    return Math.max(1, itemsPerRow);
  };

  const itemsPerRow = getItemsPerRow();
  const childrenArray = React.Children.toArray(children);

  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < childrenArray.length; i += itemsPerRow) {
      const rowItems = childrenArray.slice(i, i + itemsPerRow);
      rows.push(
        <View key={i} style={[styles.row, { gap }]}>
          {rowItems.map((child, index) => (
            <View
              key={index}
              style={[
                styles.item,
                {
                  flex: deviceType === 'mobile' ? 1 : 0,
                  minWidth: deviceType === 'mobile' ? undefined : minItemWidth,
                  maxWidth: deviceType === 'mobile' ? undefined : 
                    `${100 / itemsPerRow - (gap * (itemsPerRow - 1)) / itemsPerRow}%`,
                },
              ]}
            >
              {child}
            </View>
          ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={[styles.container, { gap }, style]}>
      {renderRows()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  item: {
    flexGrow: 1,
  },
});