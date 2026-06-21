import Svg, { Path } from 'react-native-svg';

export function DoodlePencilIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21l3-1 11-11 1-3-3 1L4 17z" stroke="#392EFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
