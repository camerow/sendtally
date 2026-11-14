import { randomUUID } from "expo-crypto";
import React from "react";
import { View } from "react-native";
import {
  blockEnded,
  blockLastDay,
  blockWeekOn,
  isDated,
  maxDate,
  type Block,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  blockDates,
  newSchedule,
  nextPosition,
  scheduledMemberships,
  scheduleReady,
  toggled,
  usePlan,
  type ScheduleDraft,
  type ScheduleMode,
  scheduleAddLabel,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { MonthCalendar } from "../components/MonthCalendar";
import { Segmented } from "../components/Segmented";
import { SheetSection } from "../components/SheetSection";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { useLibrary } from "../library/useLibrary";
import { usePlanActions } from "../plan/usePlanActions";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";
import { backToPlan } from "./backToPlan";
import { BlockChoice } from "./BlockChoice";
import type { AddFlow } from "@sendtally/features/training";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { StartField } from "./StartField";
import { WeekdayChips } from "./WeekdayChips";

export type ScheduleScreenProps = { workoutId: string; flow: AddFlow };

/** The last step of adding: every week on some days, or on some dates, in a block or not. */
export function ScheduleScreen({
  workoutId,
  flow,
}: ScheduleScreenProps): React.ReactElement | null {
  const { today } = useHangData();
  const library = useLibrary();
  const plan = usePlan(useApi()).state;
  const actions = usePlanActions();
  const prompt = useReminderPrompt();
  const [draft, setDraft] = React.useState(() => newSchedule(flow.date, today));
  const [blockId, setBlockId] = React.useState(flow.blockId);
  const update = (patch: Partial<ScheduleDraft>): void => setDraft((d) => ({ ...d, ...patch }));

  if (library.state.status !== "ready")
    return <LoadState state={library.state} onRetry={() => void library.reload()} />;
  const workout = library.state.data.workout(workoutId);
  if (workout === undefined) return null;
  const all = plan.status === "ready" ? plan.data.blocks : [];
  const template = all.find((b) => b.id === flow.blockId && !isDated(b));
  const blocks =
    template === undefined ? all.filter(isDated).filter((b) => !blockEnded(b, today)) : [];
  const block: Block | null = template ?? blocks.find((b) => b.id === blockId) ?? null;
  const dated = block !== null && isDated(block) ? block : null;
  const planned = scheduledMemberships(draft, workoutId, block, () => "", 0);
  // In a block the dates are one plan's days; outside one, a plan each.
  const days =
    draft.mode === "dates" && dated !== null
      ? draft.dates.filter((d) => blockWeekOn(dated, d) !== null).sort()
      : planned.map((m) => m.start);
  const ready = scheduleReady(draft, block);

  const save = (): void => {
    const position = plan.status === "ready" ? nextPosition(plan.data, block?.id ?? null) : 0;
    const memberships = scheduledMemberships(draft, workoutId, block, randomUUID, position);
    memberships.forEach((m) => void actions.saveMembership(m));
    const [first] = memberships;
    if (first !== undefined && draft.mode === "dates" && dated !== null)
      void actions.saveSchedule(blockDates(first.id, dated, draft.dates));
    if (first === undefined) return;
    prompt();
    backToPlan(block?.id ?? null, days[0] ?? first.start, first.id);
  };

  return (
    <ScreenFrame
      footer={
        <Button
          label={scheduleAddLabel(draft, days.length, days[0])}
          onPress={save}
          disabled={!ready}
          variant="primary"
          height={54}
        />
      }
    >
      <View style={{ gap: 4 }}>
        <Label color={colors.gunmetal}>{workout.name}</Label>
        <Title size={34}>{t("plan.howOften")}</Title>
      </View>
      {template === undefined && (
        <Segmented<ScheduleMode>
          value={draft.mode}
          onChange={(mode) => update({ mode })}
          options={[
            { value: "repeat", label: t("plan.repeatEvery") },
            { value: "dates", label: t("plan.specificDays") },
          ]}
        />
      )}
      {draft.mode === "repeat" ? (
        <SheetSection label={t("plan.days")}>
          <WeekdayChips
            days={draft.weekdays}
            onToggle={(day) => update({ weekdays: toggled(draft.weekdays, day) })}
          />
        </SheetSection>
      ) : (
        <MonthCalendar
          key={block?.id ?? "none"}
          selected={draft.dates[0] ?? maxDate(block?.start ?? today, today)}
          picked={draft.dates}
          min={maxDate(block?.start ?? today, today)}
          max={dated === null ? undefined : blockLastDay(dated)}
          today={today}
          shaded={() => false}
          blocks={blocks}
          onPick={(d) => update({ dates: toggled(draft.dates, d) })}
        />
      )}
      {blocks.length > 0 && (
        <SheetSection label={t("plan.block")}>
          <BlockChoice blocks={blocks} value={block?.id ?? null} onChange={setBlockId} />
        </SheetSection>
      )}
      {block === null && draft.mode === "repeat" && (
        <StartField value={draft.start} min={today} onChange={(start) => update({ start })} />
      )}
    </ScreenFrame>
  );
}
