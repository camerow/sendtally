import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { SheetHeader } from "../../components/SheetHeader";
import { AccountSetting } from "./AccountSetting";
import { RemindersSetting } from "./RemindersSetting";
import { StravaSetting } from "./StravaSetting";
import { ThemePicker } from "./ThemePicker";
import { UnitsSetting } from "./UnitsSetting";

export type SettingsSheetProps = { visible: boolean; onClose: () => void };

export function SettingsSheet({ visible, onClose }: SettingsSheetProps): React.ReactElement | null {
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("hang.closeSettings")}>
      <View style={{ gap: 22 }}>
        <SheetHeader
          kicker={t("common.account")}
          title={t("hang.settings")}
          action={t("hang.done")}
          onAction={onClose}
        />
        <ThemePicker />
        <UnitsSetting />
        <RemindersSetting />
        <StravaSetting />
        <AccountSetting />
      </View>
    </Sheet>
  );
}
