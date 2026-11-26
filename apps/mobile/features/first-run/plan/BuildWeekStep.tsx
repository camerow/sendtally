import { randomUUID } from "expo-crypto";
import React from "react";
import { View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { useExerciseList } from "@sendtally/features/exercises";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { libraryPictures } from "@sendtally/features/library";
import { useBuildWeek, type Wizard } from "@sendtally/features/settings";
import { libraryLine } from "@sendtally/features/workouts";
import { Button } from "../../training/components/Button";
import { Label } from "../../training/components/Label";
import { Title } from "../../training/components/Title";
import { useHangData } from "../../training/data/HangDataContext";
import { useLibrary } from "../../training/library/useLibrary";
import { usePlanActions } from "../../training/plan/usePlanActions";
import { AddWorkoutRow } from "../../training/planning/AddWorkoutRow";
import { WeekdayChips } from "../../training/planning/WeekdayChips";
import { WizardFrame } from "../WizardFrame";
import { AddWorkoutSheet } from "./AddWorkoutSheet";
import { WeekCard } from "./components/WeekCard";
import { YoursTag } from "./components/YoursTag";

/** Build your week: workouts picked from the library and put on their days, the week card pinned above. */
export function BuildWeekStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const { model, today } = useHangData();
  const exercises = useExerciseList(api);
  const step = useBuildWeek({
    wizard,
    api,
    today,
    library: useLibrary().state,
    actions: usePlanActions(),
    newId: randomUUID,
  });
  const [all, setAll] = React.useState(false);
  const build = (): void => wizard.open("P2");
  const title = <Title size={34}>{t("onboarding.plan.build.title")}</Title>;
  const footer = (
    <Button
      variant="primary"
      height={54}
      label={t("plan.scheduleFrom", { day: shortDate(step.start) })}
      disabled={step.status !== "ready" || step.sessions === 0}
      onPress={() => step.status === "ready" && step.schedule()}
    />
  );
  if (step.status !== "ready")
    return (
      <WizardFrame wizard={wizard} footer={footer}>
        {title}
      </WizardFrame>
    );

  return (
    <WizardFrame wizard={wizard} sticky={[1]} footer={footer}>
      {title}
      <WeekCard
        week={step.week}
        meta={t("onboarding.plan.week.perWeek", { count: step.sessions })}
        empty={t("onboarding.plan.build.tapDays")}
      />
      <View style={{ gap: 2 }}>
        <Label color={colors.textSecondary}>{t("workouts.fromLibrary")}</Label>
        {step.rows.map(({ workout: w, picked, days }) => (
          <View key={w.id} style={{ gap: 6, paddingBottom: picked ? 8 : 0 }}>
            <AddWorkoutRow
              kind={w.kind}
              name={w.name}
              meta={libraryLine(w, model.settings.units, exercises)}
              picture={libraryPictures("workout", w.id)[0]}
              state={picked ? "added" : "none"}
              thereLabel=""
              tag={w.source === "mine" ? <YoursTag /> : undefined}
              onOpen={() => step.toggle(w.id)}
              onToggle={() => step.toggle(w.id)}
            />
            {picked && (
              <WeekdayChips days={days} label={w.name} onToggle={(d) => step.toggleDay(w.id, d)} />
            )}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Button
          variant="outline"
          icon="plus"
          height={48}
          label={t("onboarding.plan.build.own")}
          onPress={build}
        />
        <Button
          variant="link"
          height={48}
          label={t("onboarding.plan.build.all")}
          onPress={() => setAll(true)}
        />
        <AddWorkoutSheet visible={all} onClose={() => setAll(false)} onBuildAnother={build} />
      </View>
    </WizardFrame>
  );
}
