import React from "react";
import { View } from "react-native";
import type { Item, WeightUnit, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { ItemEditor } from "./ItemEditor";

export type ItemListProps = {
  kind: WorkoutKind;
  items: readonly Item[];
  unit: WeightUnit;
  gripName: (id: string) => string;
  onItem: (index: number, item: Item) => void;
  onRemoveItem: (index: number) => void;
  onAddItem: () => void;
  onPickGrip: (index: number) => void;
};

/** A variation's items, one under another, and a way to add one more. */
export function ItemList({
  kind,
  items,
  unit,
  gripName,
  onItem,
  onRemoveItem,
  onAddItem,
  onPickGrip,
}: ItemListProps): React.ReactElement {
  return (
    <View style={{ gap: 14 }}>
      {items.map((item, i) => (
        <View
          key={i}
          style={
            i === 0
              ? undefined
              : { paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.lineOnLight }
          }
        >
          <ItemEditor
            kind={kind}
            item={item}
            unit={unit}
            gripName={gripName}
            onChange={(next) => onItem(i, next)}
            onRemove={() => onRemoveItem(i)}
            onPickGrip={() => onPickGrip(i)}
          />
        </View>
      ))}
      <Button
        label={kind === "hangboard" ? t("workouts.addGrip") : t("workouts.addExercise")}
        onPress={onAddItem}
        variant="link"
        icon="plus"
        height={44}
        style={{ alignSelf: "flex-start", paddingHorizontal: 0 }}
      />
    </View>
  );
}
