import React from "react";
import { Pressable, Text } from "react-native";
import type { HangKind, HangSetup } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { SetupFields } from "../setup/SetupFields";
import { type } from "../type";

export type SetupPillProps = {
  kind: HangKind;
  setup: HangSetup;
  /** Over the sheet, such as the grip. */
  kicker: string;
  onChange: (setup: HangSetup) => void;
};

/** The edge and weight a hang ran on, as one pill on its card; tap it to change them for this log. */
export function SetupPill({ kind, setup, kicker, onChange }: SetupPillProps): React.ReactElement {
  const { model } = useHangData();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("hang.changeSetup")}
        style={press({
          alignSelf: "flex-start",
          height: 32,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          marginBottom: 6,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
        })}
      >
        <Text style={[type.mono, { fontSize: 12.5, color: colors.gunmetal }]}>
          {setupLabel(kind, setup, model.settings.units)}
        </Text>
        <HangIcon name="edit" color={colors.textSecondary} size={13} strokeWidth={1.8} />
      </Pressable>
      {open && (
        <HangSheet visible onClose={() => setOpen(false)} closeLabel={t("common.done")}>
          <SheetHeader
            kicker={kicker}
            title={t("hang.edgeAndWeight")}
            action={t("common.done")}
            onAction={() => setOpen(false)}
          />
          <SetupFields kind={kind} setup={setup} onChange={onChange} />
        </HangSheet>
      )}
    </>
  );
}
