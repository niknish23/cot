import Svg, { Path } from 'react-native-svg';

export function MoreIcon({ width = 20, height = 20 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6v.01M12 12v.01M12 18v.01" stroke="#000" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
