import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import {
  durationLabel,
  elapsedLabel,
  idleMinutes,
  wantsWrapUpReminder,
  type StoredSessionDraft,
} from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press, pressRow } from "../../lib/press";
import { ClimbLedgerRow } from "../log-session/ClimbLedgerRow";
import { DayColumn, RowTitle } from "../sessions/SessionRowParts";

const wrapUpButton = {
  minHeight: 32,
  paddingHorizontal: 12,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: radius.control,
} as const;

const buttonLabel = { fontFamily: fonts.sansSemiBold, fontSize: 13 } as const;

function useSecondClock(): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function ReminderBar({
  stored,
  now,
}: {
  stored: StoredSessionDraft;
  now: Date;
}): React.ReactElement {
  const idle = idleMinutes(stored.draft, now);
  const meta =
    idle === null
      ? t("sessions.idleSinceYesterday", {
          date: formatDate(stored.savedAt, { weekday: "long", day: "numeric", month: "short" }),
        })
      : t("sessions.idleFor", { duration: durationLabel(idle) });
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 12,
        backgroundColor: colors.gunmetal,
      }}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: 15,
            lineHeight: 19,
            color: colors.white,
          }}
        >
          {t("sessions.stillClimbing")}
        </Text>
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            lineHeight: 14,
            color: "rgba(238,211,248,0.88)",
          }}
        >
          {meta}
        </Text>
      </View>
      <Pressable
        onPress={wrapUp}
        accessibilityRole="button"
        style={press({ ...wrapUpButton, backgroundColor: colors.gold })}
      >
        <Text style={{ ...buttonLabel, color: colors.gunmetal }}>{t("sessions.wrapUp")}</Text>
      </Pressable>
    </View>
  );
}

const openSession = (): void => router.push("/session/new?resume=1");
const wrapUp = (): void => router.push("/session/new?resume=1&wrapUp=1");

export type LiveSessionCardProps = {
  stored: StoredSessionDraft;
  vocabulary: ClimbVocabulary;
  gym: Gym | null;
  onEditClimb: (key: string) => void;
  onChangeTries: (key: string, tries: number) => void;
};

/** The session being climbed right now, pinned above the log until it is wrapped up. */
export function LiveSessionCard({
  stored,
  vocabulary,
  gym,
  onEditClimb,
  onChangeTries,
}: LiveSessionCardProps): React.ReactElement {
  const now = useSecondClock();
  const { draft, savedAt } = stored;
  const title = draft.name.trim() === "" ? t("sessions.unfinishedSession") : draft.name;
  const meta = [
    t("sessions.liveMeta", { elapsed: elapsedLabel(draft, now) }),
    ...(gym === null ? [] : [gym.name]),
  ].join(" · ");

  return (
    <View>
      {wantsWrapUpReminder(draft, now) && <ReminderBar stored={stored} now={now} />}
      <View
        style={{
          gap: 10,
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 14,
          backgroundColor: "rgba(249,220,92,0.16)",
          borderBottomWidth: 1,
          borderBottomColor: colors.lineOnLightSoft,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={openSession}
            accessibilityRole="button"
            accessibilityLabel={`${title}, ${meta}`}
            style={pressRow({ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 })}
          >
            <DayColumn
              weekday={formatDate(savedAt, { weekday: "short" })}
              day={formatDate(savedAt, { day: "numeric" })}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <RowTitle
                title={title}
                meta={meta}
                marker={
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.watermelonInk,
                    }}
                  />
                }
              />
            </View>
            <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
          </Pressable>
        </View>
        {draft.climbs.length > 0 && (
          <View
            style={{
              paddingHorizontal: 10,
              borderRadius: radius.card,
              borderWidth: 1,
              borderColor: colors.lineOnLightSoft,
              backgroundColor: colors.white,
            }}
          >
            {draft.climbs.map((climb) => (
              <ClimbLedgerRow
                key={climb.key}
                climb={climb}
                project={climb.project ?? vocabulary.isProject(climb.name)}
                onPress={() => onEditClimb(climb.key)}
                onChangeTries={(tries) => onChangeTries(climb.key, tries)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
