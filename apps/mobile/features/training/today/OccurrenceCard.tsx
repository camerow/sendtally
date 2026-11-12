import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { occurrenceLink, type Occurrence, occurrenceMeta } from "@sendtally/features/training";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { liveRunHref, useLiveRun } from "../../live-session/liveRun";
import { Button } from "../components/Button";
import { DetailMenu } from "../components/DetailMenu";
import { dayRows } from "../plan-days/dayRows";
import { useDayChanges } from "../plan-days/useDayChanges";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LogItButton } from "../library-detail/LogItButton";
import { StartButton } from "../library-detail/StartButton";
import { type } from "../type";
import { openOccurrence } from "./openOccurrence";
import { DayMark } from "./DayMark";

export type OccurrenceCardProps = { occurrence: Occurrence; workout: LibraryWorkout };

/** A workout due today, its kind marked by its name: the card opens the workout, Start runs what it prescribes, Resume goes back to it running. */
export function OccurrenceCard({ occurrence, workout }: OccurrenceCardProps): React.ReactElement {
  const { model } = useHangData();
  const o = occurrence;
  const planned = { link: occurrenceLink(o), items: o.items, session: o.session };
  const run = useLiveRun();
  const running = run?.workoutId === workout.id ? run : null;
  const changes = useDayChanges();
  return (
    <View
      style={{
        gap: 12,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: colors.white,
      }}
    >
      <Pressable
        onPress={() => openOccurrence(o)}
        accessibilityRole="button"
        style={({ pressed }) => ({ gap: 12, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Title size={28} style={{ flex: 1 }}>
              {workout.name}
            </Title>
            {running === null && (
              <View style={{ marginVertical: -8 }}>
                <DetailMenu
                  rows={dayRows(
                    (kind) => changes.open(kind, o, workout.name),
                    undefined,
                    changes.remove(o)
                  )}
                />
              </View>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <DayMark kind={workout.kind} filled />
            <Text
              style={[
                type.body,
                { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
              ]}
            >
              {occurrenceMeta(o, model.settings.units)}
            </Text>
          </View>
        </View>
      </Pressable>
      {running === null ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StartButton
            workout={workout}
            date={o.date}
            planned={planned}
            height={50}
            style={{ flex: 1 }}
          />
          <LogItButton
            workout={workout}
            date={o.date}
            label={t("workouts.logIt")}
            planned={planned}
            height={50}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Button
          label={t("hang.resume")}
          onPress={() => router.push(liveRunHref(running))}
          variant="primary"
          height={50}
          icon="play"
        />
      )}
      {changes.sheets}
    </View>
  );
}
