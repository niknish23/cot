import Svg, { Path } from 'react-native-svg';

type ArrowRightIconProps = {
  width?: number;
  height?: number;
};

export function ArrowRightIcon({ width = 25, height = 14 }: ArrowRightIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 25 14" fill="none">
      <Path
        d="M0.75 6.49268C2.5861 6.49268 5.80601 6.59796 7.09237 6.67852C8.90957 6.79232 10.6975 6.917 16.104 6.94492C17.9764 6.95459 19.0396 6.70643 21.3906 6.62588C21.9037 6.59955 22.1397 6.54691 22.5268 6.51979C22.9139 6.49268 23.4449 6.49268 23.9919 6.49268"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M17.6592 0.75C18.9864 1.81083 19.9404 2.66108 20.7141 3.4587C21.4878 4.25633 22.1226 4.8944 22.8939 5.5333C23.2556 5.83289 23.6126 6.17219 23.879 6.51676C24.3892 7.17672 23.0319 8.13592 22.4736 9.06833C22.0205 10.0534 21.5962 10.9021 21.3027 11.7539C21.2229 11.9677 21.1176 12.1782 20.8496 12.3952"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}