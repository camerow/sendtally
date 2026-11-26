import React from "react";
import { View } from "react-native";

/**
 * As many of `rows` as fit whole in the height it is given, from the top or centred; the rest
 * stay out of sight. The rows take no height of their own, so they never make their card taller.
 */
export function WholeRows({
  rows,
  center = false,
}: {
  rows: readonly React.ReactNode[];
  center?: boolean;
}): React.ReactElement {
  const [room, setRoom] = React.useState(0);
  const [bottoms, setBottoms] = React.useState<readonly number[]>([]);
  const fits = (i: number): boolean => (bottoms[i] ?? Number.POSITIVE_INFINITY) <= room;
  const shown = rows.findIndex((_, i) => !fits(i));
  const count = shown === -1 ? rows.length : shown;
  const used = count === 0 ? 0 : (bottoms[count - 1] ?? 0);
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
          top: center ? Math.max(0, (room - used) / 2) : 0,
        }}
      >
        {rows.map((row, i) => (
          <View
            key={i}
            style={{ opacity: i < count ? 1 : 0 }}
            onLayout={(e) => {
              const { y, height } = e.nativeEvent.layout;
              setBottoms((b) => {
                if (b[i] === y + height) return b;
                const next = [...b];
                next[i] = y + height;
                return next;
              });
            }}
          >
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}
