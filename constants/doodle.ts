export const DOODLE_COORDINATE_SIZE = 353;
export const EDITOR_CANVAS_SIZE = DOODLE_COORDINATE_SIZE;
export const DOODLE_CANVAS_COLOR = '#F7F7F7';
export const DOODLE_PEN_COLOR = '#392EFF';
export const DOODLE_ERASER_COLOR = '#FFFFFF';
export const DOODLE_PEN_WIDTH = 8;
export const DOODLE_ERASER_WIDTH = 14;

type StrokeColorSource = {
  color: string;
  width?: number;
  points?: Array<{ x: number; y: number }>;
};

export function isEraserStroke(stroke: StrokeColorSource) {
  const normalized = stroke.color.toLowerCase();
  return normalized === '#ffffff' || normalized === '#f7f7f7' || normalized === 'white';
}

export function getStrokeDisplayColor(
  stroke: StrokeColorSource,
  backgroundColor: string,
  penColorOverride?: string,
) {
  if (isEraserStroke(stroke)) {
    return backgroundColor;
  }

  return penColorOverride ?? stroke.color;
}

export function normalizeDoodleStroke<T extends StrokeColorSource & { width: number; points: Array<{ x: number; y: number }> }>(
  stroke: T,
): T {
  if (!isEraserStroke(stroke)) {
    return stroke;
  }

  return {
    ...stroke,
    color: DOODLE_ERASER_COLOR,
    width: DOODLE_ERASER_WIDTH,
  };
}

export function normalizeDoodleStrokes<T extends StrokeColorSource & { width: number; points: Array<{ x: number; y: number }> }>(
  strokes: T[],
) {
  return strokes.map(normalizeDoodleStroke);
}
