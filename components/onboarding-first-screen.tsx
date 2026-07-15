import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { OnboardingAnimation } from '@/components/onboarding-animation';
import {
  getSlideUpWordsDuration,
  OnboardingSlideUpWords,
} from '@/components/onboarding-slide-up-words';

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  mainBlue: '#392EFF',
  tagline: 'rgba(0, 0, 0, 0.20)',
};

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
const TEXT_START_DELAY_MS = 2500;
const TAGLINE_DELAY_AFTER_WELCOME_MS = 300;
const BUTTON_OFFSET_Y = 10;
const BUTTON_DURATION_MS = 420;

const INTRO_ANIMATION_SCALE = 1.3;
const BRAND_ANIMATION_BASE_WIDTH = 182.45;
const BRAND_ANIMATION_BASE_HEIGHT = 119.19;
const WELCOME_TEXT = 'Welcome to';
const TAGLINE_TEXT = 'collection-of-thoughts';

type OnboardingFirstScreenProps = {
  onContinue: () => void;
};

export function OnboardingFirstScreen({ onContinue }: OnboardingFirstScreenProps) {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(BUTTON_OFFSET_Y)).current;
  const [showTagline, setShowTagline] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const layout = useMemo(
    () => ({
      heroTop: 276 * scale,
      welcomeSize: 18.74 * scale,
      animationWidth: BRAND_ANIMATION_BASE_WIDTH * INTRO_ANIMATION_SCALE * scale,
      animationHeight: BRAND_ANIMATION_BASE_HEIGHT * INTRO_ANIMATION_SCALE * scale,
      taglineSize: 12 * scale,
      taglineGap: 10 * scale,
      buttonLeft: 32 * scale,
      buttonTop: 674 * scale,
      buttonWidth: 329 * scale,
      buttonHeight: 59 * scale,
    }),
    [scale],
  );

  const welcomeDurationMs = getSlideUpWordsDuration(WELCOME_TEXT.trim().split(/\s+/).length);
  const taglineDurationMs = getSlideUpWordsDuration(1);

  useEffect(() => {
    const taglineTimer = setTimeout(() => {
      setShowTagline(true);
    }, TEXT_START_DELAY_MS + welcomeDurationMs + TAGLINE_DELAY_AFTER_WELCOME_MS);

    return () => clearTimeout(taglineTimer);
  }, [welcomeDurationMs]);

  useEffect(() => {
    if (!showTagline) {
      return;
    }

    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, taglineDurationMs);

    return () => clearTimeout(buttonTimer);
  }, [showTagline, taglineDurationMs]);

  useEffect(() => {
    if (!showButton) {
      return;
    }

    buttonOpacity.setValue(0);
    buttonTranslateY.setValue(BUTTON_OFFSET_Y);

    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: BUTTON_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(buttonTranslateY, {
        toValue: 0,
        duration: BUTTON_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonOpacity, buttonTranslateY, showButton]);

  return (
    <View style={styles.container}>
      <View style={[styles.heroSection, { top: layout.heroTop }]}>
        <OnboardingSlideUpWords
          startDelay={TEXT_START_DELAY_MS}
          style={styles.welcomeRow}
          text={WELCOME_TEXT}
          wordStyle={[styles.welcome, { fontSize: layout.welcomeSize }]}
        />

        <View
          style={[
            styles.animationWrap,
            {
              width: layout.animationWidth,
              height: layout.animationHeight,
              marginTop: -2 * scale,
            },
          ]}>
          <OnboardingAnimation
            freezeLastFrame
            skipLoopPatch
            source={require('@/assets/animations/intro_an.svg')}
            style={styles.introAnimation}
          />
        </View>

        {showTagline ? (
          <OnboardingSlideUpWords
            startDelay={0}
            style={[styles.taglineRow, { marginTop: layout.taglineGap }]}
            text={TAGLINE_TEXT}
            wordStyle={[styles.tagline, { fontSize: layout.taglineSize }]}
          />
        ) : null}
      </View>

      <Animated.View
        pointerEvents={showButton ? 'auto' : 'none'}
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
  heroSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  welcomeRow: {
    justifyContent: 'center',
  },
  welcome: {
    color: COLORS.black,
    fontWeight: '400',
    textAlign: 'center',
  },
  animationWrap: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  introAnimation: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  taglineRow: {
    justifyContent: 'center',
  },
  tagline: {
    color: COLORS.tagline,
    fontWeight: '400',
    textAlign: 'center',
  },
  buttonWrap: {
    position: 'absolute',
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.mainBlue,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
});
