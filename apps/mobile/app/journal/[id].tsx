import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  EntryDetail,
  JournalEntry,
  SessionRow as SessionRowData,
} from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import {
  dayLabel,
  daysSince,
  entryHasTitle,
  entryTitle,
  entryWhen,
  linkedSessions,
  sessionsInSpan,
  sessionsNearPoints,
  severitySeries,
  useEntryDetail,
} from "@sendtally/features/journal";
import { sessionTitle } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { BackButton } from "../../components/BackButton";
import { EntryKindChip } from "../../features/journal/EntryKindChip";
import { SeverityChart } from "../../features/journal/SeverityChart";
import { TripBody } from "../../features/journal/TripBody";
import { RowTags } from "../../features/sessions/RowTags";
import { SessionRow } from "../../features/sessions/SessionRow";
import { useApi } from "../../lib/api";
import { press } from "../../lib/press";

const action = {
  fontFamily: fonts.monoMedium,
  fontSize: 12,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: colors.labelAccent,
} as const;

const cardLabel = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.7,
  textTransform: "uppercase",
  color: colors.textMuted,
} as const;

const body = {
  fontFamily: fonts.sans,
  fontSize: 16,
  lineHeight: 25,
  color: "rgba(64,63,76,0.88)",
} as const;

const card = {
  gap: 12,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.lineOnLightSoft,
  borderRadius: radius.card,
  padding: 16,
} as const;

function HeaderAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable onPress={onPress} style={press({ minHeight: 44, justifyContent: "center" })}>
      <Text style={action}>{label}</Text>
    </Pressable>
  );
}

function SessionCard({
  label,
  sessions,
}: {
  label: string;
  sessions: SessionRowData[];
}): React.ReactElement {
  return (
    <View style={{ ...card, paddingHorizontal: 0, paddingBottom: 0 }}>
      <Text style={{ ...cardLabel, paddingHorizontal: 16 }}>{label}</Text>
      <View>
        {sessions.map((session) => (
          <SessionRow
            key={session.fingerprint}
            session={session}
            title={sessionTitle(session)}
            onPress={() =>
              router.push({
                pathname: "/session/[fingerprint]",
                params: { fingerprint: session.fingerprint },
              })
            }
          />
        ))}
      </View>
    </View>
  );
}

export default function EntryDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const [deleting, setDeleting] = React.useState(false);

  const { state } = useEntryDetail(api, id ?? "");

  // An update is read on its thread, never on a page of its own.
  const parentId = state.status === "ready" ? state.data.entry.parent_id : null;
  React.useEffect(() => {
    if (parentId !== null) router.replace({ pathname: "/journal/[id]", params: { id: parentId } });
  }, [parentId]);

  function confirmDelete(entry: EntryDetail): void {
    Alert.alert(t("journal.deleteTitle"), t("journal.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          setDeleting(true);
          api
            .deleteEntry(entry.id)
            .then(() => router.replace("/(tabs)/sessions"))
            .catch(() => {
              setDeleting(false);
              Alert.alert(t("journal.deleteFailed"), t("common.somethingWentWrongTryAgain"));
            });
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24, gap: 14 }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            minHeight: 44,
            alignItems: "center",
          }}
        >
          <BackButton />
          {state.status === "ready" && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <HeaderAction
                label={t("common.edit")}
                onPress={() =>
                  router.push({
                    pathname: "/journal/[id]/edit",
                    params: { id: state.data.entry.id },
                  })
                }
              />
              <HeaderAction
                label={deleting ? t("common.deleting") : t("common.delete")}
                onPress={() => {
                  if (!deleting) confirmDelete(state.data.entry);
                }}
              />
            </View>
          )}
        </View>

        {state.status === "loading" && <ActivityIndicator color={colors.gunmetal} />}
        {state.status === "error" && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
            {t("journal.loadFailed")}
          </Text>
        )}
        {state.status === "ready" && (
          <Loaded
            entry={state.data.entry}
            sessions={state.data.sessions}
            entries={state.data.entries}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Loaded({
  entry,
  sessions,
  entries,
}: {
  entry: EntryDetail;
  sessions: SessionRowData[];
  entries: JournalEntry[];
}): React.ReactElement {
  const linked = linkedSessions(sessions, entry);
  // An injury's dates match sessions rather than linking them; anything linked is not listed twice.
  const inSpan =
    entry.kind === "injury"
      ? sessionsInSpan(sessions, entry).filter((s) => !entry.fingerprints.includes(s.fingerprint))
      : [];
  const points = severitySeries(entry, entry.updates);
  const sessionsPerPoint = sessionsNearPoints(sessions, points);
  const titled = entryHasTitle(entry);
  const dayCount =
    entry.kind === "injury" && entry.status === "ongoing"
      ? t("journal.dayN", { n: daysSince(entry.occurred_at) })
      : null;
  const meta = [titled ? entryWhen(entry) : null, dayCount].filter(Boolean).join(" · ");

  return (
    <>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <EntryKindChip kind={entry.kind} />
          {entry.kind === "injury" && (
            <EntryKindChip
              kind="status"
              label={t(entry.status === "resolved" ? "journal.resolved" : "journal.ongoing")}
            />
          )}
        </View>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 24,
            letterSpacing: -0.5,
            color: colors.gunmetal,
          }}
        >
          {titled ? entryTitle(entry) : entryWhen(entry)}
        </Text>
        {meta !== "" && <Text style={cardLabel}>{meta}</Text>}
        <RowTags tags={entry.tags} />
      </View>

      {entry.body.trim() !== "" && <Text style={body}>{entry.body.trim()}</Text>}

      {linked.length > 0 && (
        <SessionCard
          label={t("journal.sessionCount", { count: linked.length })}
          sessions={linked}
        />
      )}
      {inSpan.length > 0 && (
        <SessionCard
          label={t("journal.sessionsInSpan", { count: inSpan.length })}
          sessions={inSpan}
        />
      )}
      {entry.kind === "trip" && <TripBody trip={entry} sessions={sessions} entries={entries} />}

      {entry.kind === "injury" && (
        <View style={card}>
          <View
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={{ ...cardLabel, flexShrink: 1 }}>
              {t("journal.howItFeels")} · {t("journal.severityScale")}
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/journal/new",
                  params: { kind: "journal", parent: entry.id },
                })
              }
              style={press({ minHeight: 32, justifyContent: "center" })}
            >
              <Text style={{ ...cardLabel, color: colors.azureInk }}>{t("journal.addUpdate")}</Text>
            </Pressable>
          </View>
          <SeverityChart points={points} sessionsPerPoint={sessionsPerPoint} />
          {entry.updates.length === 0 && (
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted }}>
              {t("journal.noUpdatesYet")}
            </Text>
          )}
          {[...entry.updates].reverse().map((update) => (
            <View
              key={update.id}
              style={{
                flexDirection: "row",
                gap: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.lineOnLightSoft,
              }}
            >
              <Text
                style={{
                  width: 64,
                  fontFamily: fonts.monoSemiBold,
                  fontSize: 13,
                  color: colors.gunmetal,
                }}
              >
                {dayLabel(update.occurred_at)}
              </Text>
              <View style={{ flex: 1, gap: 6 }}>
                {update.severity !== null && (
                  <Text
                    style={{
                      alignSelf: "flex-start",
                      fontFamily: fonts.monoSemiBold,
                      fontSize: 10,
                      letterSpacing: 0.6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: radius.pill,
                      overflow: "hidden",
                      backgroundColor: "rgba(196,48,61,0.12)",
                      color: colors.watermelonInk,
                    }}
                  >
                    {t("journal.severityValue", { n: update.severity })}
                  </Text>
                )}
                {update.body.trim() !== "" && (
                  <Text style={{ ...body, fontSize: 15, lineHeight: 23 }}>{update.body}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
}
