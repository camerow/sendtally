import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { AddButton } from "../../../components/AddButton";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { HistoryRow } from "./HistoryRow";
import type { HistoryItem } from "./types";

const SHOWN = 5;

export type HistoryListProps = {
  items: readonly HistoryItem[];
  onOpen: (id: string) => void;
  title?: string;
  onAdd?: { label: string; onPress: () => void };
};

/** Past sessions, newest first: five, then the rest on asking. Left out when there is none but this one, unless it has an add button. */
export function HistoryList({
  items,
  onOpen,
  title,
  onAdd,
}: HistoryListProps): React.ReactElement | null {
  const [all, setAll] = React.useState(false);
  if (onAdd === undefined && items.every((i) => i.current === true)) return null;
  const shown = all ? items : items.slice(0, SHOWN);
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Label color={colors.gunmetal}>
          {title ??
            t("hang.history", {
              count: t("hang.sessionCount", {
                count: items.filter((i) => i.kind !== "note").length,
              }),
            })}
        </Label>
        {onAdd && <AddButton label={onAdd.label} onPress={onAdd.onPress} />}
      </View>
      {shown.map((item) => (
        <HistoryRow key={item.id} item={item} onPress={() => onOpen(item.id)} />
      ))}
      {items.length > SHOWN && (
        <Button
          label={all ? t("hang.showFewer") : t("hang.showAll", { n: items.length })}
          onPress={() => setAll(!all)}
          variant="link"
          height={44}
          style={{ alignSelf: "center" }}
        />
      )}
    </View>
  );
}
