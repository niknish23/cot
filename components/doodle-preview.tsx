import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { DoodleStroke } from '@/lib/doodle-store';

type Props = { strokes: DoodleStroke[]; width?: number; height?: number; padding?: number };

export function DoodlePreview({ strokes, width = 100, height = 100, padding = 8 }: Props) {
  const viewBoxSize = 512;
  return (
    <View style={{ width, height, padding }}>
      <Svg width={width} height={height} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} preserveAspectRatio="xMidYMid meet">
        {strokes.map((stroke, i) => (
          <Path
            key={i}
            d={stroke.points.length ? `M ${stroke.points[0].x} ${stroke.points[0].y} ${stroke.points
              .slice(1)
              .map((p) => `L ${p.x} ${p.y}`)
              .join(' ')}` : ''}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}
