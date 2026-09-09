import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import { climbDraftGrade, findClimb, useClimbVocabulary } from "@sendtally/features/climbs";
import {
  GRADE_SCALE_OPTIONS,
  draftGrade,
  draftProblem,
  draftSummary,
  emptyDraft,
  newClimb,
  toLogSessionInput,
  withScale,
  withTag,
  withoutTag,
  type ClimbDraft,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { useTagVocabulary } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { useApi } from "../../lib/api";
import { TagPicker } from "../sessions/TagPicker";
import { ClimbEditorSheet } from "./ClimbEditorSheet";
import { ClimbLedgerRow } from "./ClimbLedgerRow";

function LabelText({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: fonts.monoMedium,
        fontSize: 10,
        letterSpacing: 0.8,
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
      style={{
        paddingHorizontal: 14,
        minHeight: 40,
        justifyContent: "center",
        borderRadius: radius.pill,
        backgroundColor: active ? activeColor : "transparent",
        borderWidth: 1,
        borderColor: active ? activeColor : "rgba(64,63,76,0.18)",
      }}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 10,
          letterSpacing: 0.6,
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
  const [draft, setDraft] = React.useState<LogSessionDraft>(
    () => editing?.draft ?? emptyDraft(new Date())
  );
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const nextKey = React.useRef(draft.climbs.length + 1);
  const { suggestionsFor } = useTagVocabulary(api);
  const vocabulary = useClimbVocabulary(api);
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const editingIndex = draft.climbs.findIndex((c) => c.key === editingKey);
  const editingClimb = editingIndex < 0 ? null : draft.climbs[editingIndex]!;

  function updateClimb(key: string, patch: (climb: ClimbDraft) => ClimbDraft): void {
    setDraft((d) => ({ ...d, climbs: d.climbs.map((c) => (c.key === key ? patch(c) : c)) }));
  }

  function updateClimbName(key: string, name: string): void {
    const known = findClimb(vocabulary.climbs, name);
    updateClimb(key, (c) => ({
      ...c,
      name,
      ...(known === undefined ? {} : { grade: climbDraftGrade(known, draft.scale) }),
    }));
  }

  function pickClimb(key: string, known: ClimbSummary): void {
    updateClimb(key, (c) => ({
      ...c,
      name: known.name,
      grade: climbDraftGrade(known, draft.scale),
    }));
  }

  function removeClimb(key: string): void {
    setDraft((d) => ({ ...d, climbs: d.climbs.filter((c) => c.key !== key) }));
    setEditingKey(null);
  }

  function addClimb(): void {
    const key = `climb-${nextKey.current++}`;
    setDraft((d) => ({ ...d, climbs: [...d.climbs, newClimb(key, d.scale)] }));
    setEditingKey(key);
  }

  async function toggleProject(climb: ClimbDraft): Promise<void> {
    const grade = draftGrade(climb.grade, draft.scale);
    if (grade === undefined) return;
    setError(null);
    try {
      await vocabulary.setProject(climb.name, grade, !vocabulary.isProject(climb.name));
    } catch {
      setError("Could not update the project. Try again.");
    }
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
      router.replace(`/session/${encodeURIComponent(session.fingerprint)}`);
    } catch {
      setError("Could not save the session. Try again.");
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
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
              color: colors.watermelonInk,
            }}
          >
            {editing === undefined ? "← SESSIONS" : "← SESSION"}
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
            {editing === undefined ? "Log a session" : "Edit session"}
          </Text>
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              color: colors.textMuted,
            }}
          >
            {editing === undefined
              ? "MANUAL ENTRY · EFFORT SCORED ON SAVE"
              : "EFFORT IS RE-SCORED WHEN YOU SAVE"}
          </Text>
        </View>

        <View style={{ gap: 7 }}>
          <LabelText>SESSION NAME · OPTIONAL</LabelText>
          <TextInput
            value={draft.name}
            placeholder="Tuesday night session"
            placeholderTextColor={colors.textFaint}
            onChangeText={(name) => setDraft({ ...draft, name })}
            style={inputStyle}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, gap: 7 }}>
            <LabelText>DATE</LabelText>
            <TextInput
              value={draft.date}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textFaint}
              onChangeText={(date) => setDraft({ ...draft, date })}
              style={{ ...inputStyle, fontFamily: fonts.mono, fontSize: 13 }}
            />
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <LabelText>START</LabelText>
            <TextInput
              value={draft.startTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textFaint}
              onChangeText={(startTime) => setDraft({ ...draft, startTime })}
              style={{ ...inputStyle, fontFamily: fonts.mono, fontSize: 13 }}
            />
          </View>
          <View style={{ flex: 1, gap: 7 }}>
            <LabelText>END</LabelText>
            <TextInput
              value={draft.endTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textFaint}
              onChangeText={(endTime) => setDraft({ ...draft, endTime })}
              style={{ ...inputStyle, fontFamily: fonts.mono, fontSize: 13 }}
            />
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <LabelText>LOCATION</LabelText>
          <View style={{ flexDirection: "row", gap: 7 }}>
            <Chip
              label="INDOOR"
              active={draft.location === "indoor"}
              onPress={() => setDraft({ ...draft, location: "indoor" })}
            />
            <Chip
              label="OUTDOOR"
              active={draft.location === "outdoor"}
              onPress={() => setDraft({ ...draft, location: "outdoor" })}
            />
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <LabelText>TAGS · OPTIONAL</LabelText>
          <TagPicker
            tags={draft.tags}
            suggestions={suggestionsFor(draft.tags)}
            placeholder="Endurance, Bishop…"
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
                style={{ fontFamily: fonts.monoSemiBold, fontSize: 17, color: colors.gunmetal }}
              >
                {draft.rpe === null ? "AUTO" : `${draft.rpe}/10`}
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
                    color: colors.azureInk,
                  }}
                >
                  RESET TO AUTO
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

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              color: colors.watermelonInk,
            }}
          >
            CLIMBS · {draft.climbs.length}
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {GRADE_SCALE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={draft.scale === option.value}
                onPress={() => setDraft(withScale(draft, option.value))}
              />
            ))}
          </View>
        </View>

        <View>
          {draft.climbs.map((climb) => (
            <ClimbLedgerRow
              key={climb.key}
              climb={climb}
              project={vocabulary.isProject(climb.name)}
              onPress={() => setEditingKey(climb.key)}
            />
          ))}
        </View>
        <Pressable
          onPress={addClimb}
          style={{
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "rgba(64,63,76,0.25)",
            borderRadius: radius.card,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.8,
              color: colors.azureInk,
            }}
          >
            + ADD CLIMB
          </Text>
        </Pressable>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            color: colors.textFaint,
            textAlign: "center",
          }}
        >
          TAP A CLIMB TO EDIT IT
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
        scale={draft.scale}
        project={editingClimb === null ? false : vocabulary.isProject(editingClimb.name)}
        suggestions={vocabulary.suggestionsFor(editingClimb?.name ?? "")}
        onChange={(c) => updateClimb(c.key, () => c)}
        onChangeName={(name) => {
          if (editingClimb !== null) updateClimbName(editingClimb.key, name);
        }}
        onPick={(known) => {
          if (editingClimb !== null) pickClimb(editingClimb.key, known);
        }}
        onToggleProject={() => {
          if (editingClimb !== null) void toggleProject(editingClimb);
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
            color: colors.textMuted,
            textAlign: "center",
          }}
        >
          {draftSummary(draft)}
        </Text>
        <Pressable
          onPress={() => void save()}
          disabled={saving}
          style={{
            minHeight: 50,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.control,
            backgroundColor: colors.azureInk,
            opacity: saving ? 0.45 : 1,
          }}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
            {saving ? "Saving…" : editing === undefined ? "Log session" : "Save changes"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
