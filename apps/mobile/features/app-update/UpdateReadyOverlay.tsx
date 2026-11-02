import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";
import { useLiveSession } from "@sendtally/features/log-session";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { UpdateReadyCard } from "./UpdateReadyCard";

/**
 * Floats the restart offer over whatever screen is up, native stack screens included, which a
 * plain sibling view sits under on iOS; `hidden` keeps it off a live workout.
 */
export function UpdateReadyOverlay({ hidden }: { hidden: boolean }): React.ReactElement {
  const insets = useSafeAreaInsets();
  const live = useLiveSession(liveSessionStorage);
  return (
    <FullWindowOverlay>
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", top: insets.top + 4, left: 0, right: 0 }}
      >
        <UpdateReadyCard liveSession={live.stored !== null} hidden={hidden} />
      </View>
    </FullWindowOverlay>
  );
}
