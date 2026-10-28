import React from "react";
import { Text, View } from "react-native";
import { TextInput } from "../../../components/TextInput";
import { colors } from "@sendtally/design/tokens";
import type { Grip } from "@sendtally/core/hang";
import { renameClash } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { SheetHeader } from "../components/SheetHeader";
import { SheetSection } from "../components/SheetSection";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { type } from "../type";
import { confirmDestructive } from "../../../lib/confirmDestructive";

export type GripEditSheetProps = {
  grip: Grip;
  onClose: () => void;
  onDeleted: (gripId: string) => void;
};

/** Rename a grip of the user's own, or delete it: it leaves the pickers, its history stays. */
export function GripEditSheet({
  grip,
  onClose,
  onDeleted,
}: GripEditSheetProps): React.ReactElement {
  const { model, actions } = useHangData();
  const [open, setOpen] = React.useState(true);
  const [name, setName] = React.useState(grip.name);
  const trimmed = name.trim();
  const clash = renameClash(model.grips, grip.id, trimmed);
  const taken = clash !== undefined;

  const save = (): void => {
    if (trimmed === "" || taken) return;
    if (trimmed !== grip.name) void actions.saveGrip({ ...grip, name: trimmed });
    setOpen(false);
  };
  const remove = (): void =>
    confirmDestructive({
      title: t("hang.deleteGripTitle", { grip: grip.name }),
      body: t("hang.deleteGripBody"),
      action: t("common.delete"),
      onConfirm: () => {
        void actions.deleteGrip(grip.id);
        onDeleted(grip.id);
        setOpen(false);
      },
    });

  return (
    <HangSheet visible={open} onClose={onClose} closeLabel={t("hang.cancel")}>
      <View style={{ gap: 20 }}>
        <SheetHeader
          kicker={t("hang.grip")}
          title={t("hang.editGrip")}
          action={t("hang.cancel")}
          onAction={() => setOpen(false)}
        />
        <SheetSection label={t("hang.name")}>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={save}
            accessibilityLabel={t("hang.name")}
            returnKeyType="done"
            maxLength={40}
            autoFocus
            style={[
              type.bodyBold,
              {
                height: 48,
                paddingHorizontal: 14,
                borderRadius: 12,
                fontSize: 16,
                color: colors.gunmetal,
                borderWidth: taken ? 2 : 1,
                borderColor: taken ? colors.watermelonInk : colors.lineOnLightStrong,
              },
            ]}
          />
          {taken && (
            <Text style={[type.body, { fontSize: 13, color: colors.watermelonInk }]}>
              {t("hang.gripNameTaken", { name: clash.name })}
            </Text>
          )}
        </SheetSection>
        <View style={{ gap: 6 }}>
          <Button
            label={t("hang.saveChanges")}
            onPress={save}
            variant="primary"
            height={54}
            disabled={trimmed === "" || taken}
          />
          <Button label={t("hang.deleteGrip")} onPress={remove} variant="danger" />
        </View>
      </View>
    </HangSheet>
  );
}
