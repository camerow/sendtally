import React from "react";
import { Alert, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { SendtallyApi } from "@sendtally/api-client";
import { colors, fonts } from "@sendtally/design/tokens";
import { shortDate, useGrips, weekdayLong } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import {
  firstWeekday,
  sessionsPerWeek,
  usePlanPath,
  useTrainingReminders,
  weekBars,
  type Wizard,
} from "@sendtally/features/settings";
import { KIND_LOOK, usePlan } from "@sendtally/features/training";
import { useTween } from "@sendtally/features/trends";
import { Icon } from "../../../components/Icon";
import { Switch } from "../../../components/Switch";
import { Button } from "../../training/components/Button";
import { Label } from "../../training/components/Label";
import { Title } from "../../training/components/Title";
import { useHangData } from "../../training/data/HangDataContext";
import { useLibrary } from "../../training/library/useLibrary";
import { requestNotifications } from "../../training/reminders/notifications";
import { darkMeta } from "../components/DarkCard";
import { type } from "../../training/type";
import { WizardFrame } from "../WizardFrame";
import { LoadBars } from "./components/LoadBars";
import { PlanCalendar } from "./components/PlanCalendar";

/** P5: the whole block on a calendar, its session count running up, and reminders one switch away. */
export function RevealStep({
  wizard,
  api,
}: {
  wizard: Wizard;
  api: SendtallyApi;
}): React.ReactElement {
  const path = usePlanPath();
  const plan = usePlan(api).state;
  const library = useLibrary().state;
  const unit = useHangData().model.settings.units;
  const reminders = useTrainingReminders(api);
  const { gripName } = useGrips(api);
  const ready = plan.status === "ready" && library.status === "ready";
  const block = ready ? plan.data.blocks.find((b) => b.id === path.blockId) : undefined;
  const members = ready
    ? plan.data.memberships
        .filter((m) => m.blockId === block?.id)
        .sort((a, b) => a.position - b.position)
    : [];
  const placed = members.flatMap((m) => {
    const workout = ready ? library.data.workout(m.workoutId) : undefined;
    return workout === undefined ? [] : [{ m, workout }];
  });
  const start = block?.start ?? null;
  const weeks = block?.weeks ?? 0;
  const days = Object.fromEntries(members.map((m) => [m.id, m.weekdays]));
  const total = sessionsPerWeek(days) * weeks;
  const first = firstWeekday(days);
  const reduceMotion = useReducedMotion();
  const [run, setRun] = React.useState(false);
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setRun(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const counted = Math.round(useTween(run && block !== undefined ? total : null, 900) ?? 0);
  const shown = reduceMotion ? total : counted;
  const on = reminders.settings?.enabled === true;

  const viewed = React.useRef(false);
  React.useEffect(() => {
    if (viewed.current || block === undefined || reminders.settings === null) return;
    viewed.current = true;
    wizard.capture("onboarding_reveal_viewed", {
      path: "plan",
      weeks,
      sessions_planned: total,
      reminders: on ? "on" : "off",
    });
  });

  const changed =
    ready && plan.data.weekChanges.some((c) => members.some((m) => m.id === c.membershipId));
  const main =
    changed && placed[0] !== undefined
      ? weekBars(placed[0].workout, placed[0].m.id, weeks, plan.data.weekChanges, unit, gripName)
      : null;

  const toggle = async (value: boolean): Promise<void> => {
    if (!value) return reminders.save({ enabled: false });
    const granted = await requestNotifications();
    return reminders.save({ enabled: granted, promptSeen: true });
  };

  return (
    <WizardFrame
      wizard={wizard}
      dark
      skip={false}
      footer={
        <Button
          variant="plain"
          height={54}
          label={t("onboarding.firstRun.continue")}
          onPress={() => wizard.next()}
          style={{ backgroundColor: colors.gold }}
        />
      }
    >
      {block !== undefined && start !== null && (
        <>
          <View style={{ gap: 6 }}>
            <Label small color={darkMeta.color}>
              {t("onboarding.plan.yourPlan")}
            </Label>
            <Title size={38} color={colors.white}>
              {block.name}
            </Title>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
              <Text style={[type.display, { fontSize: 52, lineHeight: 56, color: colors.white }]}>
                {shown}
              </Text>
              <Text style={[type.display, { fontSize: 22, color: colors.white }]}>
                {t("onboarding.plan.reveal.sessionsWord", { count: total })}
              </Text>
            </View>
            <Text style={[type.mono, { fontSize: 12, color: darkMeta.color }]}>
              {t("onboarding.plan.reveal.weeksStart", {
                count: weeks,
                date: shortDate(start),
              })}
            </Text>
          </View>
          <PlanCalendar
            start={start}
            weeks={weeks}
            days={placed.map(({ m, workout }) => ({ kind: workout.kind, weekdays: m.weekdays }))}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {placed
              .filter(({ m }) => m.weekdays.length > 0)
              .map(({ m, workout }) => (
                <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: KIND_LOOK[workout.kind].onDark,
                    }}
                  />
                  <Text style={[type.mono, { fontSize: 12, color: colors.white }]}>
                    {workout.name}
                  </Text>
                </View>
              ))}
          </View>
          {main !== null && (
            <View style={{ gap: 8 }}>
              <Label small color={darkMeta.color}>
                {t("onboarding.plan.block.weekByWeek", { name: main.name })}
              </Label>
              <LoadBars bars={main.bars} height={26} />
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.bodyBold, { fontSize: 15, color: colors.white }]}>
                {t("training.reminders")}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12.5,
                  lineHeight: 17,
                  color: darkMeta.color,
                }}
              >
                {t("onboarding.plan.reveal.remindersBody")}
              </Text>
            </View>
            <Switch
              tone="dark"
              checked={on}
              disabled={reminders.settings === null}
              label={t("training.reminders")}
              onChange={(value) =>
                void toggle(value).catch(() => Alert.alert(t("hang.saveFailed")))
              }
            />
          </View>
          {first !== null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="today" size={18} strokeWidth={2.2} color={colors.gold} />
              <Text style={[type.mono, { flex: 1, fontSize: 12, color: colors.white }]}>
                {t("onboarding.plan.reveal.livesOnPlan", { day: weekdayLong(first) })}
              </Text>
            </View>
          )}
        </>
      )}
    </WizardFrame>
  );
}
