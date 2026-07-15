import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const DESIGN_WIDTH = 393;
export const DESIGN_HEIGHT = 844;
export const MAX_LAYOUT_SCALE = 1.35;
export const BOTTOM_NAV_GAP_ABOVE_SYSTEM = 10;

export function getLayoutScale(width: number, height?: number, designWidth = DESIGN_WIDTH) {
  const widthScale = width / designWidth;

  if (height) {
    return Math.min(widthScale, height / DESIGN_HEIGHT, MAX_LAYOUT_SCALE);
  }

  return Math.min(widthScale, MAX_LAYOUT_SCALE);
}

export function useResponsiveLayout(designWidth = DESIGN_WIDTH) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = getLayoutScale(width, height, designWidth);
  const contentMaxWidth = designWidth * scale;
  const bottomNavOffset = insets.bottom + BOTTOM_NAV_GAP_ABOVE_SYSTEM;
  const bottomNavHeight = 79 * scale;
  const bottomContentPadding = bottomNavHeight + bottomNavOffset + 16;

  return {
    width,
    height,
    scale,
    contentMaxWidth,
    insets,
    bottomNavOffset,
    bottomNavHeight,
    bottomContentPadding,
    horizontalPadding: 32 * scale,
    headerHeight: 53 * scale,
  };
}
