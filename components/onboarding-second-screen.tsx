import { useFonts } from 'expo-font';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { OnboardingAnimation } from '@/components/onboarding-animation';
import { OnboardingFadeInText } from '@/components/onboarding-fade-in-text';
import { OnboardingGif } from '@/components/onboarding-gif';
import { OnboardingFadeUpText } from '@/components/onboarding-fade-up-text';
import { OnboardingPaginationDot } from '@/components/onboarding-pagination-dot';
import { ChatIcon } from '@/components/icons/chat-icon';
import { DiaryIcon } from '@/components/icons/diary-icon';
import { FlowerIcon } from '@/components/icons/flower-icon';
import { PencilIcon } from '@/components/icons/pencil-icon';
import { ONBOARDING_SLIDES, type OnboardingSlide } from '@/constants/onboarding-slides';
import {
  getOnboardingButtonWidth,
  getOnboardingContentLeft,
  getSlideIllustrationLayout,
  ONBOARDING_LAYOUT,
  useOnboardingLayoutMetrics,
} from '@/lib/onboarding-layout';

const COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  mainBlue: '#392EFF',
  lightGray: '#E1E1E1',
};

const DEFAULT_ANIMATION_ASPECT_RATIO = 445 / 393;

type OnboardingSecondScreenProps = {
  onComplete: () => void;
  onSkip?: () => void;
};

function getSlideAspectRatio(slide: OnboardingSlide) {
  return 'animationAspectRatio' in slide ? slide.animationAspectRatio : DEFAULT_ANIMATION_ASPECT_RATIO;
}

function getIcon(iconName: OnboardingSlide['iconName'], mirrored = false, size = 32) {
  switch (iconName) {
    case 'chat':
      return <ChatIcon width={size} height={size} />;
    case 'pencil':
      return (
        <View style={mirrored ? styles.mirroredIcon : undefined}>
          <PencilIcon />
        </View>
      );
    case 'flower':
      return <FlowerIcon />;
    case 'diary':
      return <DiaryIcon width={size} height={size} />;
    default:
      return <ChatIcon width={size} height={size} />;
  }
}

function renderSlideMedia(
  slide: OnboardingSlide,
  onAspectRatio: (aspectRatio: number) => void,
) {
  if ('gifSource' in slide && 'gifDurationMs' in slide) {
    return <OnboardingGif source={slide.gifSource} durationMs={slide.gifDurationMs} />;
  }

  if ('animationSource' in slide) {
    return (
      <OnboardingAnimation
        freezeLastFrame={'freezeAnimationLastFrame' in slide ? slide.freezeAnimationLastFrame : false}
        source={slide.animationSource}
        style={styles.animation}
        onAspectRatio={onAspectRatio}
      />
    );
  }

  return null;
}

type SlideGraphicProps = {
  slide: OnboardingSlide;
  width: number;
  viewportTop: number;
};

function CarouselSlideGraphic({ slide, width, viewportTop }: SlideGraphicProps) {
  const metrics = useOnboardingLayoutMetrics();
  const layout = getSlideIllustrationLayout(slide, metrics, getSlideAspectRatio(slide));

  return (
    <View style={[styles.graphicPage, { width }]}>
      <View
        style={[
          styles.graphicFrame,
          {
            left: layout.left,
            top: layout.top - viewportTop,
            width: layout.width,
            height: layout.height,
          },
        ]}
        pointerEvents="none"
      />
    </View>
  );
}

function ActiveSlideGraphic({
  slide,
  width,
  viewportTop,
  playKey,
}: SlideGraphicProps & { playKey: number }) {
  const metrics = useOnboardingLayoutMetrics();
  const aspectRatio = getSlideAspectRatio(slide);
  const [resolvedAspectRatio, setResolvedAspectRatio] = useState(aspectRatio);
  const layout = getSlideIllustrationLayout(slide, metrics, resolvedAspectRatio);

  useEffect(() => {
    setResolvedAspectRatio(aspectRatio);
  }, [aspectRatio, slide]);

  return (
    <View
      style={[
        styles.activeGraphicFrame,
        {
          left: layout.left,
          top: layout.top - viewportTop,
          width: layout.width,
          height: layout.height,
        },
      ]}
      pointerEvents="none">
      <View key={playKey} style={styles.activeGraphicContent}>
        {renderSlideMedia(slide, setResolvedAspectRatio)}
      </View>
    </View>
  );
}

export function OnboardingSecondScreen({ onComplete, onSkip }: OnboardingSecondScreenProps) {
  const { width } = useWindowDimensions();
  const metrics = useOnboardingLayoutMetrics();
  const slideProgress = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(1)).current;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [incomingSlideIndex, setIncomingSlideIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPlayKey, setAnimationPlayKey] = useState(0);

  const [fontsLoaded] = useFonts({
    Handwriting: require('@/assets/fonts/Handwriting-Regular.otf'),
  });

  const illustrationViewport = useMemo(() => {
    let minTop = Infinity;
    let maxBottom = 0;

    for (const slide of ONBOARDING_SLIDES) {
      const layout = getSlideIllustrationLayout(slide, metrics, getSlideAspectRatio(slide));
      minTop = Math.min(minTop, layout.top);
      maxBottom = Math.max(maxBottom, layout.top + layout.height);
    }

    return {
      top: minTop,
      height: maxBottom - minTop,
    };
  }, [metrics]);

  const layout = useMemo(
    () => ({
      paginationTop: metrics.y(ONBOARDING_LAYOUT.paginationY),
      carouselTop: illustrationViewport.top,
      carouselHeight: illustrationViewport.height,
      contentLeft: getOnboardingContentLeft(metrics),
      contentTop: metrics.y(ONBOARDING_LAYOUT.contentY),
      contentWidth: metrics.h(ONBOARDING_LAYOUT.contentWidth),
      contentGap: metrics.v(ONBOARDING_LAYOUT.contentBlockGap),
      titleIconGap: metrics.v(ONBOARDING_LAYOUT.titleIconGap),
      buttonTop: metrics.y(ONBOARDING_LAYOUT.buttonY),
      buttonWidth: getOnboardingButtonWidth(metrics),
      buttonHeight: metrics.v(ONBOARDING_LAYOUT.buttonHeight),
      buttonRadius: metrics.s(38),
      skipTop: metrics.y(ONBOARDING_LAYOUT.skipY),
      iconSize: metrics.s(32),
      titleSize: metrics.s(42),
      subtitleSize: metrics.s(16),
      subtitleMinHeight: metrics.v(44),
    }),
    [illustrationViewport.height, illustrationViewport.top, metrics],
  );

  const currentSlide = ONBOARDING_SLIDES[currentSlideIndex];
  const pageIndex = (isAnimating ? incomingSlideIndex : currentSlideIndex) + 1;
  const displayedSlide = ONBOARDING_SLIDES[isAnimating ? incomingSlideIndex : currentSlideIndex];
  const showSkip = onSkip && !('hideSkip' in displayedSlide && displayedSlide.hideSkip);

  const animateContentChange = useCallback(() => {
    iconOpacity.setValue(0);

    Animated.timing(iconOpacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [iconOpacity]);

  const transitionToSlide = useCallback(
    (nextSlideIndex: number) => {
      if (isAnimating || nextSlideIndex === currentSlideIndex) {
        return;
      }

      setIsAnimating(true);
      setIncomingSlideIndex(nextSlideIndex);
      animateContentChange();

      slideProgress.stopAnimation(() => {
        slideProgress.setValue(0);

        Animated.timing(slideProgress, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) {
            setIncomingSlideIndex(currentSlideIndex);
            slideProgress.setValue(0);
            setIsAnimating(false);
            return;
          }

          slideProgress.setValue(0);
          setCurrentSlideIndex(nextSlideIndex);
          setIncomingSlideIndex(nextSlideIndex);
          setAnimationPlayKey((key) => key + 1);
          setIsAnimating(false);
        });
      });
    },
    [animateContentChange, currentSlideIndex, isAnimating, slideProgress],
  );

  const handleContinue = () => {
    if (isAnimating) {
      return;
    }

    if (currentSlideIndex < ONBOARDING_SLIDES.length - 1) {
      transitionToSlide(currentSlideIndex + 1);
      return;
    }

    onComplete();
  };

  const handleSkip = () => {
    if (isAnimating || !onSkip) {
      return;
    }

    onSkip();
  };

  const carouselTranslateX = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-currentSlideIndex * width, -(currentSlideIndex + 1) * width],
  });

  const titleFontFamily = fontsLoaded ? 'Handwriting' : undefined;
  const contentAnimateKey = isAnimating ? incomingSlideIndex : currentSlideIndex;

  return (
    <View style={styles.container}>
      <View style={[styles.paginationRow, { top: layout.paginationTop }]} pointerEvents="none">
        {ONBOARDING_SLIDES.map((_, index) => (
          <OnboardingPaginationDot key={`dot-${index}`} isActive={pageIndex === index + 1} />
        ))}
      </View>

      <View
        style={[
          styles.carouselViewport,
          {
            top: layout.carouselTop,
            height: layout.carouselHeight,
          },
        ]}
        pointerEvents="none">
        <Animated.View
          style={[
            styles.carouselTrack,
            {
              width: width * ONBOARDING_SLIDES.length,
              transform: [{ translateX: carouselTranslateX }],
            },
          ]}>
          {ONBOARDING_SLIDES.map((slide, index) => (
            <CarouselSlideGraphic key={`graphic-${index}`} slide={slide} viewportTop={illustrationViewport.top} width={width} />
          ))}
        </Animated.View>
        {!isAnimating ? (
          <View style={styles.activeGraphicOverlay} pointerEvents="none">
            <ActiveSlideGraphic
              key={`active-${currentSlideIndex}`}
              playKey={animationPlayKey}
              slide={currentSlide}
              viewportTop={illustrationViewport.top}
              width={width}
            />
          </View>
        ) : null}
      </View>

      <View
        style={[
          styles.contentBlock,
          {
            left: layout.contentLeft,
            top: layout.contentTop,
            width: layout.contentWidth,
            gap: layout.contentGap,
          },
        ]}
        pointerEvents="none">
        <View style={[styles.titleRow, { gap: layout.titleIconGap }]}>
          <Animated.View style={[styles.iconWrap, { opacity: iconOpacity, width: layout.iconSize, height: layout.iconSize }]}>
            {getIcon(
              displayedSlide.iconName,
              'iconMirrored' in displayedSlide ? displayedSlide.iconMirrored : false,
              layout.iconSize,
            )}
          </Animated.View>
          <OnboardingFadeInText
            key={contentAnimateKey}
            lineStyle={[
              styles.title,
              styles.titleChar,
              {
                fontSize: layout.titleSize,
                fontFamily: titleFontFamily,
                fontWeight: '400',
              },
            ]}
            text={displayedSlide.title}
          />
        </View>

        <OnboardingFadeUpText
          animateKey={contentAnimateKey}
          style={[styles.subtitle, { fontSize: layout.subtitleSize, minHeight: layout.subtitleMinHeight }]}
          text={displayedSlide.subtitle}
        />
      </View>

      <View
        style={[
          styles.buttonWrap,
          {
            top: layout.buttonTop,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={displayedSlide.buttonLabel}
          disabled={isAnimating}
          onPress={handleContinue}
          style={[
            styles.button,
            {
              width: layout.buttonWidth,
              height: layout.buttonHeight,
              borderRadius: layout.buttonRadius,
            },
          ]}>
          <Text style={[styles.buttonText, { fontSize: metrics.s(16) }]}>{displayedSlide.buttonLabel}</Text>
        </Pressable>
      </View>

      {showSkip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          disabled={isAnimating}
          onPress={handleSkip}
          style={[styles.skipButton, { top: layout.skipTop }]}>
          <Text style={[styles.skipText, { fontSize: metrics.s(16) }]}>Skip</Text>
        </Pressable>
      ) : null}
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
  paginationRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    zIndex: 10,
  },
  carouselViewport: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  carouselTrack: {
    flexDirection: 'row',
    height: '100%',
  },
  graphicPage: {
    height: '100%',
    position: 'relative',
  },
  graphicFrame: {
    position: 'absolute',
    backgroundColor: COLORS.white,
  },
  activeGraphicOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  activeGraphicFrame: {
    position: 'absolute',
    backgroundColor: COLORS.white,
  },
  activeGraphicContent: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  animation: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentBlock: {
    position: 'absolute',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mirroredIcon: {
    transform: [{ scaleX: -1 }],
  },
  title: {
    color: COLORS.mainBlue,
  },
  titleChar: {
    color: COLORS.mainBlue,
  },
  subtitle: {
    alignSelf: 'stretch',
    color: 'rgba(0, 0, 0, 0.80)',
    fontWeight: '400',
    textAlign: 'left',
  },
  buttonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  button: {
    backgroundColor: COLORS.mainBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  skipButton: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  skipText: {
    color: COLORS.black,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});
