import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CotFlowerIcon } from '@/components/icons/cot-flower-icon';

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  mainBlue: '#392EFF',
  slightWhite: '#F7F7F7',
};

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

type AnimatedTextProps = {
  text: string;
  delay?: number;
  style?: any;
  charStyle?: any;
};

function AnimatedText({ text, delay = 0, style, charStyle }: AnimatedTextProps) {
  const animations = useRef(text.split('').map(() => new Animated.Value(0))).current;

  useEffect(() => {
    animations.forEach((value) => value.setValue(0));

    Animated.stagger(
      100,
      animations.map((value, index) =>
        Animated.sequence([
          Animated.delay(delay + index * 100),
          Animated.spring(value, {
            toValue: 1,
            useNativeDriver: true,
            damping: 12,
            stiffness: 200,
            mass: 0.8,
          }),
        ]),
      ),
    ).start();
  }, [animations, delay, text]);

  return (
    <View style={[style, styles.animatedTextRow]}>
      {text.split('').map((character, index) => {
        const animation = animations[index];

        return (
          <Animated.Text
            key={`${character}-${index}`}
            style={[
              charStyle,
              {
                opacity: animation,
                transform: [
                  {
                    translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
                  },
                  {
                    rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['45deg', '0deg'] }),
                  },
                  {
                    scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  },
                ],
              },
            ]}>
            {character}
          </Animated.Text>
        );
      })}
    </View>
  );
}

type OnboardingFirstScreenProps = {
  onContinue: () => void;
};

export function OnboardingFirstScreen({ onContinue }: OnboardingFirstScreenProps) {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(24)).current;
  const flowerRotation = useRef(new Animated.Value(0)).current;

  const layout = useMemo(
    () => ({
      welcomeLeft: 144.29 * scale,
      welcomeTop: 344.18 * scale,
      welcomeWidth: 105 * scale,
      buttonLeft: 32 * scale,
      buttonTop: 694 * scale,
      buttonWidth: 329 * scale,
      buttonHeight: 59 * scale,
      welcomeSize: 18.74 * scale,
      cotSize: 56.62 * scale,
      flowerWidth: 28.45 * scale,
      flowerHeight: 28.36 * scale,
      flowerGap: 4.72 * scale,
    }),
    [scale],
  );

  useEffect(() => {
    Animated.loop(
      Animated.timing(flowerRotation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 450,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonTranslateY, {
        toValue: 0,
        duration: 450,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonOpacity, buttonTranslateY, flowerRotation]);

  const flowerRotateStyle = {
    transform: [
      {
        rotate: flowerRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <View style={[styles.brandGroup, { left: layout.welcomeLeft, top: layout.welcomeTop, width: layout.welcomeWidth }]}>
        <AnimatedText text="Welcome to" delay={0} style={styles.welcome} charStyle={styles.welcomeChar} />

        <View style={[styles.cotRow, { gap: layout.flowerGap }]}>
          <AnimatedText text="C" delay={150} style={styles.cotCharWrap} charStyle={[styles.cotChar, { fontSize: layout.cotSize }]} />

          <Animated.View style={[styles.flowerWrap, flowerRotateStyle, { width: layout.flowerWidth, height: layout.flowerHeight }]}>
            <CotFlowerIcon width={layout.flowerWidth} height={layout.flowerHeight} />
          </Animated.View>

          <AnimatedText text="t" delay={220} style={styles.cotCharWrap} charStyle={[styles.cotChar, { fontSize: layout.cotSize }]} />
        </View>
      </View>

      <Animated.View
        style={[
          styles.buttonWrap,
          {
            left: layout.buttonLeft,
            top: layout.buttonTop,
            width: layout.buttonWidth,
            height: layout.buttonHeight,
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
          },
        ]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Hi there" onPress={onContinue} style={styles.button}>
          <Text style={[styles.buttonText, { fontSize: 16 * scale }]}>Hi there!</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    borderRadius: 39,
  },
  brandGroup: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  welcome: {
    color: COLORS.black,
    fontWeight: '400',
    textAlign: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  welcomeChar: {
    color: COLORS.black,
    fontWeight: '400',
  },
  animatedTextRow: {
    flexDirection: 'row',
  },
  cotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 1,
  },
  cotCharWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cotChar: {
    color: COLORS.black,
    fontWeight: '500',
    lineHeight: 68.59,
  },
  flowerWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWrap: {
    position: 'absolute',
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.slightWhite,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.mainBlue,
    fontWeight: '500',
  },
});