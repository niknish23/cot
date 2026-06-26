import Svg, { Path, Rect } from 'react-native-svg';

const MAIN_BLUE = '#392EFF';

type ArrowRightBoxIconProps = {
  width?: number;
  height?: number;
};

export function ArrowRightBoxIcon({ width = 24, height = 24 }: ArrowRightBoxIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Rect x="1.5" y="1.5" width="21" height="21" rx="4.5" stroke={MAIN_BLUE} strokeWidth="1.5" />
      <Path
        d="M7.5 12H16.5M12.5 7.5L17 12L12.5 16.5"
        stroke={MAIN_BLUE}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}