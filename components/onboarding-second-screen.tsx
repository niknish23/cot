import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ChatIcon } from '@/components/icons/chat-icon';
import { DiaryIcon } from '@/components/icons/diary-icon';
import { FlowerIcon } from '@/components/icons/flower-icon';
import { PencilIcon } from '@/components/icons/pencil-icon';

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  mainBlue: '#392EFF',
  slightWhite: '#F7F7F7',
  lightGray: '#E1E1E1',
};

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

type OnboardingSecondScreenProps = {
  onContinue: () => void;
  buttonLabel: string;
  imageSource: number;
  iconName: 'chat' | 'pencil' | 'flower' | 'diary';
  pageIndex: number;
  title: string;
  subtitle: string;
  animateEntrance?: boolean;
};

type TextAnimateProps = {
  children: string;
  by?: 'character';
  delay?: number;
  style?: object;
  charStyle?: object;
  animateEntrance?: boolean;
};

function TextAnimate({
  children,
  by = 'character',
  delay = 0,
  style,
  charStyle,
  animateEntrance = true,
}: TextAnimateProps) {
  const characterText = children;
  const characters = useMemo(
    () => (by === 'character' ? characterText.split('') : [characterText]),
    [by, characterText],
  );
  const animations = useMemo(
    () => characters.map(() => new Animated.Value(animateEntrance ? 0 : 1)),
    [animateEntrance, characters],
  );

  useEffect(() => {
    if (!animateEntrance) {
      animations.forEach((value) => value.setValue(1));
      return;
    }

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
  }, [animateEntrance, animations, delay, characters]);

  return (
    <View style={[style, styles.animatedTextRow]}>
      {characters.map((character, index) => {
        const animationValue = animations[index];

        return (
          <Animated.Text
            key={`${character}-${index}`}
            style={[
              charStyle,
              {
                opacity: animationValue,
                transform: [
                  {
                    translateY: animationValue.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
                  },
                  {
                    scale: animationValue.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }),
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

function getIcon(iconName: OnboardingSecondScreenProps['iconName']) {
  switch (iconName) {
    case 'chat':
      return <ChatIcon width={32} height={32} />;
    case 'pencil':
      return <PencilIcon />;
    case 'flower':
      return <FlowerIcon />;
    case 'diary':
      return <DiaryIcon width={32} height={32} />;
    default:
      return <ChatIcon width={32} height={32} />;
  }
}

export function OnboardingSecondScreen({
  onContinue,
  buttonLabel,
  imageSource,
  iconName,
  pageIndex,
  title,
  subtitle,
  animateEntrance = false,
}: OnboardingSecondScreenProps) {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const buttonOpacity = useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const buttonTranslateY = useRef(new Animated.Value(animateEntrance ? 24 : 0)).current;

  const layout = useMemo(
    () => ({
      imageLeft: 32 * scale,
      imageTop: 106.91 * scale,
      imageWidth: 329 * scale,
      imageHeight: 350.62 * scale,
      contentLeft: 80.39 * scale,
      contentTop: 501.68 * scale,
      contentWidth: 232.21 * scale,
      buttonLeft: 32 * scale,
      buttonTop: 694 * scale,
      buttonWidth: 329 * scale,
      buttonHeight: 59 * scale,
    }),
    [scale],
  );

  useEffect(() => {
    if (!animateEntrance) {
      buttonOpacity.setValue(1);
      buttonTranslateY.setValue(0);
      return;
    }

    buttonOpacity.setValue(0);
    buttonTranslateY.setValue(24);

    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 450,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.timing(buttonTranslateY, {
        toValue: 0,
        duration: 450,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animateEntrance, buttonOpacity, buttonTranslateY]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.imageFrame,
          {
            left: layout.imageLeft,
            top: layout.imageTop,
            width: layout.imageWidth,
            height: layout.imageHeight,
          },
        ]}
        pointerEvents="none">
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
      </View>

      <View
        style={[
          styles.contentBlock,
          {
            left: layout.contentLeft,
            top: layout.contentTop,
            width: layout.contentWidth,
          },
        ]}
        pointerEvents="none">
        <View style={styles.paginationRow}>
          <View style={[styles.paginationDot, pageIndex === 1 && styles.paginationActive]} />
          <View style={[styles.paginationDot, pageIndex === 2 && styles.paginationActive]} />
          <View style={[styles.paginationDot, pageIndex === 3 && styles.paginationActive]} />
          <View style={[styles.paginationDot, pageIndex === 4 && styles.paginationActive]} />
        </View>

        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>{getIcon(iconName)}</View>
          <TextAnimate
            by="character"
            delay={2}
            animateEntrance={animateEntrance}
            style={styles.title}
            charStyle={[styles.titleChar, { fontSize: 24 * scale }]}>
            {title}
          </TextAnimate>
        </View>

        <Text style={[styles.subtitle, { fontSize: 16 * scale }]}>{subtitle}</Text>
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
        <Pressable accessibilityRole="button" accessibilityLabel={buttonLabel} onPress={onContinue} style={styles.button}>
          <Text style={[styles.buttonText, { fontSize: 16 * scale }]}>{buttonLabel}</Text>
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
  imageFrame: {
    position: 'absolute',
    backgroundColor: '#F4F4F4',
    borderRadius: 30,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentBlock: {
    position: 'absolute',
    alignItems: 'center',
  },
  animatedTextRow: {
    flexDirection: 'row',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 20,
  },
  paginationDot: {
    width: 5.55,
    height: 5.84,
    borderRadius: 7,
    backgroundColor: COLORS.lightGray,
  },
  paginationActive: {
    width: 20.94,
    backgroundColor: COLORS.mainBlue,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconWrap: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.mainBlue,
    fontWeight: '600',
  },
  titleChar: {
    color: COLORS.mainBlue,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 20,
    color: COLORS.black,
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonWrap: {
    position: 'absolute',
    zIndex: 20,
    elevation: 20,
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
