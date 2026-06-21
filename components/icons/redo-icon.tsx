import Svg, { Path } from 'react-native-svg';

export function RedoIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M21 7v6h-6" stroke="#392EFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 17a9 9 0 0114-6l4 4" stroke="#392EFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
