import React from "react";
import { Pressable, Text, View } from "react-native";
import type { PlanItem } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { durationLabel } from "@sendtally/features/sessions";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { planItemMeta } from "../plan/planItemText";
import { type } from "../type";
import { DayMark } from "./DayMark";
import { KIND_LOOK, kindName } from "./kindLook";
import { planTag } from "./planTag";

export type PlanItemCardProps = {
  item: PlanItem;
  onEdit: () => void;
  onLog: () => void;
  /** Runs its intervals in the timer; null when it has none. */
  onStart: (() => void) | null;
};

/** A plan item due today: the card opens the plan, the buttons run or log it. */
export function PlanItemCard({
  item,
  onEdit,
  onLog,
  onStart,
}: PlanItemCardProps): React.ReactElement {
  const { today } = useHangData();
  const climb = item.kind === "climb";
  return (
    <View
      style={{
        gap: 12,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: colors.white,
      }}
    >
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={t("plan.edit", { title: item.title })}
        style={({ pressed }) => ({ gap: 12, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <DayMark kind={item.kind} filled />
          <Label color={KIND_LOOK[item.kind].ink} style={{ flex: 1 }}>
            {t("hang.upToday", { kind: planTag(kindName(item.kind), item, today) })}
          </Label>
          {item.minutes !== null && (
            <Label color={colors.textSecondary}>{durationLabel(item.minutes)}</Label>
          )}
        </View>
        <View style={{ gap: 4 }}>
          <Title size={28}>{item.title}</Title>
          <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
            {planItemMeta(item)}
          </Text>
        </View>
      </Pressable>
      {onStart === null ? (
        <Button
          label={climb ? t("plan.logSession") : t("plan.logIt")}
          onPress={onLog}
          variant={climb ? "gold" : "primary"}
          height={50}
          icon="plus"
        />
      ) : (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button
            label={t("hang.start")}
            onPress={onStart}
            variant="primary"
            height={50}
            icon="play"
            style={{ flex: 1 }}
          />
          <Button
            label={t("plan.logIt")}
            onPress={onLog}
            variant="outline"
            height={50}
            icon="plus"
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}
