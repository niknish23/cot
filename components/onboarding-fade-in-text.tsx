import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type TextStyle, View, type ViewStyle } from 'react-native';

type OnboardingFadeInTextProps = {
  text: string;
  animateKey?: string | number;
  style?: StyleProp<ViewStyle>;
  lineStyle?: StyleProp<TextStyle>;
  lineDelay?: number;
};

type FadeInLineProps = {
  line: string;
  index: number;
  lineStyle?: StyleProp<TextStyle>;
  lineDelay: number;
};

function FadeInLine({ line, index, lineStyle, lineDelay }: FadeInLineProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);

    Animated.sequence([
      Animated.delay(index * lineDelay),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, lineDelay, opacity]);

  return (
    <Animated.Text
      style={[
        lineStyle,
        {
          opacity,
          transform: [
            {
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}>
      {line}
    </Animated.Text>
  );
}

export function OnboardingFadeInText({
  text,
  animateKey,
  style,
  lineStyle,
  lineDelay = 120,
}: OnboardingFadeInTextProps) {
  const lines = useMemo(() => text.split('\n'), [text]);

  return (
    <View key={animateKey} style={[styles.container, style]}>
      {lines.map((line, index) => (
        <FadeInLine
          key={`${index}-${line}`}
          index={index}
          line={line}
          lineDelay={lineDelay}
          lineStyle={lineStyle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
});
