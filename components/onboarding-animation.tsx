import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

import { getAnimationAspectRatio, patchOnboardingAnimationFreezeLastFrame, patchOnboardingAnimationLoop } from '@/lib/onboarding-animation-patch';

type OnboardingAnimationProps = {
  source: number;
  style?: ViewStyle;
  onAspectRatio?: (aspectRatio: number) => void;
  freezeLastFrame?: boolean;
  skipLoopPatch?: boolean;
};

export function OnboardingAnimation({
  source,
  style,
  onAspectRatio,
  freezeLastFrame = false,
  skipLoopPatch = false,
}: OnboardingAnimationProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    const loadAnimation = async () => {
      const { uri } = Image.resolveAssetSource(source);

      if (!uri) {
        return;
      }

      const response = await fetch(uri);
      const rawSvg = await response.text();
      const aspectRatio = getAnimationAspectRatio(rawSvg);
      onAspectRatio?.(aspectRatio);

      const svgContent = skipLoopPatch ? rawSvg : patchOnboardingAnimationLoop(rawSvg);
      const finalSvg = freezeLastFrame ? patchOnboardingAnimationFreezeLastFrame(svgContent) : svgContent;

      setHtml(`<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: transparent;
        width: 100%;
        height: 100%;
      }
      svg {
        width: 100%;
        height: 100%;
        display: block;
      }
    </style>
  </head>
  <body>${finalSvg}</body>
</html>`);
    };

    void loadAnimation();
  }, [freezeLastFrame, onAspectRatio, skipLoopPatch, source]);

  if (!html) {
    return <View style={[styles.placeholder, style]} />;
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={[styles.webview, style]}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'transparent',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});
