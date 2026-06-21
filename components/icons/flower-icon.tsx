import Svg, { Path } from 'react-native-svg';

const MAIN_BLUE = '#392EFF';

export function FlowerIcon({ width = 24, height = 24 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path d="M12 7c1.5-3 4-3 4-3s1 2 0 3-2 1-2 1 1 2 0 3-3 0-3 0-2 1-3 0 0-3 0-3-1-1-2-1 0-3 0-3 2 0 4 3z" stroke={MAIN_BLUE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
