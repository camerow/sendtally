import React from "react";
import { Text, View } from "react-native";
import { addDays, clamp, parseNumber } from "@sendtally/core/hang";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { DateField } from "../../components/DateField";
import { MonthCalendar } from "../../components/MonthCalendar";
import { Segmented } from "../../components/Segmented";
import { SheetSection } from "../../components/SheetSection";
import { Stepper } from "../../components/Stepper";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import type { EndMode, Planner } from "./usePlanner";

const MAX_WEEKS = 52;

export type EndSectionProps = {
  planner: Planner;
  open: boolean;
  onToggle: (open: boolean) => void;
};

export function EndSection({ planner, open, onToggle }: EndSectionProps): React.ReactElement {
  const c = useTheme();
  const { today } = useHangData();
  const { draft } = planner;
  const setWeeks = (n: number): void =>
    planner.update({ weeks: clamp(Math.round(n), 1, MAX_WEEKS) });
  const lastDay = addDays(draft.start, draft.weeks * 7 - 1);
  return (
    <SheetSection label={t("hang.ends")}>
      <Segmented<EndMode>
        surface="light"
        value={draft.endMode}
        onChange={(endMode) => {
          planner.update({ endMode });
          onToggle(false);
        }}
        options={[
          { value: "never", label: t("hang.endNever") },
          { value: "weeks", label: t("hang.endAfter") },
          { value: "date", label: t("hang.endOnDate") },
        ]}
      />
      {draft.endMode === "weeks" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Stepper
            value={String(draft.weeks)}
            onCommit={(text) => {
              const n = parseNumber(text);
              if (n !== null) setWeeks(n);
            }}
            onStep={(dir) => setWeeks(draft.weeks + dir)}
            label={t("hang.weekCount")}
            decreaseLabel={t("hang.weekFewer")}
            increaseLabel={t("hang.weekMore")}
            surface="light"
            inputWidth={64}
            keyboard="number-pad"
            inSheet
          />
          <Text
            style={[
              type.body,
              { flex: 1, paddingLeft: 6, fontSize: 14, lineHeight: 18, color: c.ink2 },
            ]}
          >
            {t("hang.weeksNote", { count: draft.weeks, date: shortDate(lastDay) })}
          </Text>
        </View>
      )}
      {draft.endMode === "date" && (
        <DateField
          text={shortDate(draft.last)}
          open={open}
          onToggle={() => onToggle(!open)}
          label={t("hang.ends")}
        />
      )}
      {draft.endMode === "date" && open && (
        <MonthCalendar
          selected={draft.last}
          min={draft.start}
          today={today}
          shaded={planner.shaded}
          onPick={(last) => {
            planner.update({ last });
            onToggle(false);
          }}
        />
      )}
    </SheetSection>
  );
}
