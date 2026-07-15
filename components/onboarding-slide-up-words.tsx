import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type TextStyle, View, type ViewStyle } from 'react-native';

const DEFAULT_WORD_STAGGER_MS = 80;
const DEFAULT_WORD_DURATION_MS = 320;
const DEFAULT_OFFSET_Y = 12;

type OnboardingSlideUpWordsProps = {
  text: string;
  startDelay?: number;
  style?: StyleProp<ViewStyle>;
  wordStyle?: StyleProp<TextStyle>;
  wordStaggerMs?: number;
  wordDurationMs?: number;
  offsetY?: number;
  onComplete?: () => void;
};

type SlideUpWordProps = {
  word: string;
  index: number;
  startDelay: number;
  wordStyle?: StyleProp<TextStyle>;
  wordStaggerMs: number;
  wordDurationMs: number;
  offsetY: number;
};

function SlideUpWord({
  word,
  index,
  startDelay,
  wordStyle,
  wordStaggerMs,
  wordDurationMs,
  offsetY,
}: SlideUpWordProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    Animated.sequence([
      Animated.delay(startDelay + index * wordStaggerMs),
      Animated.timing(progress, {
        toValue: 1,
        duration: wordDurationMs,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, offsetY, progress, startDelay, wordDurationMs, wordStaggerMs]);

  return (
    <Animated.Text
      style={[
        wordStyle,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [offsetY, 0],
              }),
            },
          ],
        },
      ]}>
      {word}
    </Animated.Text>
  );
}

export function getSlideUpWordsDuration(
  wordCount: number,
  wordStaggerMs = DEFAULT_WORD_STAGGER_MS,
  wordDurationMs = DEFAULT_WORD_DURATION_MS,
) {
  if (wordCount <= 0) {
    return 0;
  }

  return (wordCount - 1) * wordStaggerMs + wordDurationMs;
}

export function OnboardingSlideUpWords({
  text,
  startDelay = 0,
  style,
  wordStyle,
  wordStaggerMs = DEFAULT_WORD_STAGGER_MS,
  wordDurationMs = DEFAULT_WORD_DURATION_MS,
  offsetY = DEFAULT_OFFSET_Y,
  onComplete,
}: OnboardingSlideUpWordsProps) {
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);

  useEffect(() => {
    if (!onComplete) {
      return;
    }

    const duration = getSlideUpWordsDuration(words.length, wordStaggerMs, wordDurationMs);
    const timer = setTimeout(onComplete, startDelay + duration);

    return () => clearTimeout(timer);
  }, [onComplete, startDelay, wordDurationMs, wordStaggerMs, words.length]);

  return (
    <View style={[styles.row, style]}>
      {words.map((word, index) => (
        <SlideUpWord
          key={`${word}-${index}`}
          index={index}
          offsetY={offsetY}
          startDelay={startDelay}
          word={index === words.length - 1 ? word : `${word} `}
          wordDurationMs={wordDurationMs}
          wordStaggerMs={wordStaggerMs}
          wordStyle={wordStyle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
