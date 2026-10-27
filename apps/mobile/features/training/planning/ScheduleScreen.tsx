import { randomUUID } from "expo-crypto";
import React from "react";
import { View } from "react-native";
import { addDays, blockEnd, maxDate, type Block } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { daysList, shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  newSchedule,
  scheduledMemberships,
  scheduleReady,
  toggled,
  usePlan,
  type ScheduleDraft,
  type ScheduleMode,
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
import { backToPlan } from "./backToPlan";
import { BlockChoice } from "./BlockChoice";
import type { AddFlow } from "./flowParams";
import { ScreenFrame } from "./ScreenFrame";
import { StartField } from "./StartField";
import { WeekdayChips } from "./WeekdayChips";

export type ScheduleScreenProps = { workoutId: string; flow: AddFlow };

function addLabel(d: ScheduleDraft, count: number, first: string | undefined): string {
  if (d.mode === "repeat")
    return d.weekdays.length === 0
      ? t("hang.add")
      : t("plan.addEvery", { days: daysList(d.weekdays) });
  if (count === 1 && first !== undefined) return t("plan.addOn", { date: shortDate(first) });
  return count === 0 ? t("hang.add") : t("plan.addOnDays", { count });
}

/** The last step of adding: every week on some days, or on some dates, in a block or not. */
export function ScheduleScreen({
  workoutId,
  flow,
}: ScheduleScreenProps): React.ReactElement | null {
  const { today } = useHangData();
  const library = useLibrary();
  const plan = usePlan(useApi()).state;
  const actions = usePlanActions();
  const [draft, setDraft] = React.useState(() => newSchedule(flow.date, today));
  const [blockId, setBlockId] = React.useState(flow.blockId);
  const update = (patch: Partial<ScheduleDraft>): void => setDraft((d) => ({ ...d, ...patch }));

  if (library.state.status !== "ready")
    return <LoadState state={library.state} onRetry={() => void library.reload()} />;
  const workout = library.state.data.workout(workoutId);
  if (workout === undefined) return null;
  const blocks = plan.status === "ready" ? plan.data.blocks.filter((b) => blockEnd(b) > today) : [];
  const block: Block | null = blocks.find((b) => b.id === blockId) ?? null;
  const planned = scheduledMemberships(draft, workoutId, block, () => "");
  const ready = scheduleReady(draft, block);

  const save = (): void => {
    const memberships = scheduledMemberships(draft, workoutId, block, randomUUID);
    memberships.forEach((m) => void actions.saveMembership(m));
    backToPlan(memberships[0]?.id ?? null);
  };

  return (
    <ScreenFrame
      footer={
        <Button
          label={addLabel(draft, planned.length, planned[0]?.start)}
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
      <Segmented<ScheduleMode>
        value={draft.mode}
        onChange={(mode) => update({ mode })}
        options={[
          { value: "repeat", label: t("plan.repeatEvery") },
          { value: "dates", label: t("plan.specificDays") },
        ]}
      />
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
          max={block === null ? undefined : addDays(blockEnd(block), -1)}
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
