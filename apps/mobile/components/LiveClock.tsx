import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { durationLabel, elapsedClock } from "@sendtally/features/sessions";

export type LiveClockProps = {
  /** Seconds since the start, at a moment. */
  elapsed: (now: Date) => number;
  style: StyleProp<TextStyle>;
};

/** A running clock, worked out from its start every second; read aloud in minutes. */
export function LiveClock({ elapsed, style }: LiveClockProps): React.ReactElement {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = elapsed(now);
  return (
    <Text
      accessibilityLabel={durationLabel(Math.floor(seconds / 60))}
      style={[style, { fontVariant: ["tabular-nums"] }]}
    >
      {elapsedClock(seconds)}
    </Text>
  );
}
