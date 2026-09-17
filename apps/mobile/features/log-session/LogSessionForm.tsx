import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { AppState, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import { findClimb, useClimbVocabulary } from "@sendtally/features/climbs";
import {
  draftProblem,
  draftSummary,
  disciplineOf,
  emptyDraft,
  storedDraft,
  circuitGyms,
  newClimbOfKind,
  nextClimbKey,
  readClimbKind,
  toLogSessionInput,
  useDraftAutosave,
  withClimbName,
  withClimbScale,
  withPickedClimb,
  withStartTime,
  withTag,
  withoutTag,
  type ClimbDraft,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { SESSION_NOTE_MAX, useTagVocabulary } from "@sendtally/features/sessions";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { useApi } from "../../lib/api";
import { queries } from "@sendtally/features/query";
import { climbKindStorage } from "../../lib/climbKindStorage";
import { sessionDraftStorage } from "../../lib/sessionDraftStorage";
import { confirmDiscardDraft } from "../../lib/confirmDiscardDraft";
import { DraftBanner } from "./DraftBanner";
import { TagPicker } from "../sessions/TagPicker";
import {
  circuitGym,
  gymOfDraft,
  useGyms,
  withCircuit,
  withoutCircuit,
  type Gym,
} from "@sendtally/features/gyms";
import { OptionRow } from "../../components/OptionRow";
import { SelectRow } from "../../components/SelectRow";
import { ClimbEditorSheet } from "./ClimbEditorSheet";
import { ClimbLedgerRow } from "./ClimbLedgerRow";
import { DateTimeField } from "../../components/DateTimeField";
import { press } from "../../lib/press";

function LabelText({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: fonts.monoMedium,
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: colors.textSecondary,
      }}
    >
      {children}
    </Text>
  );
}

function Chip({
  label,
  active,
  activeColor = colors.gold,
  activeText = colors.gunmetal,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor?: string;
  activeText?: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={press({
        paddingHorizontal: 14,
        minHeight: 40,
        justifyContent: "center",
        borderRadius: radius.pill,
        backgroundColor: active ? activeColor : "transparent",
        borderWidth: 1,
        borderColor: active ? activeColor : "rgba(64,63,76,0.18)",
      })}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: active ? activeText : "rgba(64,63,76,0.65)",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const inputStyle = {
  fontFamily: fonts.sans,
  fontSize: 15,
  color: colors.gunmetal,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: "rgba(64,63,76,0.15)",
  borderRadius: radius.control,
  paddingHorizontal: 13,
  paddingVertical: 12,
} as const;

export function LogSessionForm({
  editing,
}: {
  editing?: { fingerprint: string; draft: LogSessionDraft };
}): React.ReactElement {
  const api = useApi();
  const client = useQueryClient();
  const { resume, wrapUp } = useLocalSearchParams<{ resume?: string; wrapUp?: string }>();
  const { scales: gradePrefs, ready: prefsReady } = useGradeScalePrefs(api);
  // Opened by tapping the draft itself: start on it rather than offering it back.
  const [picked] = React.useState(() => (resume === "1" ? storedDraft(sessionDraftStorage) : null));
  const [draft, setDraft] = React.useState<LogSessionDraft>(
    () => editing?.draft ?? picked ?? emptyDraft(new Date(), gradePrefs)
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { suggestionsFor } = useTagVocabulary(api);
  const vocabulary = useClimbVocabulary(api);
  const gyms = useGyms(api);
  const circuitChoices = draft.location === "indoor" ? circuitGyms(gyms.gyms) : [];
  // Changing the gym re-places every climb: onto the new gym's first circuit, or off circuits.
  const setGym = (next: Gym | null): void => {
    const at = circuitGym(next);
    const first = at?.circuits[0];
    setDraft({
      ...draft,
      ...(next === null ? { gymId: undefined } : { gymId: next.id }),
      climbs: draft.climbs.map((c) =>
        at === null || first === undefined
          ? withoutCircuit(c)
          : withCircuit(c, at.circuits.find((x) => x.id === c.circuit?.id) ?? first, at)
      ),
    });
  };
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const editingIndex = draft.climbs.findIndex((c) => c.key === editingKey);
  const editingClimb = editingIndex < 0 ? null : draft.climbs[editingIndex]!;

  // The preference query resolves after the first render, so a new draft adopts the user's
  // scale once, per discipline and only where no grade has been typed yet. A draft picked
  // back up, and anything already graded, keeps the scale it was written in.
  const adopted = React.useRef(editing !== undefined || picked !== null);
  const resumeDraft = React.useCallback((resumed: LogSessionDraft) => {
    adopted.current = true;
    setDraft(resumed);
  }, []);
  const autosave = useDraftAutosave(
    editing === undefined ? sessionDraftStorage : null,
    draft,
    resumeDraft,
    picked !== null
  );

  React.useEffect(() => {
    if (adopted.current || !prefsReady) return;
    adopted.current = true;
    const next = {
      ...draft,
      climbs: draft.climbs.map((c) =>
        c.grade === "" ? withClimbScale(c, gradePrefs[disciplineOf(c.scale)]) : c
      ),
    };
    autosave.rebase(next);
    setDraft(next);
  }, [prefsReady, gradePrefs, draft, autosave]);
  // iOS gives a backgrounded app no unmount, so the pending write goes out as it leaves.
  const flush = autosave.flush;
  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") flush();
    });
    return () => subscription.remove();
  }, [flush]);

  function updateClimb(key: string, patch: (climb: ClimbDraft) => ClimbDraft): void {
    setDraft((d) => ({ ...d, climbs: d.climbs.map((c) => (c.key === key ? patch(c) : c)) }));
  }

  function updateClimbName(key: string, name: string): void {
    updateClimb(key, (c) => withClimbName(c, name, findClimb(vocabulary.climbs, name)));
  }

  function pickClimb(key: string, known: ClimbSummary): void {
    updateClimb(key, (c) => withPickedClimb(c, known));
  }

  function removeClimb(key: string): void {
    setDraft((d) => ({ ...d, climbs: d.climbs.filter((c) => c.key !== key) }));
    setEditingKey(null);
  }

  function addClimb(): void {
    const key = nextClimbKey(draft.climbs);
    const previous = draft.climbs[draft.climbs.length - 1];
    setDraft({
      ...draft,
      climbs: [
        ...draft.climbs,
        newClimbOfKind(
          key,
          readClimbKind(climbKindStorage, circuitChoices),
          gradePrefs,
          circuitChoices,
          previous
        ),
      ],
    });
    setEditingKey(key);
  }

  function isProject(climb: ClimbDraft): boolean {
    return climb.project ?? vocabulary.isProject(climb.name);
  }

  function toggleProject(climb: ClimbDraft): void {
    updateClimb(climb.key, (c) => ({ ...c, project: !isProject(c) }));
  }

  /** Cancel abandons the draft, so it only leaves one behind after a confirmation. */
  function cancel(): void {
    if (autosave.savedAt === null) {
      router.back();
      return;
    }
    confirmDiscardDraft({ draft, savedAt: autosave.savedAt }, () => {
      autosave.clear();
      router.back();
    });
  }

  async function save(): Promise<void> {
    const problem = draftProblem(draft);
    if (problem !== null) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = toLogSessionInput(draft);
      const { session } =
        editing === undefined
          ? await api.logSession(input)
          : await api.updateLoggedSession(editing.fingerprint, input);
      // The response is written before a Strava post starts, so it opens the
      // page at once but is stored stale for the page to re-read on mount.
      client.setQueryData(queries.session(api, session.fingerprint).queryKey, session, {
        updatedAt: 0,
      });
      autosave.clear();
      router.replace(`/session/${encodeURIComponent(session.fingerprint)}`);
    } catch {
      setError(t("logSession.saveFailed"));
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24, gap: 14 }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ minHeight: 32, justifyContent: "center" }}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 11,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: colors.labelAccent,
            }}
          >
            {editing === undefined ? t("sessions.back") : t("logSession.backToSession")}
          </Text>
        </Pressable>
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 32,
              letterSpacing: -1,
              color: colors.gunmetal,
            }}
          >
            {editing !== undefined
              ? t("logSession.editTitle")
              : picked === null
                ? t("common.logASession")
                : wrapUp === "1"
                  ? t("logSession.wrapUpTitle")
                  : draft.name.trim() || t("sessions.unfinishedSession")}
          </Text>
          {(editing !== undefined || picked !== null) && (
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: colors.textMuted,
              }}
            >
              {editing !== undefined
                ? t("logSession.editSubtitle")
                : t("logSession.wrapUpSubtitle")}
            </Text>
          )}
        </View>

        {autosave.offered !== null && (
          <DraftBanner
            stored={autosave.offered}
            onResume={autosave.resume}
            onStartFresh={autosave.startFresh}
          />
        )}

        <View style={{ gap: 7 }}>
          <LabelText>{t("logSession.sessionNameOptional")}</LabelText>
          <TextInput
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            value={draft.name}
            placeholder={t("logSession.sessionNamePlaceholder")}
            placeholderTextColor={colors.textFaint}
            onChangeText={(name) => setDraft({ ...draft, name })}
            style={inputStyle}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, gap: 7 }}>
            <LabelText>{t("logSession.date")}</LabelText>
            <DateTimeField
              mode="date"
              value={draft.date}
              label={t("logSession.date")}
              onChange={(date) => setDraft({ ...draft, date })}
            />
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <LabelText>{t("logSession.start")}</LabelText>
            <DateTimeField
              mode="time"
              value={draft.startTime}
              label={t("logSession.start")}
              onChange={(startTime) => setDraft((d) => withStartTime(d, startTime))}
            />
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <LabelText>{t("logSession.end")}</LabelText>
            <DateTimeField
              mode="time"
              value={draft.endTime}
              label={t("logSession.end")}
              onChange={(endTime) => setDraft({ ...draft, endTime })}
            />
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <LabelText>{t("logSession.location")}</LabelText>
          <View style={{ flexDirection: "row", gap: 7 }}>
            <Chip
              label={t("common.indoor")}
              active={draft.location === "indoor"}
              onPress={() => setDraft({ ...draft, location: "indoor" })}
            />
            <Chip
              label={t("common.outdoor")}
              active={draft.location === "outdoor"}
              onPress={() => setDraft({ ...draft, location: "outdoor" })}
            />
          </View>
        </View>

        {draft.location === "indoor" && (!gyms.ready || gyms.gyms.length > 0) && (
          <View style={{ gap: 7 }}>
            <LabelText>{t("gyms.gym")}</LabelText>
            <SelectRow
              label={t("gyms.gym")}
              value={
                gyms.ready
                  ? (gymOfDraft(gyms.gyms, draft.gymId)?.name ?? t("gyms.noGym"))
                  : t("common.loading")
              }
            >
              {(close) =>
                [null, ...gyms.gyms].map((g) => (
                  <OptionRow
                    key={g === null ? "-" : g.id}
                    label={g === null ? t("gyms.noGym") : g.name}
                    mono={false}
                    selected={(g?.id ?? undefined) === draft.gymId}
                    onPress={() => {
                      setGym(g);
                      close();
                    }}
                  />
                ))
              }
            </SelectRow>
          </View>
        )}

        <View style={{ gap: 7 }}>
          <LabelText>{t("logSession.tagsOptional")}</LabelText>
          <TagPicker
            tags={draft.tags}
            suggestions={suggestionsFor(draft.tags)}
            placeholder={t("logSession.tagsPlaceholder")}
            onAdd={(name) => setDraft((d) => withTag(d, name))}
            onRemove={(name) => setDraft((d) => withoutTag(d, name))}
          />
        </View>

        <View style={{ gap: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 7 }}>
              <LabelText>RPE</LabelText>
              <Text
                style={{
                  fontFamily: fonts.monoSemiBold,
                  fontSize: 17,
                  color: colors.gunmetal,
                  textTransform: "uppercase",
                }}
              >
                {draft.rpe === null ? t("logSession.auto") : `${draft.rpe}/10`}
              </Text>
            </View>
            {draft.rpe !== null && (
              <Pressable
                onPress={() => setDraft({ ...draft, rpe: null })}
                style={{ minHeight: 32, justifyContent: "center" }}
              >
                <Text
                  style={{
                    fontFamily: fonts.monoMedium,
                    fontSize: 10,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: colors.azureInk,
                  }}
                >
                  {t("logSession.resetToAuto")}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 3 }}>
            {Array.from({ length: 10 }, (_, i) => {
              const value = i + 1;
              const lit = draft.rpe !== null && value <= draft.rpe;
              return (
                <Pressable
                  key={value}
                  onPress={() => setDraft({ ...draft, rpe: value })}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 4,
                    backgroundColor: lit ? colors.azure : colors.dataBarEmpty,
                  }}
                />
              );
            })}
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <LabelText>{t("logSession.notesOptional")}</LabelText>
          <TextInput
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            value={draft.notes}
            multiline
            maxLength={SESSION_NOTE_MAX}
            placeholder={t("common.notesPlaceholder")}
            placeholderTextColor={colors.textFaint}
            onChangeText={(notes) => setDraft({ ...draft, notes })}
            style={{ ...inputStyle, minHeight: 96, lineHeight: 22, textAlignVertical: "top" }}
          />
        </View>

        <View style={{ marginTop: 2 }}>
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: colors.labelAccent,
            }}
          >
            {t("logSession.climbsCount", { n: draft.climbs.length })}
          </Text>
        </View>

        <View>
          {draft.climbs.map((climb) => (
            <ClimbLedgerRow
              key={climb.key}
              climb={climb}
              project={isProject(climb)}
              onPress={() => setEditingKey(climb.key)}
            />
          ))}
        </View>
        <Pressable
          onPress={addClimb}
          style={press({
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "rgba(64,63,76,0.25)",
            borderRadius: radius.card,
          })}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: colors.azureInk,
            }}
          >
            {`+ ${t("logSession.addClimb")}`}
          </Text>
        </Pressable>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.textFaint,
            textAlign: "center",
          }}
        >
          {t("logSession.tapToEdit")}
        </Text>

        {error !== null && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
            {error}
          </Text>
        )}
      </ScrollView>

      <ClimbEditorSheet
        climb={editingClimb}
        index={editingIndex}
        count={draft.climbs.length}
        prefs={gradePrefs}
        gyms={circuitChoices}
        project={editingClimb === null ? false : isProject(editingClimb)}
        known={
          editingClimb === null ? null : (findClimb(vocabulary.climbs, editingClimb.name) ?? null)
        }
        suggestions={vocabulary.suggestionsFor(editingClimb?.name ?? "")}
        onChange={(c) => updateClimb(c.key, () => c)}
        onChangeName={(name) => {
          if (editingClimb !== null) updateClimbName(editingClimb.key, name);
        }}
        onPick={(known) => {
          if (editingClimb !== null) pickClimb(editingClimb.key, known);
        }}
        onToggleProject={() => {
          if (editingClimb !== null) toggleProject(editingClimb);
        }}
        onRemove={() => {
          if (editingClimb !== null) removeClimb(editingClimb.key);
        }}
        onClose={() => setEditingKey(null)}
      />

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLight,
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 10,
          gap: 8,
          backgroundColor: colors.white,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          {draftSummary(draft)}
        </Text>
        {autosave.savedAt !== null && (
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: colors.textFaint,
              textAlign: "center",
            }}
          >
            {t("logSession.draftSaved", {
              time: formatDate(autosave.savedAt, { hour: "2-digit", minute: "2-digit" }),
            })}
          </Text>
        )}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={cancel}
            disabled={saving}
            style={press({
              flex: 1,
              minHeight: 50,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.control,
              borderWidth: 1,
              borderColor: "rgba(64,63,76,0.24)",
            })}
          >
            <Text
              style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textSecondary }}
            >
              {t("common.discard")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void save()}
            disabled={saving}
            style={{
              flex: 2,
              minHeight: 50,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.control,
              backgroundColor: colors.azureInk,
              opacity: saving ? 0.45 : 1,
            }}
          >
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
              {saving
                ? t("common.saving")
                : editing === undefined
                  ? t("logSession.logSession")
                  : t("logSession.saveChanges")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
