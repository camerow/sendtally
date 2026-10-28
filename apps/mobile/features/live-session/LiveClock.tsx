import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import {
  durationLabel,
  tallyClock,
  tallyElapsedSeconds,
  type LogSessionDraft,
} from "@sendtally/features/log-session";

export type LiveClockProps = {
  draft: LogSessionDraft;
  style: StyleProp<TextStyle>;
};

/** The running session time, worked out from its start every second; read aloud in minutes. */
export function LiveClock({ draft, style }: LiveClockProps): React.ReactElement {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = tallyElapsedSeconds(draft, now);
  return (
    <Text
      accessibilityLabel={durationLabel(Math.floor(seconds / 60))}
      style={[style, { fontVariant: ["tabular-nums"] }]}
    >
      {tallyClock(seconds)}
    </Text>
  );
}
