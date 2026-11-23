import React from "react";
import { Text, View } from "react-native";
import { MAX_CHECKLIST_LINE, MAX_CHECKLIST_LINES, type Item } from "@sendtally/core/hang";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { withLineAfter, withLineTyped } from "@sendtally/features/workouts";
import { useLineKeys } from "@sendtally/features/workouts";
import { TextInput } from "../../../components/TextInput";
import { IconButton } from "../components/IconButton";
import { type } from "../type";

export type ChecklistEditorProps = {
  item: Item;
  /** Applied to the item as it is when it runs, so a keystroke and a return in one beat both land. */
  onChange: (update: (item: Item) => Item) => void;
  onRemove: () => void;
  /** Absent for the first item. */
  onMoveUp?: () => void;
  /** Absent for the last item. */
  onMoveDown?: () => void;
};

/** A checklist's lines typed in place: return adds the next line under the one typed. */
export function ChecklistEditor({
  item,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: ChecklistEditorProps): React.ReactElement {
  const lines = item.checklist?.lines ?? [""];
  const { keys, insertAfter } = useLineKeys(lines.length);
  const [focusKey, setFocusKey] = React.useState<number | null>(null);
  const name = t("workouts.checklist");
  const icon = { color: colors.textSecondary, size: 36, iconSize: 18 } as const;
  return (
    <View
      style={{
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 16, color: colors.gunmetal }]}>
          {name}
        </Text>
        {onMoveUp !== undefined && (
          <IconButton
            icon="moveUp"
            label={t("workouts.moveUp", { name })}
            onPress={onMoveUp}
            {...icon}
          />
        )}
        {onMoveDown !== undefined && (
          <IconButton
            icon="moveDown"
            label={t("workouts.moveDown", { name })}
            onPress={onMoveDown}
            {...icon}
          />
        )}
        <IconButton
          icon="remove"
          label={t("workouts.removeExercise", { name })}
          onPress={onRemove}
          {...icon}
        />
      </View>
      {lines.map((line, i) => (
        <View key={keys[i]} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[type.monoBold, { width: 28, fontSize: 14, color: colors.textSecondary }]}>
            {`${i + 1}.`}
          </Text>
          <TextInput
            autoFocus={keys[i] === focusKey}
            value={line}
            onChangeText={(text) => onChange((it) => withLineTyped(it, i, text))}
            onSubmitEditing={() => {
              if (lines.length >= MAX_CHECKLIST_LINES) return;
              onChange((it) => withLineAfter(it, i));
              setFocusKey(insertAfter(i));
            }}
            submitBehavior="submit"
            returnKeyType="next"
            placeholder={i === lines.length - 1 ? t("workouts.checklistLineHint") : undefined}
            placeholderTextColor={colors.textFaint}
            accessibilityLabel={t("workouts.checklistLine", { n: i + 1 })}
            maxLength={MAX_CHECKLIST_LINE}
            style={{
              flex: 1,
              minHeight: 44,
              fontFamily: fonts.sans,
              fontSize: 15,
              color: colors.gunmetal,
              borderWidth: 1,
              borderColor: "rgba(64,63,76,0.15)",
              borderRadius: radius.control,
              paddingHorizontal: 12,
            }}
          />
        </View>
      ))}
    </View>
  );
}
