import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

import { DOODLE_ERASER_COLOR, getStrokeDisplayColor } from '@/constants/doodle';
import type { DoodleStroke } from '@/lib/doodle-store';

type DoodlePreviewProps = {
  strokes: DoodleStroke[];
  width?: number;
  height?: number;
  padding?: number;
  strokeColor?: string;
  backgroundColor?: string;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return '';
  }

  const [firstPoint, ...rest] = points;
  return `M ${firstPoint.x} ${firstPoint.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(' ')}`;
}

function getBounds(strokes: DoodleStroke[]): Bounds | null {
  if (strokes.length === 0) {
    return null;
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  strokes.forEach((stroke) => {
    stroke.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

export function DoodlePreview({
  strokes,
  width = 117.37,
  height = 117.37,
  padding = 12,
  strokeColor,
  backgroundColor = DOODLE_ERASER_COLOR,
}: DoodlePreviewProps) {
  const layout = useMemo(() => {
    const bounds = getBounds(strokes);

    if (!bounds) {
      return null;
    }

    const contentWidth = Math.max(bounds.maxX - bounds.minX, 1);
    const contentHeight = Math.max(bounds.maxY - bounds.minY, 1);
    const usableWidth = Math.max(width - padding * 2, 1);
    const usableHeight = Math.max(height - padding * 2, 1);
    const scale = Math.min(usableWidth / contentWidth, usableHeight / contentHeight);
    const scaledWidth = contentWidth * scale;
    const scaledHeight = contentHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    return { bounds, scale, offsetX, offsetY };
  }, [height, padding, strokes, width]);

  if (!layout) {
    return <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" />;
  }

  const { bounds, scale, offsetX, offsetY } = layout;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {strokes.map((stroke, index) => {
        const translatedPoints = stroke.points.map((point) => ({
          x: offsetX + (point.x - bounds.minX) * scale,
          y: offsetY + (point.y - bounds.minY) * scale,
        }));

        return (
          <Path
            key={`${index}-${stroke.points.length}`}
            d={pointsToPath(translatedPoints)}
            stroke={getStrokeDisplayColor(stroke, backgroundColor, strokeColor)}
            strokeWidth={Math.max(stroke.width * scale, 1)}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      })}
    </Svg>
  );
}
