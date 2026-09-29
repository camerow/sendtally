import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export type MarkProps = { size: number; plate: string; ink: string; label?: string };

/** Three tally dots hanging from an edge. */
export function Mark({ size, plate, ink, label }: MarkProps): React.ReactElement {
  return (
    <Svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      accessible={label !== undefined}
      accessibilityLabel={label}
    >
      <Rect width={32} height={32} rx={8} fill={plate} />
      <Path
        d="M6 8.5h20M9.5 8.5V14M16 8.5v10M22.5 8.5V23"
        fill="none"
        stroke={ink}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Circle cx={9.5} cy={14} r={3.1} fill={ink} />
      <Circle cx={16} cy={18.5} r={3.1} fill={ink} />
      <Circle cx={22.5} cy={23} r={3.1} fill={ink} />
    </Svg>
  );
}
