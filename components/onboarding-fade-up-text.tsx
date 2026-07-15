import { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type TextStyle } from 'react-native';

type OnboardingFadeUpTextProps = {
  text: string;
  animateKey: string | number;
  style?: StyleProp<TextStyle>;
  offsetY?: number;
  duration?: number;
  startDelay?: number;
};

type OnboardingFadeUpTextInnerProps = Omit<OnboardingFadeUpTextProps, 'animateKey'>;

function OnboardingFadeUpTextInner({
  text,
  style,
  offsetY = 5,
  duration = 420,
  startDelay = 120,
}: OnboardingFadeUpTextInnerProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    Animated.sequence([
      Animated.delay(startDelay),
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, progress, startDelay, text]);

  return (
    <Animated.Text
      style={[
        style,
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
      {text}
    </Animated.Text>
  );
}

export function OnboardingFadeUpText({
  text,
  animateKey,
  style,
  offsetY,
  duration,
  startDelay,
}: OnboardingFadeUpTextProps) {
  return (
    <OnboardingFadeUpTextInner
      key={animateKey}
      duration={duration}
      offsetY={offsetY}
      startDelay={startDelay}
      style={style}
      text={text}
    />
  );
}
