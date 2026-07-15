import { Image } from 'expo-image';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

const FREEZE_BUFFER_MS = 280;

type OnboardingGifProps = {
  source: number;
  durationMs: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function OnboardingGif({ source, durationMs, style, containerStyle }: OnboardingGifProps) {
  const imageRef = useRef<Image>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScheduledFreezeRef = useRef(false);

  const clearFreezeTimer = useCallback(() => {
    if (freezeTimerRef.current) {
      clearTimeout(freezeTimerRef.current);
      freezeTimerRef.current = null;
    }
  }, []);

  const scheduleFreeze = useCallback(() => {
    if (hasScheduledFreezeRef.current) {
      return;
    }

    hasScheduledFreezeRef.current = true;
    clearFreezeTimer();

    freezeTimerRef.current = setTimeout(() => {
      void imageRef.current?.stopAnimating();
    }, durationMs + FREEZE_BUFFER_MS);
  }, [clearFreezeTimer, durationMs]);

  useEffect(() => {
    hasScheduledFreezeRef.current = false;
    clearFreezeTimer();

    return clearFreezeTimer;
  }, [clearFreezeTimer, durationMs, source]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        ref={imageRef}
        source={source}
        style={[styles.image, style]}
        contentFit="contain"
        autoplay
        cachePolicy="memory-disk"
        onLoad={scheduleFreeze}
        onDisplay={scheduleFreeze}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});
