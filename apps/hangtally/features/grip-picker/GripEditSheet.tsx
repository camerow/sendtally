import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { Alert, Text, View } from "react-native";
import type { Grip } from "@sendtally/core/hang";
import { renameClash } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { SheetHeader } from "../../components/SheetHeader";
import { SheetSection } from "../../components/SheetSection";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";

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
  const c = useTheme();
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
    Alert.alert(t("hang.deleteGripTitle", { grip: grip.name }), t("hang.deleteGripBody"), [
      { text: t("hang.cancel"), style: "cancel" },
      {
        text: t("hang.delete"),
        style: "destructive",
        onPress: () => {
          void actions.deleteGrip(grip.id);
          onDeleted(grip.id);
          setOpen(false);
        },
      },
    ]);

  return (
    <Sheet visible={open} onClose={onClose} closeLabel={t("hang.cancel")}>
      <View style={{ gap: 22 }}>
        <SheetHeader
          kicker={t("hang.grip")}
          title={t("hang.editGrip")}
          action={t("hang.cancel")}
          onAction={() => setOpen(false)}
        />
        <SheetSection label={t("hang.name")}>
          <BottomSheetTextInput
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
                height: 50,
                paddingHorizontal: 14,
                borderRadius: 12,
                fontSize: 16,
                color: c.ink,
                backgroundColor: c.soft,
                borderWidth: 1,
                borderColor: taken ? c.ink : c.lineLight,
              },
            ]}
          />
          {taken && (
            <Text style={[type.body, { fontSize: 13, color: c.ink2 }]}>
              {t("hang.gripNameTaken", { name: clash.name })}
            </Text>
          )}
        </SheetSection>
        <View style={{ gap: 10 }}>
          <Button
            label={t("hang.saveChanges")}
            onPress={save}
            variant="ink"
            height={54}
            disabled={trimmed === "" || taken}
          />
          <Button label={t("hang.deleteGrip")} onPress={remove} variant="outlineLight" />
        </View>
      </View>
    </Sheet>
  );
}
