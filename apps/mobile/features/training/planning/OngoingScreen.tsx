import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import type { Weekday } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  daysThisWeek,
  hasDays,
  scheduleOf,
  usePlan,
  useTrainingLog,
} from "@sendtally/features/training";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { EditorHeader } from "../components/EditorHeader";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { PlanGrid } from "../plan/PlanGrid";
import { ongoingMembers, planGridRows } from "../plan/planGridRows";
import { type } from "../type";
import { AddWorkoutsSheet } from "./AddWorkoutsSheet";
import { OngoingWorkouts } from "./OngoingWorkouts";
import { usePlanDraft } from "./usePlanDraft";

export type OngoingScreenProps = {
  /** Where back goes, as that screen is called. */
  back?: string;
};

/** The weekly plans in no block: their week, and Edit to set their days, add and take them out. */
export function OngoingScreen({ back }: OngoingScreenProps): React.ReactElement {
  const { today, model } = useHangData();
  const api = useApi();
  const plan = usePlan(api);
  const { log } = useTrainingLog(api);
  const draft = usePlanDraft(log.plan);
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = React.useState<readonly string[]>([]);
  React.useEffect(() => {
    if (added.length === 0) return;
    const fade = setTimeout(() => setAdded([]), 2400);
    return () => clearTimeout(fade);
  }, [added]);

  if (plan.state.status !== "ready")
    return <LoadState state={plan.state} onRetry={() => void plan.reload()} framed />;
  const members = ongoingMembers(draft.plan, today);
  const shown = members.map((m) => ({ ...m, weekdays: daysThisWeek(draft.plan, m, null, today) }));
  const name = t("plan.ongoing");
  const rows = planGridRows(
    shown,
    log.workout,
    model,
    draft.editing
      ? {
          back: name,
          toggle: (m, day) => () =>
            draft.toggle(m.id, { week: 1, day: day as Weekday, following: true, last: 1 }),
        }
      : { back: name }
  );
  const dayless = members.filter((m) => !hasDays(scheduleOf(draft.plan, m)));
  const save = (): void => {
    draft.save();
    if (members.length === 0) router.back();
  };

  return (
    <ScreenFrame
      backLabel={back}
      {...(draft.editing && {
        header: (
          <EditorHeader title={t("plan.editOngoing")} onCancel={draft.cancel} onSave={save} solid />
        ),
      })}
      action={<DetailActions onEdit={draft.begin} />}
    >
      <View style={{ gap: 4 }}>
        <Title size={34}>{name}</Title>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {t("plan.ongoingRepeats")}
        </Text>
      </View>
      {rows.length > 0 && (
        <PlanGrid rows={rows} lit={added} editing={draft.editing} title={t("plan.week")} />
      )}
      {draft.editing && dayless.length > 0 && (
        <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
          {t("plan.tapDays", {
            workout: dayless.map((m) => log.workout(m.workoutId)?.name ?? "").join(", "),
          })}
        </Text>
      )}
      {draft.editing && (
        <>
          <Button
            label={t("plan.addWorkout")}
            onPress={() => setAdding(true)}
            variant="primary"
            icon="plus"
            height={48}
          />
          {members.length > 0 && (
            <OngoingWorkouts members={members} workout={log.workout} onRemove={draft.remove} />
          )}
        </>
      )}
      <AddWorkoutsSheet
        flow={{ date: null, blockId: null }}
        visible={adding}
        onClose={(ids) => {
          setAdding(false);
          setAdded(ids);
        }}
      />
    </ScreenFrame>
  );
}
