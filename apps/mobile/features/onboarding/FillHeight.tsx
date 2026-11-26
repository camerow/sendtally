import React from "react";
import { View } from "react-native";

type Drawn = { size: number; height: number };

/**
 * Fills the height it is given with a picture by sizing one piece of it: the picture is drawn
 * at `size`, measured, and drawn again with the size that makes it fit, between `min` and `max`.
 * The picture takes no height of its own, so it never makes its card taller.
 */
export function FillHeight({
  min,
  max = Number.POSITIVE_INFINITY,
  children,
}: {
  min: number;
  max?: number;
  children: (size: number) => React.ReactNode;
}): React.ReactElement {
  const [room, setRoom] = React.useState<number | null>(null);
  const [drawn, setDrawn] = React.useState<Drawn | null>(null);
  const fit = room === null || drawn === null ? null : drawn.size + room - drawn.height;
  const size = fit === null ? min : Math.floor(Math.min(max, Math.max(min, fit)));
  const height = drawn === null ? 0 : drawn.height + size - drawn.size;
  return (
    <View
      style={{ flex: 1, overflow: "hidden" }}
      onLayout={(e) => setRoom(e.nativeEvent.layout.height)}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: room === null ? 0 : Math.max(0, (room - height) / 2),
        }}
        onLayout={(e) => {
          const measured = e.nativeEvent.layout.height;
          setDrawn((d) =>
            d?.size === size && d.height === measured ? d : { size, height: measured }
          );
        }}
      >
        {children(size)}
      </View>
    </View>
  );
}
