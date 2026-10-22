import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { ChecklistItem } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { IconButton } from "../components/IconButton";
import { DetailTextInput } from "./DetailTextInput";
import { Tick } from "./Tick";

export type ChecklistRowProps = {
  item: ChecklistItem;
  template: boolean;
  inSheet: boolean;
  first: boolean;
  last: boolean;
  onChange: (item: ChecklistItem) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
};

/** One line of a checklist: a tick while logging, what to do and how much, and its order. */
export function ChecklistRow({
  item,
  template,
  inSheet,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: ChecklistRowProps): React.ReactElement {
  const struck = item.done && !template;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLight,
      }}
    >
      {!template && (
        <Tick
          done={item.done}
          label={item.text.trim() === "" ? t("activities.item") : item.text}
          color={colors.gunmetal}
          onToggle={() => onChange({ ...item, done: !item.done })}
        />
      )}
      <View style={{ flex: 1, gap: 6 }}>
        <DetailTextInput
          value={item.text}
          onChange={(text) => onChange({ ...item, text })}
          label={t("activities.item")}
          placeholder={t("activities.itemPlaceholder")}
          maxLength={80}
          inSheet={inSheet}
          style={
            struck ? { color: colors.textSecondary, textDecorationLine: "line-through" } : undefined
          }
        />
        <DetailTextInput
          value={item.dose}
          onChange={(dose) => onChange({ ...item, dose })}
          label={t("activities.dose")}
          placeholder={t("activities.dosePlaceholder")}
          maxLength={40}
          inSheet={inSheet}
          style={{ fontSize: 14 }}
        />
      </View>
      <View>
        {first ? (
          <View style={{ width: 44, height: 44 }} />
        ) : (
          <IconButton
            icon="up"
            label={t("activities.moveUp")}
            onPress={() => onMove(-1)}
            color={colors.textSecondary}
          />
        )}
        {last ? (
          <View style={{ width: 44, height: 44 }} />
        ) : (
          <IconButton
            icon="down"
            label={t("activities.moveDown")}
            onPress={() => onMove(1)}
            color={colors.textSecondary}
          />
        )}
      </View>
      <IconButton
        icon="x"
        label={t("activities.removeItem")}
        onPress={onRemove}
        color={colors.textSecondary}
      />
    </View>
  );
}
