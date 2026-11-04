import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";
import { useLiveSession } from "@sendtally/features/log-session";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { UpdateReadyCard } from "./UpdateReadyCard";
import { useUpdateRestart } from "./useUpdateRestart";

/**
 * Floats the restart offer over whatever screen is up, native stack screens included, which a
 * plain sibling view sits under on iOS; `hidden` keeps it off a live workout. Mounted once for
 * the whole app, so a dismissal holds on every screen.
 *
 * The overlay is its own UIWindow above the app, and only exists while there is a card in it:
 * an empty one left mounted hides every screen underneath from XCUITest, so Maestro finds nothing.
 */
export function UpdateReadyOverlay({ hidden }: { hidden: boolean }): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const live = useLiveSession(liveSessionStorage);
  const { pendingUpdateId, restarting, restart } = useUpdateRestart();
  const [dismissedId, setDismissedId] = React.useState<string | null>(null);
  if (hidden || pendingUpdateId === null || pendingUpdateId === dismissedId) return null;
  return (
    <FullWindowOverlay>
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", top: insets.top + 4, left: 0, right: 0 }}
      >
        <UpdateReadyCard
          liveSession={live.stored !== null}
          restarting={restarting}
          onRestart={restart}
          onDismiss={() => setDismissedId(pendingUpdateId)}
        />
      </View>
    </FullWindowOverlay>
  );
}
