import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type { Gym } from "@sendtally/features/gyms";
import type { LiveSyncStatus, StoredSessionDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press, pressRow } from "../../lib/press";
import { ClimbLedgerRow } from "../log-session/ClimbLedgerRow";
import { LiveEnduranceClimb } from "./LiveEnduranceClimb";
import { DayColumn, RowTitle } from "../sessions/SessionRowParts";

const button = {
  minHeight: 32,
  paddingHorizontal: 12,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: radius.control,
} as const;

const buttonLabel = { fontFamily: fonts.sansSemiBold, fontSize: 13 } as const;

function syncLabel(status: LiveSyncStatus): string {
  if (status === "saving") return t("sessions.saving");
  if (status === "failed") return t("sessions.notSavedYet");
  return t("sessions.savedAsYouGo");
}

export type LiveSessionCardProps = {
  stored: StoredSessionDraft;
  status: LiveSyncStatus;
  vocabulary: ClimbVocabulary;
  gym: Gym | null;
  onEditClimb: (key: string) => void;
  onChangeTries: (key: string, tries: number) => void;
  onSent: (key: string) => void;
  onToggleSent: (key: string) => void;
  onAddLap: (key: string) => void;
};

/** The session being climbed right now, pinned above the log while it is saved as it goes. */
export function LiveSessionCard({
  stored,
  status,
  vocabulary,
  gym,
  onEditClimb,
  onChangeTries,
  onSent,
  onToggleSent,
  onAddLap,
}: LiveSessionCardProps): React.ReactElement {
  const { draft, savedAt, fingerprint } = stored;
  const last = draft.climbs.at(-1);
  const title = draft.name.trim() === "" ? t("sessions.unfinishedSession") : draft.name;
  const meta = [syncLabel(status), ...(gym === null ? [] : [gym.name])].join(" · ");
  const open = (): void => {
    if (fingerprint !== undefined)
      router.push({ pathname: "/session/[fingerprint]", params: { fingerprint } });
  };
  const addDetails = (): void => {
    if (fingerprint !== undefined)
      router.push({ pathname: "/session/[fingerprint]/edit", params: { fingerprint } });
  };

  return (
    <View
      style={{
        gap: 10,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: "rgba(249,220,92,0.85)",
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable
          onPress={open}
          disabled={fingerprint === undefined}
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
        </Pressable>
        <Pressable
          onPress={addDetails}
          disabled={fingerprint === undefined}
          accessibilityRole="button"
          style={press({
            ...button,
            backgroundColor: colors.gunmetal,
            opacity: fingerprint === undefined ? 0.4 : 1,
          })}
        >
          <Text style={{ ...buttonLabel, color: colors.white }}>{t("sessions.addDetails")}</Text>
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
          {draft.climbs.map((climb) =>
            climb.endurance === undefined ? (
              <ClimbLedgerRow
                key={climb.key}
                climb={climb}
                project={climb.project ?? vocabulary.isProject(climb.name)}
                onPress={() => onEditClimb(climb.key)}
                onChangeTries={(tries) => onChangeTries(climb.key, tries)}
                onToggleSent={() => onToggleSent(climb.key)}
              />
            ) : (
              <LiveEnduranceClimb
                key={climb.key}
                climb={climb}
                onPress={() => onEditClimb(climb.key)}
                onAddLap={() => onAddLap(climb.key)}
              />
            )
          )}
          {last !== undefined && last.endurance === undefined && last.kind === "attempt" && (
            <Pressable
              onPress={() => onSent(last.key)}
              accessibilityRole="button"
              style={press({
                ...button,
                minHeight: 38,
                marginVertical: 10,
                flexDirection: "row",
                gap: 6,
                backgroundColor: colors.azureInk,
              })}
            >
              <Icon name="check" size={14} strokeWidth={2.4} color={colors.white} />
              <Text style={{ ...buttonLabel, color: colors.white }}>{t("common.sent")}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
