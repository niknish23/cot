import Svg, { Path } from 'react-native-svg';

type PlusIconProps = {
  width?: number;
  height?: number;
  color?: string;
};

export function PlusIcon({ width = 32, height = 32, color = '#FFFFFF' }: PlusIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 32 32" fill="none">
      <Path d="M15.292 9.62885C15.4477 11.1862 15.6035 12.7436 15.6837 14.8308C15.7639 16.9179 15.7639 19.4876 15.7639 22.3712" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M7.97705 15.764C8.44427 15.8419 8.91148 15.9198 11.2936 15.9599C13.6757 16 17.9585 16 20.3206 16.0389C22.6826 16.0779 22.9941 16.1557 24.0229 16.4719" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}