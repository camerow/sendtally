import React from "react";
import Svg, { Path } from "react-native-svg";

export type HangIconName =
  | "back"
  | "forward"
  | "down"
  | "up"
  | "plus"
  | "x"
  | "check"
  | "play"
  | "restart"
  | "skip"
  | "sound"
  | "muted"
  | "edit"
  | "schedule";

const PATHS: Record<Exclude<HangIconName, "play">, string> = {
  back: "M15 5l-7 7 7 7",
  forward: "M9 5l7 7-7 7",
  down: "M6 9l6 6 6-6",
  up: "M6 15l6-6 6 6",
  plus: "M12 5v14M5 12h14",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  restart: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4",
  skip: "M6 6l8 6-8 6zM18 6v12",
  sound: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11",
  muted: "M4 9.5h3.5L12 5.5v13l-4.5-4H4zM16 9.5l5 5M21 9.5l-5 5",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  schedule:
    "M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 11h18M8 3v5M16 3v5",
};

export type HangIconProps = {
  name: HangIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
};

/** The training screens' icons, beyond the app's own set: timer controls, sound, editing. */
export function HangIcon({
  name,
  color,
  size = 18,
  strokeWidth = 2.2,
}: HangIconProps): React.ReactElement {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {name === "play" ? (
        <Path d="M7 5v14l12-7z" fill={color} />
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
