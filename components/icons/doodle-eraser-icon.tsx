import Svg, { Path } from 'react-native-svg';

export function DoodleEraserIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M21 14l-9 9-9-9 9-9 9 9z" stroke="#392EFF" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
