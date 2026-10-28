import React from "react";
import type { ColorValue } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type IconName =
  | "sessions"
  | "projects"
  | "climbs"
  | "funnel"
  | "plus"
  | "chevron"
  | "check"
  | "trash"
  | "lock"
  | "refresh"
  | "endurance"
  | "today"
  | "train"
  | "climb"
  | "hang"
  | "pencil"
  | "search"
  | "more"
  | "stop"
  | "x";

const SHAPES: Record<IconName, React.ReactElement> = {
  sessions: (
    <>
      <Rect x={3.5} y={5} width={17} height={6} rx={2} />
      <Rect x={3.5} y={13} width={17} height={6} rx={2} />
    </>
  ),
  projects: <Path d="M6 20.5V4h11.5l-3 4.5 3 4.5H6" />,
  climbs: <Path d="M3 19l6.5-11 4 6.5 2.5-3.5L21 19z" />,
  funnel: <Path d="M4 5h16l-6.2 7.2V18.5l-3.6 1.8v-8.1z" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  chevron: <Path d="M9 6l6 6-6 6" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7" />,
  lock: (
    <>
      <Rect x="5" y="11" width="14" height="9.5" rx="2" />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  trash: <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  refresh: (
    <Path d="M20 11a8 8 0 0 0-14.6-4.5M4 4.5V9h4.5M4 13a8 8 0 0 0 14.6 4.5M20 19.5V15h-4.5" />
  ),
  endurance: (
    <Path d="M2 9c2.5-3 5-3 7.5 0S15 12 17.5 9 21 6 22 7M2 17c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-3 4.5-2" />
  ),
  today: (
    <Path d="M5 6.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1zM4 10.5h16M8.5 4v4M15.5 4v4" />
  ),
  train: <Path d="M3.5 5h17v5.5h-17zM7 7.75h3M14 7.75h3M9 10.5V20M15 10.5V20" />,
  climb: (
    <>
      <Path d="M7 17 17 7" />
      <Circle cx={7} cy={17} r={2.2} />
      <Circle cx={12} cy={12} r={2.2} />
      <Circle cx={17} cy={7} r={2.2} />
    </>
  ),
  hang: (
    <>
      <Path d="M4 5h16M8 5v4M12 5v6M16 5v8" />
      <Circle cx={8} cy={11} r={2} />
      <Circle cx={12} cy={13} r={2} />
      <Circle cx={16} cy={15} r={2} />
    </>
  ),
  pencil: <Path d="M5 19h4L19 9l-4-4L5 15zM13.5 6.5l4 4" />,
  search: <Path d="M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM20 20l-4.5-4.5" />,
  more: <Path d="M6 12h.01M12 12h.01M18 12h.01" />,
  stop: <Rect x={7} y={7} width={10} height={10} rx={1.5} />,
  x: <Path d="M6 6l12 12M18 6L6 18" />,
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
