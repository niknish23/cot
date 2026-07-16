import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, type ViewStyle } from 'react-native';

type ThoughtDeletedToastProps = {
  onHide: () => void;
  style?: ViewStyle;
};

const VISIBLE_MS = 2400;

export function ThoughtDeletedToast({ onHide, style }: ThoughtDeletedToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onHide();
        }
      });
    }, VISIBLE_MS);

    return () => clearTimeout(hideTimer);
  }, [onHide, opacity, translateY]);

  return (
    <Animated.View pointerEvents="none" style={[styles.wrapper, style, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.toast}>
        <Text style={styles.text}>Thought deleted successfully!</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
  },
  toast: {
    padding: 12,
    backgroundColor: '#DAE2FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
});
