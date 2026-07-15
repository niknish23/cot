const POP_IN_END_PERCENT = 7.69;

type KeyframeStep = {
  percent: number;
  transform: string;
};

type OpacityKeyframeStep = {
  percent: number;
  opacity: number;
};

export function extractKeyframeBlocks(svgContent: string) {
  const blocks: Array<{ name: string; body: string }> = [];
  const marker = '@keyframes ';
  let searchFrom = 0;

  while (true) {
    const start = svgContent.indexOf(marker, searchFrom);

    if (start === -1) {
      break;
    }

    const nameStart = start + marker.length;
    const braceStart = svgContent.indexOf('{', nameStart);

    if (braceStart === -1) {
      break;
    }

    const name = svgContent.slice(nameStart, braceStart).trim();
    let depth = 0;
    let body = '';

    for (let index = braceStart; index < svgContent.length; index += 1) {
      const char = svgContent[index];

      if (char === '{') {
        depth += 1;
        if (depth > 1) {
          body += char;
        }
        continue;
      }

      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          blocks.push({ name, body });
          searchFrom = index + 1;
          break;
        }
        body += char;
        continue;
      }

      if (depth > 0) {
        body += char;
      }
    }

    if (depth !== 0) {
      break;
    }
  }

  return blocks;
}

function extractTransformKeyframeSteps(keyframesBlock: string): KeyframeStep[] {
  const stepPattern = /([\d.]+)%\s*\{[^}]*?transform:\s*([^;]+);/gs;
  const steps: KeyframeStep[] = [];
  let match = stepPattern.exec(keyframesBlock);

  while (match) {
    steps.push({
      percent: Number(match[1]),
      transform: match[2].trim(),
    });
    match = stepPattern.exec(keyframesBlock);
  }

  return steps;
}

function extractOpacityKeyframeSteps(keyframesBlock: string): OpacityKeyframeStep[] {
  const stepPattern = /([\d.]+)%\s*\{[^}]*?opacity:\s*([^;]+);/gs;
  const steps: OpacityKeyframeStep[] = [];
  let match = stepPattern.exec(keyframesBlock);

  while (match) {
    steps.push({
      percent: Number(match[1]),
      opacity: Number(match[2].trim()),
    });
    match = stepPattern.exec(keyframesBlock);
  }

  return steps;
}

function formatTransformKeyframes(name: string, steps: KeyframeStep[]) {
  const body = steps
    .map((step) => `  ${step.percent}% {\n    transform: ${step.transform};\n  }`)
    .join('\n');

  return `@keyframes ${name} {\n${body}\n}`;
}

function formatOpacityKeyframes(name: string, steps: OpacityKeyframeStep[]) {
  const body = steps
    .map((step) => `  ${step.percent}% {\n    opacity: ${step.opacity};\n  }`)
    .join('\n');

  return `@keyframes ${name} {\n${body}\n}`;
}

function hasPopInTransform(steps: KeyframeStep[]) {
  return steps.some((step) => step.percent === 0 && /scaleX\(0\)\s*scaleY\(0\)/.test(step.transform));
}

function buildPopInKeyframes(name: string, steps: KeyframeStep[], popInEndPercent: number) {
  const popInSteps = steps
    .filter((step) => step.percent <= popInEndPercent)
    .map((step) => ({
      percent: Number(((step.percent / popInEndPercent) * 100).toFixed(2)),
      transform: step.transform,
    }));

  return formatTransformKeyframes(`${name}_popin`, popInSteps);
}

function buildFloatKeyframes(name: string, steps: KeyframeStep[], popInEndPercent: number) {
  const floatSteps = steps
    .filter((step) => step.percent >= popInEndPercent)
    .map((step) => ({
      percent: Number((((step.percent - popInEndPercent) / (100 - popInEndPercent)) * 100).toFixed(2)),
      transform: step.transform,
    }));

  return formatTransformKeyframes(`${name}_float`, floatSteps);
}

function buildOpacityLoopKeyframes(name: string, steps: OpacityKeyframeStep[], loopStartPercent: number) {
  const loopSteps = steps
    .filter((step) => step.percent >= loopStartPercent)
    .map((step) => ({
      percent: Number((((step.percent - loopStartPercent) / (100 - loopStartPercent)) * 100).toFixed(2)),
      opacity: step.opacity,
    }));

  return formatOpacityKeyframes(`${name}_loop`, loopSteps);
}

function getAnimationDuration(svgContent: string) {
  const match = svgContent.match(/animation:\s*[^;]+?\s+(\d+(?:\.\d+)?)s\s+linear\s+infinite/i);

  return match ? Number(match[1]) : null;
}

export function patchOnboardingAnimationFreezeLastFrame(svgContent: string) {
  return svgContent.replace(/(\d+(?:\.\d+)?s)\s+linear\s+infinite/g, '$1 linear 1 forwards');
}

export function patchOnboardingAnimationLoop(svgContent: string) {
  const duration = getAnimationDuration(svgContent);

  if (!duration) {
    return svgContent;
  }

  const keyframeBlocks = extractKeyframeBlocks(svgContent);
  const hasPopInAnimation = keyframeBlocks.some(({ body }) =>
    hasPopInTransform(extractTransformKeyframeSteps(body)),
  );

  if (!hasPopInAnimation) {
    return svgContent;
  }

  const popInDurationS = duration * (POP_IN_END_PERCENT / 100);
  const loopDurationS = duration * ((100 - POP_IN_END_PERCENT) / 100);
  const extraKeyframes: string[] = [];

  for (const { name, body } of keyframeBlocks) {
    const transformSteps = extractTransformKeyframeSteps(body);

    if (transformSteps.length > 0 && hasPopInTransform(transformSteps)) {
      extraKeyframes.push(buildPopInKeyframes(name, transformSteps, POP_IN_END_PERCENT));
      extraKeyframes.push(buildFloatKeyframes(name, transformSteps, POP_IN_END_PERCENT));
      continue;
    }

    const opacitySteps = extractOpacityKeyframeSteps(body);

    if (opacitySteps.length > 0 && name.includes('opacity')) {
      const loopStartPercent = Math.max(...opacitySteps.filter((step) => step.percent < 100).map((step) => step.percent));
      extraKeyframes.push(buildOpacityLoopKeyframes(name, opacitySteps, loopStartPercent));
    }
  }

  let patchedSvg = svgContent.replace(
    /animation:\s*(kf_[^\s;]+)\s+(\d+(?:\.\d+)?)s\s+linear\s+infinite;/g,
    (match, keyframeName: string, animationDuration: string) => {
      if (Number(animationDuration) !== duration) {
        return match;
      }

      const block = keyframeBlocks.find(({ name }) => name === keyframeName);

      if (!block) {
        return match;
      }

      const transformSteps = extractTransformKeyframeSteps(block.body);

      if (transformSteps.length > 0 && hasPopInTransform(transformSteps)) {
        return `animation: ${keyframeName}_popin ${popInDurationS}s linear forwards, ${keyframeName}_float ${loopDurationS}s linear ${popInDurationS}s infinite;`;
      }

      if (keyframeName.includes('opacity')) {
        const opacitySteps = extractOpacityKeyframeSteps(block.body);
        const loopStartPercent = Math.max(
          ...opacitySteps.filter((step) => step.percent < 100).map((step) => step.percent),
        );

        return `animation: ${keyframeName} ${popInDurationS}s linear forwards, ${keyframeName}_loop ${loopDurationS}s linear ${popInDurationS}s infinite;`;
      }

      return match;
    },
  );

  patchedSvg = patchedSvg.replace(
    /animation:\s*\n\s*(kf_[^\s]+)\s+(\d+(?:\.\d+)?)s\s+linear\s+infinite,\s*\n\s*(kf_[^\s]+)\s+(\d+(?:\.\d+)?)s\s+linear\s+infinite;/g,
    (match, transformName: string, transformDuration: string, opacityName: string, opacityDuration: string) => {
      if (Number(transformDuration) !== duration || Number(opacityDuration) !== duration) {
        return match;
      }

      const transformBlock = keyframeBlocks.find(({ name }) => name === transformName);

      if (!transformBlock || !hasPopInTransform(extractTransformKeyframeSteps(transformBlock.body))) {
        return `animation:\n    ${transformName} ${duration}s linear infinite,\n    ${opacityName} ${duration}s linear infinite;`;
      }

      return `animation:\n    ${transformName}_popin ${popInDurationS}s linear forwards,\n    ${transformName}_float ${loopDurationS}s linear ${popInDurationS}s infinite,\n    ${opacityName} ${popInDurationS}s linear forwards,\n    ${opacityName}_loop ${loopDurationS}s linear ${popInDurationS}s infinite;`;
    },
  );

  if (extraKeyframes.length > 0) {
    patchedSvg = patchedSvg.replace('</style>', `${extraKeyframes.join('\n')}\n</style>`);
  }

  return patchedSvg;
}

export function getAnimationAspectRatio(svgContent: string) {
  const match = svgContent.match(/<svg[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/);

  if (!match) {
    return 445 / 393;
  }

  return Number(match[2]) / Number(match[1]);
}
