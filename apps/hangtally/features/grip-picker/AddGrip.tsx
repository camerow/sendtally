import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";
import { findGrip } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { newId } from "../../lib/ids";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";

/**
 * "Add your own": a new name makes a custom grip; a name that exists, ignoring
 * case, picks that one, bringing it back if it had been deleted.
 */
export function AddGrip({ onAdded }: { onAdded: (gripId: string) => void }): React.ReactElement {
  const c = useTheme();
  const { model, actions } = useHangData();
  const [name, setName] = React.useState("");

  const add = (): void => {
    const trimmed = name.trim();
    if (trimmed === "") return;
    const existing = findGrip(model.grips, trimmed);
    const id = existing?.id ?? newId();
    if (existing === undefined)
      void actions.saveGrip({ id, name: trimmed, custom: true, hidden: false });
    else if (existing.hidden) void actions.saveGrip({ ...existing, hidden: false });
    setName("");
    onAdded(id);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        paddingTop: 14,
        marginTop: 6,
        borderTopWidth: 1,
        borderTopColor: c.lineLight,
      }}
    >
      <BottomSheetTextInput
        value={name}
        onChangeText={setName}
        onSubmitEditing={add}
        placeholder={t("hang.newGripPlaceholder")}
        placeholderTextColor={c.ink2}
        accessibilityLabel={t("hang.newGripName")}
        returnKeyType="done"
        maxLength={40}
        style={[
          type.body,
          {
            flex: 1,
            minWidth: 0,
            height: 50,
            paddingHorizontal: 14,
            borderRadius: 12,
            fontSize: 15,
            color: c.ink,
            backgroundColor: c.soft,
            borderWidth: 1,
            borderColor: c.lineLight,
          },
        ]}
      />
      <Button label={t("hang.add")} onPress={add} variant="ink" height={50} />
    </View>
  );
}
