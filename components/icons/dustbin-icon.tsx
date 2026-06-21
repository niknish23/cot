import Svg, { Path } from 'react-native-svg';

export function DustbinIcon({ width = 20, height = 20 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="#000" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
