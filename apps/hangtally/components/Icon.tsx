import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export type IconName =
  | "schedule"
  | "workouts"
  | "trends"
  | "back"
  | "forward"
  | "down"
  | "plus"
  | "x"
  | "check"
  | "play"
  | "restart"
  | "skip"
  | "sound"
  | "muted"
  | "edit";

const SCHEDULE =
  "M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 11h18M8 3v5M16 3v5";

const PATHS: Record<Exclude<IconName, "workouts" | "play">, string> = {
  schedule: SCHEDULE,
  trends: "M3 17l6-6 4 4 8-8M15 7h6v6",
  back: "M15 5l-7 7 7 7",
  forward: "M9 5l7 7-7 7",
  down: "M6 9l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  restart: "M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4",
  skip: "M6 5l9 7-9 7zM18 5v14",
  sound: "M4 9h4l5-4v14l-5-4H4zM17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12",
  muted: "M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
};

export type IconProps = { name: IconName; color: string; size?: number; strokeWidth?: number };

export function Icon({ name, color, size = 18, strokeWidth = 2.2 }: IconProps): React.ReactElement {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {name === "play" ? (
        <Path d="M7 5v14l12-7z" fill={color} />
      ) : name === "workouts" ? (
        <>
          <Path
            d="M3 5h18M6 5v4M12 5v8M18 5v12"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx={6} cy={11} r={2} fill={color} />
          <Circle cx={12} cy={15} r={2} fill={color} />
          <Circle cx={18} cy={19} r={2} fill={color} />
        </>
      ) : (
        <Path
          d={PATHS[name]}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}
