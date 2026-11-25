import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { letterOf } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { weightText } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { useBlockStep, weeklyStepKg, type Wizard } from "@sendtally/features/settings";
import { loadColumns } from "@sendtally/features/training";
import { press } from "../../../lib/press";
import { Button } from "../../training/components/Button";
import { Label } from "../../training/components/Label";
import { Segmented } from "../../training/components/Segmented";
import { Stepper } from "../../training/components/Stepper";
import { Title } from "../../training/components/Title";
import { useHangData } from "../../training/data/HangDataContext";
import { useLibrary } from "../../training/library/useLibrary";
import { LoadTable } from "../../training/planning/LoadTable";
import { usePlanActions } from "../../training/plan/usePlanActions";
import { type } from "../../training/type";
import { DarkCard } from "../components/DarkCard";
import { WizardFrame } from "../WizardFrame";
import { LoadBars } from "./components/LoadBars";

/** P4, a side step from the reveal: the block's length and how the load changes week by week. */
export function BlockStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const { model } = useHangData();
  const unit = model.settings.units;
  const step = useBlockStep({
    wizard,
    api,
    model,
    library: useLibrary().state,
    actions: usePlanActions(),
  });

  if (step.status === "loading")
    return (
      <WizardFrame
        wizard={wizard}
        skip={false}
        footer={
          <Button
            variant="primary"
            height={54}
            label={t("common.save")}
            onPress={() => undefined}
            disabled
          />
        }
      >
        {null}
      </WizardFrame>
    );

  const {
    workout,
    exercise,
    weeks,
    resize,
    alt,
    dose,
    setShown,
    written,
    weighted,
    shortcuts,
    anyShortcut,
    toggle,
    shownChanges,
    setCell,
    bars,
    save,
  } = step;

  const chip = (label: string, on: boolean, onPress: () => void): React.ReactElement => (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      style={press({
        height: 44,
        paddingHorizontal: 14,
        borderRadius: 22,
        justifyContent: "center",
        backgroundColor: on ? colors.gunmetal : colors.surfaceSoft,
      })}
    >
      <Text style={[type.bodyBold, { fontSize: 13.5, color: on ? colors.white : colors.gunmetal }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <WizardFrame
      wizard={wizard}
      skip={false}
      sticky={[1]}
      footer={<Button variant="primary" height={54} label={t("common.save")} onPress={save} />}
    >
      <Title size={34}>{t("onboarding.plan.block.title")}</Title>
      <DarkCard
        raised
        reserveNote
        label={t("onboarding.plan.block.weekByWeek", { name: exercise })}
        meta={t("calendar.weeks", { count: weeks })}
        note={
          anyShortcut
            ? undefined
            : t("onboarding.plan.block.sameSoFar", { build: t("onboarding.plan.block.build") })
        }
      >
        <LoadBars bars={bars} />
      </DarkCard>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {t("plan.weeks")}
        </Text>
        <Stepper
          surface="plain"
          text={t("calendar.weeks", { count: weeks })}
          label={t("plan.weeks")}
          decreaseLabel={t("hang.decrease", { field: t("plan.weeks") })}
          increaseLabel={t("hang.increase", { field: t("plan.weeks") })}
          onStep={resize}
        />
      </View>
      <View style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Label color={colors.gunmetal}>{exercise}</Label>
          <Text
            numberOfLines={1}
            style={[type.mono, { flexShrink: 1, fontSize: 12, color: colors.textSecondary }]}
          >
            {workout.name}
          </Text>
        </View>
        {alt && (
          <Segmented
            options={[0, 1].map((d) => ({
              value: String(d),
              label: t("onboarding.plan.block.session", { letter: letterOf(d) }),
            }))}
            value={String(dose)}
            onChange={(v) => setShown(Number(v))}
          />
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {chip(
            weighted
              ? t("onboarding.plan.block.addLoad", { amount: weightText(weeklyStepKg(unit), unit) })
              : t("onboarding.plan.block.addRep"),
            shortcuts.stepUp,
            () => toggle("stepUp")
          )}
          {chip(t("onboarding.plan.block.deloadLast"), shortcuts.deload, () => toggle("deload"))}
        </View>
        <LoadTable
          key={dose}
          kind={workout.kind}
          written={written}
          changes={shownChanges}
          columns={loadColumns(workout.kind, written, shownChanges)}
          unit={unit}
          current={null}
          done={null}
          editing
          onChange={setCell}
        />
      </View>
    </WizardFrame>
  );
}
