import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { OnboardingFirstScreen } from '@/components/onboarding-first-screen';
import { OnboardingSecondScreen } from '@/components/onboarding-second-screen';
import { DEV_FORCE_ONBOARDING } from '@/constants/dev';
import { ONBOARDING_SLIDES } from '@/constants/onboarding-slides';
import { loadSvgText } from '@/lib/load-svg-text';

const ONBOARDING_COMPLETE_KEY = 'onboarding-complete-v4';
const ONBOARDING_PROGRESS_KEY = 'onboarding-progress-v4';

function prefetchOnboardingAssets() {
  for (const slide of ONBOARDING_SLIDES) {
    if ('gifSource' in slide) {
      const { uri: gifUri } = Image.resolveAssetSource(slide.gifSource);

      if (gifUri) {
        void Image.prefetch(gifUri);
      }
    }

    if ('animationSource' in slide) {
      void loadSvgText(slide.animationSource).catch(() => undefined);
    }
  }

  void loadSvgText(require('@/assets/animations/intro_an.svg')).catch(() => undefined);
}

export default function Index() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [showFeatureSlides, setShowFeatureSlides] = useState(false);

  useEffect(() => {
    const loadOnboardingState = async () => {
      if (DEV_FORCE_ONBOARDING) {
        await AsyncStorage.multiRemove([ONBOARDING_COMPLETE_KEY, ONBOARDING_PROGRESS_KEY]);
        setShowFeatureSlides(false);
        setIsReady(true);
        return;
      }

      const storedComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

      if (storedComplete === '1') {
        router.replace('/(tabs)');
        return;
      }

      await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
      setShowFeatureSlides(false);
      setIsReady(true);
    };

    void loadOnboardingState();
  }, [router]);

  useEffect(() => {
    if (isReady) {
      prefetchOnboardingAssets();
    }
  }, [isReady]);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
    await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    router.replace('/(tabs)');
  };

  const handleFirstContinue = () => {
    setShowFeatureSlides(true);
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  if (!isReady) {
    return <View style={styles.loading} />;
  }

  if (!showFeatureSlides) {
    return <OnboardingFirstScreen onContinue={handleFirstContinue} />;
  }

  return <OnboardingSecondScreen onComplete={completeOnboarding} onSkip={handleSkip} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
