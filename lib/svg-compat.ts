import { Platform } from 'react-native';

import { extractKeyframeBlocks } from '@/lib/onboarding-animation-patch';

const OFFSET_PATH_PATTERN = /offset-path\s*:/i;

function radToDegInCss(css: string) {
  return css.replace(/(-?[\d.]+)rad/g, (_, radians: string) => {
    const degrees = (Number(radians) * 180) / Math.PI;
    return `${degrees.toFixed(3)}deg`;
  });
}

function getKeyframeValueAt100(keyframeBody: string, property: string) {
  const match = keyframeBody.match(new RegExp(`100%\\s*\\{[^}]*?${property}:\\s*([^;]+);`, 's'));
  return match ? match[1].trim() : null;
}

function extractSelectorRules(styleBlock: string) {
  const rules: Array<{ selector: string; body: string }> = [];
  const rulePattern = /([#.][\w-]+)\s*\{([^}]+)\}/g;
  let match = rulePattern.exec(styleBlock);

  while (match) {
    rules.push({
      selector: match[1],
      body: match[2],
    });
    match = rulePattern.exec(styleBlock);
  }

  return rules;
}

function extractAnimationNames(animationValue: string) {
  return animationValue
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
}

export function svgUsesOffsetPath(svgContent: string) {
  return OFFSET_PATH_PATTERN.test(svgContent);
}

export function shouldPreferLegacySvgPatch(svgContent: string) {
  if (svgUsesOffsetPath(svgContent)) {
    return Platform.OS === 'android' && Number(Platform.Version) < 29;
  }

  return false;
}

export function patchSvgForLegacyWebView(svgContent: string) {
  let patched = radToDegInCss(svgContent);
  patched = patched.replace(/translate:\s*([^;]+);/g, 'transform: translate($1);');
  patched = patched.replace(/\s*transform-box:\s*[^;]+;/g, '');
  return patchSvgSnapAnimationsToFinalFrame(patched);
}

export function patchSvgSnapAnimationsToFinalFrame(svgContent: string) {
  const styleStart = svgContent.indexOf('<style>');
  const styleEnd = svgContent.indexOf('</style>');

  if (styleStart === -1 || styleEnd === -1) {
    return svgContent;
  }

  const styleContent = svgContent.slice(styleStart + '<style>'.length, styleEnd);
  const keyframeBlocks = extractKeyframeBlocks(styleContent);
  const keyframeMap = new Map(keyframeBlocks.map((block) => [block.name, block.body]));
  const selectorRules = extractSelectorRules(styleContent);

  let patchedStyle = styleContent;

  for (const rule of selectorRules) {
    if (!/animation\s*:/i.test(rule.body)) {
      continue;
    }

    const animationMatch = rule.body.match(/animation:\s*([^;]+);/s);

    if (!animationMatch) {
      continue;
    }

    const animationNames = extractAnimationNames(animationMatch[1]);
    let finalTransform: string | null = null;
    let finalOpacity: string | null = null;

    for (const animationName of animationNames) {
      const keyframeBody = keyframeMap.get(animationName);

      if (!keyframeBody) {
        continue;
      }

      finalTransform = getKeyframeValueAt100(keyframeBody, 'transform') ?? finalTransform;
      finalOpacity = getKeyframeValueAt100(keyframeBody, 'opacity') ?? finalOpacity;
    }

    let patchedRuleBody = rule.body
      .replace(/\s*animation:\s*[^;]+;/gs, '')
      .replace(/\s*offset-path:\s*[^;]+;/g, '')
      .replace(/\s*offset-distance:\s*[^;]+;/g, '')
      .replace(/\s*offset-rotate:\s*[^;]+;/g, '')
      .replace(/\s*offset-anchor:\s*[^;]+;/g, '');

    if (finalTransform) {
      if (/transform:\s*/.test(patchedRuleBody)) {
        patchedRuleBody = patchedRuleBody.replace(/transform:\s*[^;]+;/, `transform: ${finalTransform};`);
      } else {
        patchedRuleBody += `\n  transform: ${finalTransform};`;
      }
    }

    if (finalOpacity) {
      if (/opacity:\s*/.test(patchedRuleBody)) {
        patchedRuleBody = patchedRuleBody.replace(/opacity:\s*[^;]+;/, `opacity: ${finalOpacity};`);
      } else {
        patchedRuleBody += `\n  opacity: ${finalOpacity};`;
      }
    }

    const originalRule = `${rule.selector} {${rule.body}}`;
    const patchedRule = `${rule.selector} {${patchedRuleBody}}`;
    patchedStyle = patchedStyle.replace(originalRule, patchedRule);
  }

  return `${svgContent.slice(0, styleStart + '<style>'.length)}${patchedStyle}${svgContent.slice(styleEnd)}`;
}

export function buildSvgWebViewHtml(svgContent: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
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
  <body>${svgContent}</body>
</html>`;
}

export const SVG_WEBVIEW_PROBE_SCRIPT = `
  (function () {
    function notify(type) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(type);
      }
    }

    function hasVisibleSvg() {
      var svg = document.querySelector('svg');
      if (!svg) {
        return false;
      }

      try {
        var box = svg.getBBox();
        return box.width > 0 && box.height > 0;
      } catch (error) {
        return true;
      }
    }

    function offsetPathUnsupported() {
      var style = document.createElement('div').style;
      return !('offsetPath' in style || 'webkitOffsetPath' in style);
    }

    window.setTimeout(function () {
      if (!hasVisibleSvg()) {
        notify('svg-missing');
        return;
      }

      if (offsetPathUnsupported() && document.body.innerHTML.indexOf('offset-path') !== -1) {
        notify('offset-unsupported');
      }
    }, 700);
  })();
  true;
`;
