import { useLocalSearchParams, useNavigation } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  addDays,
  daysBetween,
  isCalendarDate,
  weekStart,
  weekday,
  type CalendarDate,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { longDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockGroups,
  blockMembers,
  trainingWeek,
  useTrainingLog,
} from "@sendtally/features/training";
import { Fab } from "../../../components/Fab";
import { Toast } from "../../../components/Toast";
import { useApi } from "../../../lib/api";
import { openBlock } from "../blocks/openBlock";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { AddWorkoutsSheet, type Scheduled } from "../planning/AddWorkoutsSheet";
import { BlockRow } from "../train/BlockRow";
import { DaySection } from "./DaySection";
import { openLogged } from "./openLogged";
import { WeekStrip } from "./WeekStrip";

const weekOffset = (today: CalendarDate, date: CalendarDate): number =>
  daysBetween(weekStart(today), weekStart(date)) / 7;

/** Room left between the stuck strip and the day scrolled up under it. */
const UNDER_STRIP = 12;

/** Clear of the Schedule button. */
const BOTTOM = 96;

/**
 * The training-mode home: this week's training, logged and planned, day by day, opening on
 * Today with the week strip stuck above it.
 */
export function TodayScreen(): React.ReactElement {
  const navigation = useNavigation();
  const asked = useLocalSearchParams<{ date?: string; at?: string }>();
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const [offset, setOffset] = React.useState(0);
  const [selected, setSelected] = React.useState<CalendarDate>(today);
  const [adding, setAdding] = React.useState(false);
  const [scheduled, setScheduled] = React.useState<Scheduled | null>(null);
  const scroll = React.useRef<ScrollView>(null);
  const tops = React.useRef(new Map<CalendarDate, number>());
  const [strip, setStrip] = React.useState(0);
  const [viewport, setViewport] = React.useState(0);
  // The day to hold under the strip as the list lays out, until a drag takes over.
  const target = React.useRef<CalendarDate | null>(today);

  const scrollTo = (date: CalendarDate, animated: boolean): void => {
    const y = tops.current.get(date);
    if (y !== undefined)
      scroll.current?.scrollTo({ y: Math.max(0, y - strip - UNDER_STRIP), animated });
  };
  const show = (date: CalendarDate): void => {
    setOffset(weekOffset(today, date));
    setSelected(date);
    target.current = date;
    scrollTo(date, true);
  };

  const request = asked.date !== undefined && isCalendarDate(asked.date) ? asked.date : null;
  const [seen, setSeen] = React.useState<string | null>(null);
  const requestKey = request === null ? null : `${request}:${asked.at ?? ""}`;
  if (requestKey !== seen) {
    setSeen(requestKey);
    if (request !== null) {
      setOffset(weekOffset(today, request));
      setSelected(request);
    }
  }

  const showRef = React.useRef(show);
  React.useEffect(() => {
    showRef.current = show;
  });
  React.useEffect(
    () => navigation.addListener("tabPress" as never, () => showRef.current(today)),
    [navigation, today]
  );
  React.useEffect(() => {
    if (request !== null) showRef.current(request);
  }, [request, requestKey]);

  const monday = addDays(weekStart(today), offset * 7);
  const days = trainingWeek(log, monday, today);
  const running = blockGroups(log.plan.blocks, today).current;

  const changeWeek = (next: number): void => {
    setOffset(next);
    setSelected(addDays(addDays(weekStart(today), next * 7), weekday(selected)));
    target.current = null;
  };
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scroll}
        stickyHeaderIndices={[1]}
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        onContentSizeChange={() => {
          if (target.current !== null) scrollTo(target.current, false);
        }}
        onScrollBeginDrag={() => {
          target.current = null;
        }}
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: BOTTOM,
        }}
      >
        <Label color={colors.gunmetal}>{longDate(today)}</Label>
        <View
          onLayout={(e) => setStrip(e.nativeEvent.layout.height)}
          style={{ backgroundColor: colors.white }}
        >
          <WeekStrip
            offset={offset}
            days={days}
            selected={selected}
            onSelect={(date) => {
              setSelected(date);
              target.current = date;
              scrollTo(date, true);
            }}
            onOffset={changeWeek}
          />
        </View>
        {running.length > 0 && (
          <View>
            <Label color={colors.textSecondary}>
              {t("plan.blocksInProgress", { count: running.length })}
            </Label>
            {running.map((b) => (
              <BlockRow
                back={t("plan.tab")}
                key={b.id}
                id={b.id}
                name={b.name}
                meta={t("plan.workoutCount", { count: blockMembers(log.plan, b).length })}
              />
            ))}
          </View>
        )}
        {days.map((d, i) => (
          <View
            key={d.date}
            // Room under Sunday, so any day of the week can scroll up under the strip.
            style={
              i === days.length - 1
                ? { minHeight: viewport - strip - UNDER_STRIP - BOTTOM }
                : undefined
            }
            onLayout={(e) => {
              tops.current.set(d.date, e.nativeEvent.layout.y);
              if (target.current === d.date) scrollTo(d.date, false);
            }}
          >
            <DaySection day={d} onOpen={openLogged} quiet />
          </View>
        ))}
      </ScrollView>
      {scheduled === null && <Fab label={t("plan.schedule")} onPress={() => setAdding(true)} />}
      <AddWorkoutsSheet
        flow={{ date: selected, blockId: null }}
        visible={adding}
        onClose={() => setAdding(false)}
        onScheduled={(made) => {
          setScheduled(made);
          show(made.start);
        }}
      />
      {scheduled !== null && (
        <Toast
          message={t("plan.scheduledName", { name: scheduled.name })}
          action={{
            label: t("plan.viewTemplate"),
            onPress: () => openBlock(scheduled.id, t("plan.tab")),
          }}
          onHide={() => setScheduled(null)}
        />
      )}
    </View>
  );
}
