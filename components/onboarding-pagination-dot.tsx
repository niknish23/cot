import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

const INACTIVE_WIDTH = 5.55;
const ACTIVE_WIDTH = 20.94;
const DOT_HEIGHT = 5.84;
const INACTIVE_COLOR = '#E1E1E1';
const ACTIVE_COLOR = '#392EFF';

type OnboardingPaginationDotProps = {
  isActive: boolean;
  duration?: number;
};

export function OnboardingPaginationDot({ isActive, duration = 320 }: OnboardingPaginationDotProps) {
  const progress = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isActive ? 1 : 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, [duration, isActive, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [INACTIVE_WIDTH, ACTIVE_WIDTH],
  });

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [INACTIVE_COLOR, ACTIVE_COLOR],
  });

  return <Animated.View style={[styles.dot, { width, backgroundColor }]} />;
}

const styles = StyleSheet.create({
  dot: {
    height: DOT_HEIGHT,
    borderRadius: 7,
  },
});
