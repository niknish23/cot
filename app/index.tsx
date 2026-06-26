import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View, useWindowDimensions } from 'react-native';

import { OnboardingFirstScreen } from '@/components/onboarding-first-screen';
import { OnboardingSecondScreen } from '@/components/onboarding-second-screen';

const ONBOARDING_COMPLETE_KEY = 'onboarding-complete-v4';
const ONBOARDING_PROGRESS_KEY = 'onboarding-progress-v4';

const ONBOARDING_SLIDES = [
  {
    imageSource: require('../assets/images/icons and svgs/onb1.png'),
    title: 'Record',
    subtitle: 'Record your thoughts whenever you have them.',
    iconName: 'chat' as const,
    buttonLabel: 'Next',
  },
  {
    imageSource: require('../assets/images/icons and svgs/onb2.png'),
    title: 'Fill them up!',
    subtitle: 'You can choose to expand on these thoughts whenever you want, no pressure!',
    iconName: 'pencil' as const,
    buttonLabel: 'Next',
  },
  {
    imageSource: require('../assets/images/icons and svgs/onb3.png'),
    title: 'Doodle away!',
    subtitle: 'Associate your thoughts with a doodle so you remember them better.',
    iconName: 'flower' as const,
    buttonLabel: 'Next',
  },
  {
    imageSource: require('../assets/images/icons and svgs/onb4.png'),
    title: 'Doodle Garden',
    subtitle: 'All your thoughts get saved in the calendar, so think away!',
    iconName: 'diary' as const,
    buttonLabel: 'Okay!',
  },
] as const;

type OnboardingStep = 0 | 1 | 2 | 3 | 4;

function prefetchOnboardingImages() {
  for (const slide of ONBOARDING_SLIDES) {
    const { uri } = Image.resolveAssetSource(slide.imageSource);

    if (uri) {
      void Image.prefetch(uri);
    }
  }
}

export default function Index() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const slideProgress = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(0);
  const [incomingStep, setIncomingStep] = useState<OnboardingStep>(0);
  const [resumeWithEntrance, setResumeWithEntrance] = useState(false);

  useEffect(() => {
    const loadOnboardingState = async () => {
      const storedComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

      if (storedComplete === '1') {
        router.replace('/(tabs)');
        return;
      }

      await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
      setCurrentStep(0);
      setIncomingStep(0);
      slideProgress.setValue(0);
      setResumeWithEntrance(false);
    };

    void loadOnboardingState();
  }, [router, slideProgress]);

  useEffect(() => {
    if (currentStep === 0) {
      prefetchOnboardingImages();
    }
  }, [currentStep]);

  const persistProgress = async (step: OnboardingStep) => {
    if (step >= 4) {
      await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
      return;
    }

    await AsyncStorage.setItem(ONBOARDING_PROGRESS_KEY, String(step));
  };

  const transitionToStep = (step: OnboardingStep) => {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);

    setIncomingStep(step);

    void persistProgress(step);

    slideProgress.stopAnimation(() => {
      slideProgress.setValue(0);

      Animated.timing(slideProgress, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          setIncomingStep(currentStep);
          setIsAnimating(false);
          slideProgress.setValue(0);
          return;
        }

        setCurrentStep(step);
        setIncomingStep(step);
        setResumeWithEntrance(false);
        setIsAnimating(false);
        requestAnimationFrame(() => {
          slideProgress.setValue(0);
        });
      });
    });
  };

  const handleFirstContinue = () => {
    transitionToStep(1);
  };

  const handleSlideContinue = async () => {
    if (isAnimating) {
      return;
    }

    if (currentStep < 4) {
      transitionToStep((currentStep + 1) as OnboardingStep);
      return;
    }

    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
    await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    router.replace('/(tabs)');
  };

  const renderStep = (step: OnboardingStep, slotIndex: 0 | 1, animateEntrance: boolean) => {
    if (step === 0) {
      return <OnboardingFirstScreen onContinue={handleFirstContinue} />;
    }

    const slide = ONBOARDING_SLIDES[step - 1];
    const isInteractive = step === currentStep && !isAnimating;

    return (
      <OnboardingSecondScreen
        animateEntrance={animateEntrance}
        buttonLabel={slide.buttonLabel}
        iconName={slide.iconName}
        imageSource={slide.imageSource}
        onContinue={isInteractive ? handleSlideContinue : () => {}}
        pageIndex={step}
        subtitle={slide.subtitle}
        title={slide.title}
      />
    );
  };

  const trackTranslateX = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.track,
          {
            width: width * 2,
            transform: [{ translateX: trackTranslateX }],
          },
        ]}>
        <View pointerEvents="box-none" style={[styles.slide, { width }]}>
          {renderStep(currentStep, 0, resumeWithEntrance && currentStep > 0)}
        </View>
        <View pointerEvents="box-none" style={[styles.slide, { width }]}>
          {renderStep(incomingStep, 1, resumeWithEntrance && incomingStep > 0)}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    backgroundColor: '#FFFFFF',
    flexGrow: 0,
    flexShrink: 0,
  },
});
