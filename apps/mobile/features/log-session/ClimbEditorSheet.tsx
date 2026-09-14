import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import { climbDraftGrade, projectMetaLabel } from "@sendtally/features/climbs";
import {
  disciplineLabel,
  disciplineOf,
  gradeOptions,
  sendStyleLabel,
  sendStylesFor,
  withClimbDiscipline,
  withClimbOutcome,
  type ClimbDraft,
  type ClimbStyle,
  type Discipline,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { press, pressRow } from "../../lib/press";

export type ClimbEditorSheetProps = {
  climb: ClimbDraft | null;
  index: number;
  count: number;
  prefs: GradePrefs;
  project: boolean;
  known: ClimbSummary | null;
  suggestions: ClimbSummary[];
  onChange: (climb: ClimbDraft) => void;
  onChangeName: (name: string) => void;
  onPick: (climb: ClimbSummary) => void;
  onToggleProject: () => void;
  onRemove: () => void;
  onClose: () => void;
};

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

function Segment({
  label: text,
  active,
  activeColor,
  activeText = colors.white,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  activeText?: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={press({
        flex: 1,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? activeColor : "transparent",
      })}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: active ? activeText : "rgba(64,63,76,0.65)",
        }}
      >
        {text}
      </Text>
    </Pressable>
  );
}

const STYLE_FILL: Record<ClimbStyle, { background: string; text: string }> = {
  redpoint: { background: colors.azureInk, text: colors.white },
  flash: { background: colors.gold, text: colors.gunmetal },
  onsight: { background: colors.petalInk, text: colors.white },
};

/**
 * Quiet by design: a session is usually all one discipline, and the climb carries its choice to
 * the next one added, so most nights never touch this.
 */
function DisciplineToggle({
  value,
  onChange,
}: {
  value: Discipline;
  onChange: (discipline: Discipline) => void;
}): React.ReactElement {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{
        flexDirection: "row",
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "rgba(64,63,76,0.18)",
        overflow: "hidden",
      }}
    >
      {(["boulder", "route"] as const).map((discipline) => {
        const active = value === discipline;
        return (
          <Pressable
            key={discipline}
            onPress={() => onChange(discipline)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={disciplineLabel(discipline)}
            hitSlop={{ top: 7, bottom: 7 }}
            style={press({
              height: 28,
              paddingHorizontal: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? "rgba(64,63,76,0.08)" : "transparent",
            })}
          >
            <Text
              style={{
                fontFamily: active ? fonts.monoSemiBold : fonts.monoMedium,
                fontSize: 9,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: active ? colors.gunmetal : colors.textFaint,
              }}
            >
              {discipline === "boulder" ? t("common.boulder") : t("common.route")}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StepButton({
  glyph,
  disabled = false,
  onPress,
}: {
  glyph: string;
  disabled?: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={press({
        width: 40,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(64,63,76,0.18)",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 16, color: colors.gunmetal }}>
        {glyph}
      </Text>
    </Pressable>
  );
}

function MarkedName({ name, query }: { name: string; query: string }): React.ReactElement {
  const needle = query.trim().toUpperCase();
  const at = needle === "" ? -1 : name.toUpperCase().indexOf(needle);
  const base = {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.gunmetal,
    textTransform: "uppercase" as const,
    flexShrink: 1,
  };
  if (at < 0) return <Text style={base}>{name}</Text>;
  return (
    <Text numberOfLines={1} style={base}>
      {name.slice(0, at)}
      <Text style={{ fontFamily: fonts.monoSemiBold, color: colors.petalInk }}>
        {name.slice(at, at + needle.length)}
      </Text>
      {name.slice(at + needle.length)}
    </Text>
  );
}

function ProjectRow({
  on,
  enabled,
  meta,
  onPress,
}: {
  on: boolean;
  enabled: boolean;
  meta: string | null;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on, disabled: !enabled }}
      accessibilityLabel={t("common.project")}
      style={press({
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        minHeight: 46,
        paddingHorizontal: 13,
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: on ? colors.gold : colors.lineOnLightStrong,
        backgroundColor: on ? "rgba(249,220,92,0.22)" : "transparent",
        opacity: enabled ? 1 : 0.4,
      })}
    >
      <Icon
        name="projects"
        color={on ? colors.gunmetal : colors.textFaint}
        size={18}
        strokeWidth={2}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
          {on ? t("common.project") : t("logSession.markAsProject")}
        </Text>
        {on && meta !== null && (
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 10,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.textSecondary,
            }}
          >
            {meta}
          </Text>
        )}
      </View>
      {on && <Icon name="check" color={colors.gunmetal} size={16} strokeWidth={2.4} />}
    </Pressable>
  );
}

/** The climb stays rendered while the sheet slides away, so closing does not empty the panel mid-slide. */
function useLingering(climb: ClimbDraft | null): ClimbDraft | null {
  const [shown, setShown] = React.useState(climb);
  if (climb !== null && climb !== shown) setShown(climb);
  return climb ?? shown;
}

export function ClimbEditorSheet({
  climb: current,
  index,
  count,
  prefs,
  project,
  known,
  suggestions,
  onChange,
  onChangeName,
  onPick,
  onToggleProject,
  onRemove,
  onClose,
}: ClimbEditorSheetProps): React.ReactElement {
  const climb = useLingering(current);
  const rail = React.useRef<ScrollView>(null);
  const chipX = React.useRef(new Map<string, number>());
  const [nameFocused, setNameFocused] = React.useState(false);
  const scale = climb?.scale ?? prefs.boulder;
  const options = gradeOptions(scale);
  const grade = climb?.grade ?? "";

  React.useEffect(() => {
    const x = chipX.current.get(grade);
    if (x !== undefined) rail.current?.scrollTo({ x: Math.max(0, x - 120), animated: false });
  }, [grade]);

  const named = climb !== null && climb.name.trim() !== "";
  const firstGo = climb !== null && climb.kind === "send" && climb.style !== "redpoint";
  const showList = nameFocused && suggestions.length > 0;

  return (
    <Sheet visible={current !== null} onClose={onClose} closeLabel={t("logSession.closeEditor")}>
      {climb !== null && (
        <View style={{ gap: 14, paddingTop: 2, paddingHorizontal: 18, paddingBottom: 4 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ ...label, color: colors.watermelonInk }}>
              {t("logSession.climbOf", { n: index + 1, total: count })}
            </Text>
            {count > 1 && (
              <Pressable
                onPress={onRemove}
                hitSlop={8}
                accessibilityRole="button"
                style={press({})}
              >
                <Text style={{ ...label, color: colors.textFaint }}>{t("logSession.remove")}</Text>
              </Pressable>
            )}
          </View>

          <View style={{ gap: 7 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text style={label}>{t("common.grade")}</Text>
              <DisciplineToggle
                value={disciplineOf(climb.scale)}
                onChange={(discipline) => onChange(withClimbDiscipline(climb, discipline, prefs))}
              />
            </View>
            <ScrollView
              ref={rail}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              style={{ marginHorizontal: -18 }}
              contentContainerStyle={{ gap: 6, paddingHorizontal: 18 }}
            >
              {options.map((g) => (
                <View key={g} onLayout={(e) => chipX.current.set(g, e.nativeEvent.layout.x)}>
                  <Chip
                    label={g}
                    uppercase={false}
                    active={g === climb.grade}
                    onPress={() => onChange({ ...climb, grade: g })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={{ gap: 7 }}>
            <Text style={label}>{t("logSession.nameOptional")}</Text>
            <TextInput
              value={climb.name}
              placeholder={t("logSession.climbNamePlaceholder")}
              placeholderTextColor={colors.textFaint}
              autoCorrect={false}
              returnKeyType="done"
              onChangeText={onChangeName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              style={{
                fontFamily: fonts.sans,
                fontSize: 15,
                color: colors.gunmetal,
                backgroundColor: colors.white,
                borderWidth: 1,
                borderColor: nameFocused ? colors.azure : "rgba(64,63,76,0.15)",
                borderRadius: radius.control,
                paddingHorizontal: 13,
                minHeight: 46,
              }}
            />
            {showList && (
              <View
                style={{
                  gap: 2,
                  padding: 6,
                  borderWidth: 1,
                  borderColor: "rgba(64,63,76,0.15)",
                  borderRadius: radius.control,
                }}
              >
                {climb.name.trim() === "" && (
                  <Text style={{ ...label, fontSize: 9, color: colors.textMuted, padding: 4 }}>
                    {t("common.recent")}
                  </Text>
                )}
                {suggestions.map((candidate) => (
                  <Pressable
                    key={candidate.slug}
                    onPress={() => onPick(candidate)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      candidate.project
                        ? t("logSession.candidateProject", { name: candidate.name })
                        : candidate.name
                    }
                    style={pressRow({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      height: 40,
                      paddingHorizontal: 12,
                      borderRadius: radius.sm,
                      backgroundColor: candidate.project ? "rgba(249,220,92,0.14)" : "transparent",
                    })}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 7,
                        flexShrink: 1,
                      }}
                    >
                      {candidate.project && (
                        <Icon name="projects" color={colors.gunmetal} size={14} strokeWidth={2.2} />
                      )}
                      <MarkedName name={candidate.name} query={climb.name} />
                      {candidate.project && (
                        <Text
                          style={{
                            fontFamily: fonts.monoSemiBold,
                            fontSize: 8,
                            letterSpacing: 0.7,
                            textTransform: "uppercase",
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: radius.pill,
                            overflow: "hidden",
                            backgroundColor: colors.gold,
                            color: colors.gunmetal,
                          }}
                        >
                          {t("common.project")}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: fonts.monoMedium,
                        fontSize: 11,
                        letterSpacing: 0.6,
                        color: colors.textMuted,
                      }}
                    >
                      {climbDraftGrade(candidate, climb.scale)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              accessibilityRole="radiogroup"
              style={{
                flex: 1,
                flexDirection: "row",
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "rgba(64,63,76,0.18)",
                overflow: "hidden",
              }}
            >
              {sendStylesFor(disciplineOf(climb.scale)).map((style) => (
                <Segment
                  key={style}
                  label={`✓ ${sendStyleLabel(disciplineOf(climb.scale), style)}`}
                  active={climb.kind === "send" && climb.style === style}
                  activeColor={STYLE_FILL[style].background}
                  activeText={STYLE_FILL[style].text}
                  onPress={() => onChange(withClimbOutcome(climb, { kind: "send", style }))}
                />
              ))}
              <Segment
                label={`✗ ${t("logSession.attempt")}`}
                active={climb.kind === "attempt"}
                activeColor={colors.gunmetal}
                onPress={() => onChange(withClimbOutcome(climb, { kind: "attempt" }))}
              />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <StepButton
                glyph="−"
                disabled={firstGo || climb.tries <= 1}
                onPress={() => onChange({ ...climb, tries: climb.tries - 1 })}
              />
              <Text
                style={{
                  width: 24,
                  textAlign: "center",
                  fontFamily: fonts.monoSemiBold,
                  fontSize: 15,
                  color: colors.gunmetal,
                }}
              >
                {climb.tries}
              </Text>
              <StepButton
                glyph="+"
                disabled={firstGo}
                onPress={() => onChange({ ...climb, tries: Math.min(99, climb.tries + 1) })}
              />
            </View>
          </View>

          <ProjectRow
            on={project}
            enabled={named}
            meta={known === null ? null : projectMetaLabel(known)}
            onPress={onToggleProject}
          />

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={press({
              minHeight: 50,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.control,
              backgroundColor: colors.azureInk,
            })}
          >
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
              {t("common.done")}
            </Text>
          </Pressable>
        </View>
      )}
    </Sheet>
  );
}
