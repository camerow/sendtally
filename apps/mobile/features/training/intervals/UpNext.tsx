import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { ON_DARK_MUTED } from "../components/onDark";
import type { UpNextItem } from "./intervalsText";
import { UpNextRow } from "./UpNextRow";

/** The phases coming after this one. */
export function UpNext({ items }: { items: readonly UpNextItem[] }): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: 2 }}>
      <Label color={ON_DARK_MUTED} style={{ paddingBottom: 6 }}>
        {t("activities.upNext")}
      </Label>
      {items.map((item) => (
        <UpNextRow key={item.index} item={item} />
      ))}
    </View>
  );
}
