import React from "react";
import { View } from "react-native";
import type { UpNextItem } from "@sendtally/features/activities";
import { UpNextRow } from "./UpNextRow";

/** The phases coming after this one. */
export function UpNext({ items }: { items: readonly UpNextItem[] }): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 2 }}>
      {items.map((item) => (
        <UpNextRow key={item.index} item={item} />
      ))}
    </View>
  );
}
