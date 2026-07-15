import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import type { OnboardingSlide } from '@/constants/onboarding-slides';

export const ONBOARDING_DESIGN_WIDTH = 390;
export const ONBOARDING_DESIGN_HEIGHT = 844;

export const ONBOARDING_LAYOUT = {
  paginationY: 56,
  contentY: 502,
  buttonY: 674,
  skipY: 763,
  buttonHeight: 59,
  contentWidth: 329,
  contentHorizontalInset: 32,
  contentBlockGap: 20,
  titleIconGap: 15,
  defaultAnimationGapAboveTitle: 10,
  illustrationZoneTopY: 48,
  welcomeHeroY: 276,
  welcomeToAnimationGap: -2,
  animationToTaglineGap: 10,
  heroContentHeight: 199.5,
  bottomBelowButton: 111,
} as const;

export type OnboardingLayoutMetrics = {
  screenWidth: number;
  screenHeight: number;
  y: (value: number) => number;
  x: (value: number) => number;
  v: (value: number) => number;
  h: (value: number) => number;
  s: (value: number) => number;
};

export function getOnboardingLayoutMetrics(
  screenWidth: number,
  screenHeight: number,
): OnboardingLayoutMetrics {
  const h = screenWidth / ONBOARDING_DESIGN_WIDTH;
  const v = screenHeight / ONBOARDING_DESIGN_HEIGHT;
  const s = Math.min(h, v);

  return {
    screenWidth,
    screenHeight,
    y: (value) => (value / ONBOARDING_DESIGN_HEIGHT) * screenHeight,
    x: (value) => (value / ONBOARDING_DESIGN_WIDTH) * screenWidth,
    v: (value) => value * v,
    h: (value) => value * h,
    s: (value) => value * s,
  };
}

export function useOnboardingLayoutMetrics() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => getOnboardingLayoutMetrics(width, height), [width, height]);
}

export type IllustrationLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function getSlideIllustrationLayout(
  slide: OnboardingSlide,
  metrics: OnboardingLayoutMetrics,
  aspectRatio: number,
): IllustrationLayout {
  const contentTop = metrics.y(ONBOARDING_LAYOUT.contentY);
  const gapAboveTitle = metrics.v(
    'animationGapAboveTitle' in slide
      ? slide.animationGapAboveTitle
      : ONBOARDING_LAYOUT.defaultAnimationGapAboveTitle,
  );
  const illustrationBottom = contentTop - gapAboveTitle;
  const zoneTop = metrics.y(ONBOARDING_LAYOUT.illustrationZoneTopY);
  const maxHeight = Math.max(illustrationBottom - zoneTop, metrics.v(120));

  const horizontalInset = metrics.h(
    'illustrationHorizontalInset' in slide ? slide.illustrationHorizontalInset : 0,
  );
  const maxWidth = metrics.screenWidth - horizontalInset * 2;

  let illustrationWidth = maxWidth;
  let illustrationHeight = illustrationWidth * aspectRatio;

  if (illustrationHeight > maxHeight) {
    illustrationHeight = maxHeight;
    illustrationWidth = illustrationHeight / aspectRatio;
  }

  const topOffset = metrics.v('illustrationTopOffset' in slide ? slide.illustrationTopOffset : 0);
  const left = (metrics.screenWidth - illustrationWidth) / 2;
  const top = Math.max(zoneTop, illustrationBottom - illustrationHeight + topOffset);

  return {
    left,
    top,
    width: illustrationWidth,
    height: illustrationHeight,
  };
}

export function getOnboardingButtonWidth(metrics: OnboardingLayoutMetrics) {
  const scaledWidth = metrics.h(329);
  const maxWidth = metrics.screenWidth - metrics.h(ONBOARDING_LAYOUT.contentHorizontalInset) * 2;
  return Math.min(scaledWidth, maxWidth);
}

export function getOnboardingContentLeft(metrics: OnboardingLayoutMetrics) {
  const contentWidth = metrics.h(ONBOARDING_LAYOUT.contentWidth);
  return (metrics.screenWidth - contentWidth) / 2;
}
