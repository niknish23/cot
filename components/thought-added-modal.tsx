import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { DoodlePreview } from '@/components/doodle-preview';
import { clearDoodle, type DoodleStroke } from '@/lib/doodle-store';

type ThoughtAddedModalProps = {
  strokes: DoodleStroke[];
  onDismiss: () => void;
};

export function ThoughtAddedModal({ strokes, onDismiss }: ThoughtAddedModalProps) {
  const previewScale = useRef(new Animated.Value(0.7)).current;
  const previewOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(previewScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(previewOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [previewOpacity, previewScale]);

  const handleDismiss = () => {
    clearDoodle();
    onDismiss();
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>Thought added!</Text>

        <Animated.View style={[styles.previewWrap, { opacity: previewOpacity, transform: [{ scale: previewScale }] }]}>
          <DoodlePreview strokes={strokes} />
        </Animated.View>

        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss thought added modal" onPress={handleDismiss} style={styles.button}>
          <Text style={styles.buttonText}>Yay!</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 353,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
    gap: 28,
  },
  title: {
    alignSelf: 'stretch',
    textAlign: 'center',
    color: '#000000',
    fontSize: 18,
    fontWeight: '500',
  },
  previewWrap: {
    width: 117.37,
    height: 117.37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 18,
    backgroundColor: '#DAE2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#392EFF',
    fontSize: 16,
    fontWeight: '500',
  },
});