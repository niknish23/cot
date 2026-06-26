import Svg, { Path } from 'react-native-svg';

const MAIN_BLUE = '#392EFF';

type CrossButtonIconProps = {
  width?: number;
  height?: number;
};

export function CrossButtonIcon({ width = 28, height = 28 }: CrossButtonIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 28 28" fill="none">
      <Path
        d="M9.23779 7.5957C9.99977 8.24928 11.5302 9.77648 14.2086 13.4385C15.143 14.7029 16.1283 16.5586 17.2219 18.9101C17.6653 19.8527 17.8821 20.2863 19.0907 21.0614"
        stroke={MAIN_BLUE}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M8.90918 20.7331C9.34271 19.7543 11.09 17.3502 12.517 15.4847C13.9412 13.6229 15.2545 11.6552 16.7308 9.62882C17.1167 9.13288 17.4418 8.69935 17.7719 8.25926C18.102 7.81916 18.4271 7.38563 19.0905 6.93896"
        stroke={MAIN_BLUE}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}