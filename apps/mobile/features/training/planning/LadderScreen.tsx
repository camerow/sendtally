import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import type { Dose } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { blockOfMembership, useTrainingLog, variationName } from "@sendtally/features/training";
import { doseSummary, exerciseName } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Segmented } from "../components/Segmented";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { PreviewRow } from "../library-detail/PreviewRow";
import { usePlanActions } from "../plan/usePlanActions";
import { membershipWhen } from "../plans/planText";
import { type } from "../type";
import { ScreenFrame } from "./ScreenFrame";
import { WeekRung } from "./WeekRung";
import { confirmDestructive } from "../../../lib/confirmDestructive";

export type LadderScreenProps = { id: string };

/**
 * A workout in a block, its weeks as a ladder: each week says only what it changes
 * from the workout as written, and opens in place to change it.
 */
export function LadderScreen({ id }: LadderScreenProps): React.ReactElement | null {
  const { model } = useHangData();
  const unit = model.settings.units;
  const { log } = useTrainingLog(useApi());
  const actions = usePlanActions();
  const [variation, setVariation] = React.useState(0);
  const [open, setOpen] = React.useState<number | null>(null);
  const { plan } = log;
  const m = plan.memberships.find((x) => x.id === id);
  const block = m === undefined ? null : blockOfMembership(plan, m);
  const w = m === undefined ? undefined : log.workout(m.workoutId);
  if (m === undefined || w === undefined || block === null) return null;
  const items = w.variations[variation]?.items ?? [];

  const changesIn = (week: number): Partial<Dose>[] =>
    items.map(
      (_, item) =>
        plan.weekChanges.find(
          (c) =>
            c.membershipId === id && c.week === week && c.variation === variation && c.item === item
        )?.change ?? {}
    );
  const remove = (): void =>
    confirmDestructive({
      title: t("plan.removeTitle", { title: w.name }),
      body: t("plan.removeBody"),
      action: t("plan.removeAction"),
      onConfirm: () => {
        void actions.deleteMembership(m.id);
        router.back();
      },
    });

  return (
    <ScreenFrame>
      <View style={{ gap: 4 }}>
        <Label color={colors.gunmetal}>
          {[block.name, kindLabel(w.kind), membershipWhen(m)].join(" · ")}
        </Label>
        <Title size={34}>{w.name}</Title>
      </View>
      {w.variations.length > 1 && (
        <Segmented<string>
          value={String(variation)}
          onChange={(v) => {
            setVariation(Number(v));
            setOpen(null);
          }}
          options={w.variations.map((v, i) => ({
            value: String(i),
            label: variationName(v.label, i),
          }))}
        />
      )}
      <View style={{ gap: 2 }}>
        <Label color={colors.textSecondary}>{t("plan.asWritten")}</Label>
        {items.map((item, i) => (
          <PreviewRow
            key={i}
            title={exerciseName(item.exercise)}
            detail={doseSummary(w.kind, item.dose, unit)}
          />
        ))}
      </View>
      <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
        {t("plan.ladderHint")}
      </Text>
      <View style={{ gap: 8 }}>
        {Array.from({ length: block.weeks }, (_, i) => i + 1).map((week) => (
          <WeekRung
            key={`${variation}-${week}`}
            kind={w.kind}
            week={week}
            items={items}
            changes={changesIn(week)}
            unit={unit}
            open={open === week}
            onToggle={() => setOpen(open === week ? null : week)}
            onChange={(item, change) =>
              void actions.saveWeekChange({ membershipId: id, week, variation, item, change })
            }
          />
        ))}
      </View>
      <Button label={t("plan.removeFromBlock")} onPress={remove} variant="danger" height={50} />
    </ScreenFrame>
  );
}
