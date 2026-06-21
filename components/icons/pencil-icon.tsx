import Svg, { Path } from 'react-native-svg';

export function PencilIcon({ width = 24, height = 24, color = '#392EFF' }: { width?: number; height?: number; color?: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21l3-1 11-11 1-3-3 1L4 17z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
