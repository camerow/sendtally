import React from "react";
import type { ColorValue } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type IconName =
  "sessions" | "projects" | "trends" | "settings" | "funnel" | "plus" | "chevron";

const SHAPES: Record<IconName, React.ReactElement> = {
  sessions: (
    <>
      <Rect x={3.5} y={5} width={17} height={6} rx={2} />
      <Rect x={3.5} y={13} width={17} height={6} rx={2} />
    </>
  ),
  projects: <Path d="M6 20.5V4h11.5l-3 4.5 3 4.5H6" />,
  trends: <Path d="M4 16.8 9.2 10.4 13.2 13.6 20 5.8" />,
  settings: (
    <>
      <Path d="M4 8h7.4M16.6 8H20M4 16h3.4M12.6 16H20" />
      <Circle cx={14} cy={8} r={2.4} />
      <Circle cx={10} cy={16} r={2.4} />
    </>
  ),
  funnel: <Path d="M4 5h16l-6.2 7.2V18.5l-3.6 1.8v-8.1z" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  chevron: <Path d="M9 6l6 6-6 6" />,
};

export type IconProps = {
  name: IconName;
  color: ColorValue;
  size?: number;
  strokeWidth?: number;
};

export function Icon({ name, color, size = 20, strokeWidth = 1.7 }: IconProps): React.ReactElement {
  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {SHAPES[name]}
    </Svg>
  );
}
