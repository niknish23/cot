import Svg, { Path } from 'react-native-svg';

type CheckMarkIconProps = {
  width?: number;
  height?: number;
};

export function CheckMarkIcon({ width = 21, height = 17 }: CheckMarkIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 21 17" fill="none">
      <Path
        d="M1 11.3222C2.79111 12.9199 3.4686 13.5 4.31618 14.3236C5.02112 15.0086 5.50541 15.3914 5.8914 15.4416C7.35272 15.6315 7.53931 13.5552 8.09685 12.659C8.99188 11.2202 9.81601 10.7435 10.5916 9.89669C11.8787 8.49142 13.058 7.26017 14.4908 5.77872C16.3582 4.05885 17.6172 2.41021 18.5637 1.7051C18.7832 1.53501 18.9751 1.3431 19.4636 1"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}