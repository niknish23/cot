import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { type ImageStyle, type StyleProp } from 'react-native';

type OnboardingGifProps = {
  source: number;
  durationMs: number;
  style?: StyleProp<ImageStyle>;
};

export function OnboardingGif({ source, durationMs, style }: OnboardingGifProps) {
  const imageRef = useRef<Image>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      void imageRef.current?.stopAnimating();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs]);

  return <Image ref={imageRef} source={source} style={style} contentFit="contain" autoplay />;
}
