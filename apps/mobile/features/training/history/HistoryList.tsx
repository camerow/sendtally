import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { SectionHeading } from "../../../components/SectionHeading";
import { Button } from "../components/Button";
import { HistoryRow } from "./HistoryRow";
import type { HistoryItem } from "@sendtally/features/activities";

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
      <SectionHeading
        title={
          title ??
          t("hang.history", {
            count: t("hang.sessionCount", {
              count: items.filter((i) => i.kind !== "note").length,
            }),
          })
        }
        add={onAdd}
      />
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
