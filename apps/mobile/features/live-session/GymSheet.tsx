import React from "react";
import { View } from "react-native";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { OptionRow } from "../../components/OptionRow";
import { Sheet } from "../../components/Sheet";

export type GymSheetProps = {
  visible: boolean;
  gyms: readonly Gym[];
  gymId: string | undefined;
  onPick: (gymId: string | undefined) => void;
  onClose: () => void;
};

export function GymSheet({
  visible,
  gyms,
  gymId,
  onPick,
  onClose,
}: GymSheetProps): React.ReactElement {
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("common.cancel")}>
      <View style={{ gap: 2, paddingHorizontal: 12, paddingBottom: 8 }}>
        {gyms.map((gym) => (
          <OptionRow
            key={gym.id}
            label={gym.name}
            mono={false}
            selected={gym.id === gymId}
            onPress={() => onPick(gym.id)}
          />
        ))}
        <OptionRow
          label={t("gyms.noGym")}
          mono={false}
          selected={gymId === undefined}
          onPress={() => onPick(undefined)}
        />
      </View>
    </Sheet>
  );
}
