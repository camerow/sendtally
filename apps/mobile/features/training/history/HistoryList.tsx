import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { HistoryRow } from "./HistoryRow";
import type { HistoryItem } from "./types";

const SHOWN = 5;

export type HistoryListProps = { items: readonly HistoryItem[]; onOpen: (id: string) => void };

/** Past sessions, newest first: five, then the rest on asking. Left out when there is none but this one. */
export function HistoryList({ items, onOpen }: HistoryListProps): React.ReactElement | null {
  const [all, setAll] = React.useState(false);
  if (items.every((i) => i.current === true)) return null;
  const shown = all ? items : items.slice(0, SHOWN);
  return (
    <View style={{ gap: 2 }}>
      <Label color={colors.gunmetal}>
        {t("hang.history", { count: t("hang.sessionCount", { count: items.length }) })}
      </Label>
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
