import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { EntryKind } from "@sendtally/features/journal";

const PATHS: Record<EntryKind, React.ReactElement> = {
  journal: (
    <>
      <Path d="M4.4 3.6h8.2l3 3v9.8H4.4z" />
      <Path d="M7.1 8.2h5.8M7.1 11h5.8M7.1 13.8h3.2" />
    </>
  ),
  trip: (
    <>
      <Path d="M10 17.4s5.1-4.6 5.1-8.3a5.1 5.1 0 0 0-10.2 0c0 3.7 5.1 8.3 5.1 8.3z" />
      <Circle cx={10} cy={9.1} r={1.9} />
    </>
  ),
  injury: (
    <>
      <Rect x={2.4} y={7.2} width={15.2} height={5.6} rx={2.8} transform="rotate(-45 10 10)" />
      <Path d="M8.7 10h0M10 8.7h0M10 11.3h0M11.3 10h0" />
    </>
  ),
};

export function EntryKindIcon({
  kind,
  color,
  size = 22,
}: {
  kind: EntryKind;
  color: string;
  size?: number;
}): React.ReactElement {
  return (
    <Svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[kind]}
    </Svg>
  );
}
