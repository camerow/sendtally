import React from "react";
import { View } from "react-native";
import { newChecklistItem, type ChecklistDetail } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { ChecklistRow } from "./ChecklistRow";
import { moved } from "./moved";

export type ChecklistEditorProps = {
  value: ChecklistDetail;
  template: boolean;
  inSheet: boolean;
  onChange: (value: ChecklistDetail) => void;
};

/** Checklist lines to tick off, add, remove and put in order. */
export function ChecklistEditor({
  value,
  template,
  inSheet,
  onChange,
}: ChecklistEditorProps): React.ReactElement {
  const { items } = value;
  const set = (next: ChecklistDetail["items"]): void => onChange({ ...value, items: next });
  return (
    <View style={{ gap: 12 }}>
      <View>
        {items.map((item, i) => (
          <ChecklistRow
            key={i}
            item={item}
            template={template}
            inSheet={inSheet}
            first={i === 0}
            last={i === items.length - 1}
            onChange={(next) => set(items.map((x, j) => (j === i ? next : x)))}
            onMove={(direction) => set(moved(items, i, i + direction))}
            onRemove={() => set(items.filter((_, j) => j !== i))}
          />
        ))}
      </View>
      <Button
        label={t("activities.addItem")}
        icon="plus"
        variant="dashed"
        disabled={items.length >= 50}
        onPress={() => set([...items, newChecklistItem()])}
      />
    </View>
  );
}
