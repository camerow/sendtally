import { router } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { JournalEntry, SendtallyApi, SessionRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import {
  ENTRY_BODY_MAX,
  ENTRY_KINDS,
  entryKindLabel,
  isUpdateDraft,
  spansDates,
  useEntryComposer,
  type EntryDraft,
} from "@sendtally/features/journal";
import { useTagVocabulary } from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { press } from "../../lib/press";
import { primaryButton, primaryButtonLabel } from "../../lib/styles";
import { TagPicker } from "../sessions/TagPicker";
import { SessionPicker } from "./SessionPicker";
import { SeverityPicker } from "./SeverityPicker";

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

const action = {
  fontFamily: fonts.monoMedium,
  fontSize: 12,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: colors.labelAccent,
} as const;

const input = {
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

function Field({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={{ gap: 7 }}>
      <Text style={label}>{name}</Text>
      {children}
    </View>
  );
}

export function EntryComposer({
  api,
  initial,
  editing,
  heading,
  sessions,
}: {
  api: SendtallyApi;
  initial: EntryDraft;
  editing?: string;
  heading: string;
  sessions: SessionRow[];
}): React.ReactElement {
  // A new entry replaces its composer with its page. An edit or an update was
  // pushed from the page it belongs to, which reloads when it comes back into focus.
  const onSaved = React.useCallback(
    (entry: JournalEntry) => {
      if (editing !== undefined || entry.parent_id !== null) {
        router.back();
        return;
      }
      router.replace({ pathname: "/journal/[id]", params: { id: entry.id } });
    },
    [editing]
  );
  const { draft, setDraft, saving, error, save } = useEntryComposer(api, initial, {
    editing,
    onSaved,
  });
  const { suggestionsFor } = useTagVocabulary(api);
  const spanning = spansDates(draft.kind);
  const update = isUpdateDraft(draft);
  const [kindOpen, setKindOpen] = React.useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32, gap: 20 }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            minHeight: 44,
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={press({ minHeight: 44, justifyContent: "center" })}
          >
            <Text style={action}>{t("common.back")}</Text>
          </Pressable>
          {!update && (
            <Pressable
              onPress={() => setKindOpen((was) => !was)}
              accessibilityState={{ expanded: kindOpen }}
              style={press({ minHeight: 44, justifyContent: "center" })}
            >
              <Text style={action}>{t("journal.changeKind")}</Text>
            </Pressable>
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
          {heading}
        </Text>

        {!update && kindOpen && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {ENTRY_KINDS.map((kind) => (
              <Chip
                key={kind}
                label={entryKindLabel(kind)}
                active={draft.kind === kind}
                onPress={() => {
                  setDraft((d) => ({ ...d, kind }));
                  setKindOpen(false);
                }}
              />
            ))}
          </View>
        )}

        {(update || draft.kind === "injury") && (
          <View style={{ gap: 8 }}>
            <SeverityPicker
              severity={draft.severity}
              onChange={(severity) => setDraft((d) => ({ ...d, severity }))}
            />
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 12,
                lineHeight: 17,
                color: colors.textMuted,
              }}
            >
              {t("journal.severityOptional")}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field name={t("journal.date")}>
              <TextInput
                testID="entry-date"
                value={draft.occurredAt}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textFaint}
                onChangeText={(occurredAt) => setDraft((d) => ({ ...d, occurredAt }))}
                style={{ ...input, fontFamily: fonts.mono, fontSize: 13 }}
              />
            </Field>
          </View>
          {spanning && (
            <View style={{ flex: 1 }}>
              <Field name={t("journal.endDate")}>
                <TextInput
                  value={draft.endsAt}
                  placeholder={t("journal.endDateOpen")}
                  placeholderTextColor={colors.textFaint}
                  onChangeText={(endsAt) => setDraft((d) => ({ ...d, endsAt }))}
                  style={{ ...input, fontFamily: fonts.mono, fontSize: 13 }}
                />
              </Field>
            </View>
          )}
        </View>

        {!update && (
          <Field name={t("journal.entryTitle")}>
            <TextInput
              testID="entry-title"
              value={draft.title}
              maxLength={200}
              placeholder={t("journal.entryTitlePlaceholder")}
              placeholderTextColor={colors.textFaint}
              onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
              style={input}
            />
          </Field>
        )}

        <Field name={update ? t("journal.whatChanged") : t("journal.body")}>
          <TextInput
            testID="entry-body"
            value={draft.body}
            multiline
            maxLength={ENTRY_BODY_MAX}
            placeholder={update ? t("journal.updatePlaceholder") : t("journal.bodyPlaceholder")}
            placeholderTextColor={colors.textFaint}
            onChangeText={(body) => setDraft((d) => ({ ...d, body }))}
            style={{
              ...input,
              lineHeight: 22,
              minHeight: update ? 110 : 200,
              textAlignVertical: "top",
            }}
          />
        </Field>

        {!update && (
          <Field name={t("common.tags")}>
            <TagPicker
              tags={draft.tags}
              suggestions={suggestionsFor(draft.tags)}
              onAdd={(name) => setDraft((d) => ({ ...d, tags: [...d.tags, name] }))}
              onRemove={(name) =>
                setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== name) }))
              }
            />
          </Field>
        )}

        <SessionPicker
          sessions={sessions}
          occurredAt={draft.occurredAt}
          endsAt={draft.endsAt}
          value={draft.fingerprints}
          onChange={(fingerprints) => setDraft((d) => ({ ...d, fingerprints }))}
        />

        {error !== null && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}>
            {error}
          </Text>
        )}
        <Pressable
          onPress={save}
          disabled={saving}
          style={press({ ...primaryButton, opacity: saving ? 0.6 : 1 })}
        >
          <Text style={primaryButtonLabel}>
            {saving ? t("common.saving") : t("journal.saveEntry")}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
