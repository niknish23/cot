import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { loadSvgText } from '@/lib/load-svg-text';
import {
  getAnimationAspectRatio,
  patchOnboardingAnimationFreezeLastFrame,
  patchOnboardingAnimationLoop,
} from '@/lib/onboarding-animation-patch';
import {
  buildSvgWebViewHtml,
  patchSvgForLegacyWebView,
  shouldPreferLegacySvgPatch,
  SVG_WEBVIEW_PROBE_SCRIPT,
} from '@/lib/svg-compat';

type OnboardingAnimationProps = {
  source: number;
  style?: ViewStyle;
  onAspectRatio?: (aspectRatio: number) => void;
  freezeLastFrame?: boolean;
  skipLoopPatch?: boolean;
};

type RenderMode = 'webview' | 'static-image';

function prepareSvgContent(
  rawSvg: string,
  {
    freezeLastFrame,
    skipLoopPatch,
    forceLegacy,
  }: {
    freezeLastFrame: boolean;
    skipLoopPatch: boolean;
    forceLegacy: boolean;
  },
) {
  const loopPatched = skipLoopPatch ? rawSvg : patchOnboardingAnimationLoop(rawSvg);
  const framePatched = freezeLastFrame ? patchOnboardingAnimationFreezeLastFrame(loopPatched) : loopPatched;
  return forceLegacy ? patchSvgForLegacyWebView(framePatched) : framePatched;
}

export function OnboardingAnimation({
  source,
  style,
  onAspectRatio,
  freezeLastFrame = false,
  skipLoopPatch = false,
}: OnboardingAnimationProps) {
  const [rawSvg, setRawSvg] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>('webview');
  const [forceLegacy, setForceLegacy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAnimation = async () => {
      setRenderMode('webview');
      setRawSvg(null);
      setHtml(null);

      try {
        const svgText = await loadSvgText(source);

        if (cancelled) {
          return;
        }

        setRawSvg(svgText);
        onAspectRatio?.(getAnimationAspectRatio(svgText));
        setForceLegacy(shouldPreferLegacySvgPatch(svgText));
      } catch {
        if (!cancelled) {
          setRenderMode('static-image');
        }
      }
    };

    void loadAnimation();

    return () => {
      cancelled = true;
    };
  }, [onAspectRatio, source]);

  useEffect(() => {
    if (!rawSvg) {
      return;
    }

    const svgContent = prepareSvgContent(rawSvg, {
      freezeLastFrame,
      skipLoopPatch,
      forceLegacy,
    });

    setHtml(buildSvgWebViewHtml(svgContent));
  }, [forceLegacy, freezeLastFrame, rawSvg, skipLoopPatch]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    if (event.nativeEvent.data === 'offset-unsupported') {
      setForceLegacy(true);
      return;
    }

    if (event.nativeEvent.data === 'svg-missing') {
      setRenderMode('static-image');
    }
  }, []);

  const handleWebViewError = useCallback(() => {
    setRenderMode('static-image');
  }, []);

  if (renderMode === 'static-image') {
    return (
      <View style={[styles.placeholder, style]}>
        <Image source={source} style={styles.staticImage} contentFit="contain" />
      </View>
    );
  }

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
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      allowUniversalAccessFromFileURLs={Platform.OS === 'android'}
      mixedContentMode="always"
      setBuiltInZoomControls={false}
      androidLayerType="hardware"
      onError={handleWebViewError}
      onHttpError={handleWebViewError}
      onMessage={handleWebViewMessage}
      injectedJavaScript={SVG_WEBVIEW_PROBE_SCRIPT}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
  },
  staticImage: {
    width: '100%',
    height: '100%',
  },
});
