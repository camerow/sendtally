import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import { Alert, Keyboard, Pressable, Text, View } from "react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  areaClimbGradeLabel,
  climbOptions,
  useAreaClimbSearch,
  type AreaClimb,
} from "@sendtally/features/areas";
import { climbDraftGrade, projectMetaLabel } from "@sendtally/features/climbs";
import { circuitGrades, findCircuit, type Gym } from "@sendtally/features/gyms";
import {
  disciplineLabel,
  disciplineOf,
  gymOfCircuit,
  withClimbDiscipline,
  type ClimbDraft,
  type Discipline,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { ClimbGradePicker, ClimbKindPicker } from "./ClimbKindPicker";
import { EnduranceFields } from "./EnduranceFields";
import { ResultFields } from "./ResultFields";
import { useApi } from "../../lib/api";
import { press, pressRow, tap } from "../../lib/press";
import { primaryButton, primaryButtonLabel } from "../../lib/styles";

/** Where an outdoor row looks for Areas climbs, and what picking or adding one does. */
export type ClimbAreas = {
  areaId: string | null;
  onPickArea: (climb: AreaClimb) => void;
  onAdd: () => void;
};

export type ClimbEditorSheetProps = {
  climb: ClimbDraft | null;
  index: number;
  count: number;
  /** The form keeps one climb; a live session may lose its last one. */
  removable?: boolean;
  prefs: GradePrefs;
  /** Gyms with circuits a climb can be put on instead of graded. */
  gyms?: readonly Gym[];
  project: boolean;
  known: ClimbSummary | null;
  suggestions: ClimbSummary[];
  onChange: (climb: ClimbDraft) => void;
  onChangeName: (name: string) => void;
  onPick: (climb: ClimbSummary) => void;
  /** Set for an outdoor session, where the name also searches Areas. */
  areas?: ClimbAreas;
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

const input = {
  fontFamily: fonts.sans,
  fontSize: 15,
  color: colors.gunmetal,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: "rgba(64,63,76,0.15)",
  borderRadius: radius.control,
  paddingHorizontal: 13,
} as const;

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
            onPress={tap(() => onChange(discipline))}
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
      onPress={tap(onPress)}
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

function ChoiceChip({
  label,
  active,
  mono = false,
  onPress,
}: {
  label: string;
  active: boolean;
  mono?: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={tap(onPress)}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
      style={press({
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        minHeight: 38,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? colors.gold : "rgba(64,63,76,0.18)",
        backgroundColor: active ? colors.gold : "transparent",
      })}
    >
      <Text
        style={{
          fontFamily: mono ? fonts.monoSemiBold : fonts.sansSemiBold,
          fontSize: mono ? 12 : 13,
          color: active ? colors.gunmetal : "rgba(64,63,76,0.72)",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Wall and how it felt, in place of the grade, as chip rows; the circuit itself is picked in
 * ClimbKindPicker. The felt-like row is only the grades the circuit spans, with the
 * middle already chosen; nobody is asked to estimate.
 */
function CircuitFields({
  climb,
  gym,
  onChange,
}: {
  climb: ClimbDraft;
  gym: Gym;
  onChange: (climb: ClimbDraft) => void;
}): React.ReactElement {
  const current = findCircuit(gym, climb.circuit?.id);
  const wall = climb.wall ?? "";
  return (
    <View style={{ gap: 12 }}>
      {gym.walls.length > 0 && (
        <View style={{ gap: 7 }}>
          <Text style={label}>{t("gyms.wall")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {["", ...gym.walls].map((w) => (
              <ChoiceChip
                key={w === "" ? "-" : w}
                label={w === "" ? t("gyms.noWall") : w}
                active={w === wall}
                onPress={() => onChange({ ...climb, wall: w })}
              />
            ))}
          </View>
        </View>
      )}
      {current !== null && current.low !== current.high && (
        <View style={{ gap: 7 }}>
          <Text style={label}>{t("gyms.feltLike")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {circuitGrades(current, gym.scale).map((grade) => (
              <ChoiceChip
                key={grade}
                label={grade}
                mono
                active={grade === climb.grade}
                onPress={() => onChange({ ...climb, grade })}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function confirmRemoveClimb(climb: ClimbDraft, onRemove: () => void): void {
  const name = climb.name.trim() === "" ? t("logSession.unnamed") : climb.name.trim();
  const grade = climb.circuit === undefined ? climb.grade : climb.circuit.label;
  Alert.alert(t("logSession.removeClimbTitle"), t("logSession.removeClimbBody", { name, grade }), [
    { text: t("common.cancel"), style: "cancel" },
    { text: t("logSession.remove"), style: "destructive", onPress: onRemove },
  ]);
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
  removable = count > 1,
  prefs,
  gyms = [],
  project,
  known,
  suggestions,
  onChange,
  onChangeName,
  onPick,
  areas,
  onToggleProject,
  onRemove,
  onClose,
}: ClimbEditorSheetProps): React.ReactElement {
  const climb = useLingering(current);
  const gym = climb === null ? null : gymOfCircuit(gyms, climb.circuit?.id);
  const endurance = climb?.endurance !== undefined;
  const [nameFocused, setNameFocused] = React.useState(false);
  const named = climb !== null && climb.name.trim() !== "";
  const search = useAreaClimbSearch(
    useApi(),
    climb?.name ?? "",
    areas?.areaId ?? null,
    areas !== undefined && nameFocused
  );
  const options = climbOptions(suggestions, search.found, climb?.climbId);
  const showList = nameFocused && (options.length > 0 || search.canAdd);

  return (
    <Sheet
      visible={current !== null}
      onClose={onClose}
      closeLabel={t("logSession.closeEditor")}
      footer={
        climb !== null && (
          <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
            {removable && (
              <Pressable
                onPress={tap(() => confirmRemoveClimb(climb, onRemove))}
                accessibilityRole="button"
                accessibilityLabel={t("logSession.removeClimb")}
                style={press({
                  width: 48,
                  borderRadius: radius.control,
                  borderWidth: 1,
                  borderColor: colors.watermelonInk,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Icon name="trash" color={colors.watermelonInk} size={18} strokeWidth={1.8} />
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={press({ ...primaryButton, flex: 1, backgroundColor: colors.gold })}
            >
              <Text style={{ ...primaryButtonLabel, color: colors.gunmetal }}>
                {t("common.save")}
              </Text>
            </Pressable>
          </View>
        )
      }
    >
      {climb !== null && (
        <View style={{ gap: 14, paddingTop: 2, paddingHorizontal: 18, paddingBottom: 4 }}>
          <View style={{ gap: 3 }}>
            <Text
              accessibilityRole="header"
              style={{ fontFamily: fonts.sansSemiBold, fontSize: 18, color: colors.gunmetal }}
            >
              {t("logSession.addClimb")}
            </Text>
            <Text style={{ ...label, color: colors.textMuted }}>
              {t("logSession.climbOf", { n: index + 1, total: count })}
            </Text>
          </View>

          <View style={{ gap: 7 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={label}>{t("logSession.nameOptional")}</Text>
              {climb.climbId !== undefined && (
                <Text
                  accessibilityLabel={t("areas.linkedToAreas")}
                  style={{ ...label, color: colors.azureInk }}
                >
                  {t("areas.inAreas")}
                </Text>
              )}
            </View>
            <BottomSheetTextInput
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              value={climb.name}
              placeholder={
                endurance
                  ? t("endurance.namePlaceholder")
                  : gym === null
                    ? t("logSession.climbNamePlaceholder")
                    : t("logSession.circuitClimbNamePlaceholder")
              }
              placeholderTextColor={colors.textFaint}
              returnKeyType="done"
              onChangeText={onChangeName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              style={{
                ...input,
                ...(nameFocused ? { borderColor: colors.azure } : {}),
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
                {options.map((option) =>
                  option.kind === "areas" ? (
                    <Pressable
                      key={`areas-${option.climb.id}`}
                      onPress={() => areas?.onPickArea(option.climb)}
                      accessibilityRole="button"
                      accessibilityLabel={`${option.climb.name}, ${t("areas.inAreas")}`}
                      style={pressRow({
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        height: 40,
                        paddingHorizontal: 12,
                        borderRadius: radius.sm,
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
                        <MarkedName name={option.climb.name} query={climb.name} />
                        <Text style={{ ...label, fontSize: 8, color: colors.azureInk }}>
                          {t("areas.inAreas")}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontFamily: fonts.monoMedium,
                          fontSize: 11,
                          letterSpacing: 0.6,
                          color: colors.textMuted,
                        }}
                      >
                        {areaClimbGradeLabel(option.climb)}
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      key={option.climb.slug}
                      onPress={() => onPick(option.climb)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        option.climb.project
                          ? t("logSession.candidateProject", { name: option.climb.name })
                          : option.climb.name
                      }
                      style={pressRow({
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        height: 40,
                        paddingHorizontal: 12,
                        borderRadius: radius.sm,
                        backgroundColor: option.climb.project
                          ? "rgba(249,220,92,0.14)"
                          : "transparent",
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
                        {option.climb.project && (
                          <Icon
                            name="projects"
                            color={colors.gunmetal}
                            size={14}
                            strokeWidth={2.2}
                          />
                        )}
                        <MarkedName name={option.climb.name} query={climb.name} />
                        {option.climb.project && (
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
                        {climbDraftGrade(option.climb, climb.scale)}
                      </Text>
                    </Pressable>
                  )
                )}
                {search.canAdd && areas !== undefined && (
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      areas.onAdd();
                    }}
                    accessibilityRole="button"
                    style={pressRow({
                      minHeight: 40,
                      justifyContent: "center",
                      paddingHorizontal: 12,
                      borderRadius: radius.sm,
                    })}
                  >
                    <Text
                      numberOfLines={2}
                      style={{
                        fontFamily: fonts.sansSemiBold,
                        fontSize: 14,
                        color: colors.azureInk,
                      }}
                    >
                      {`+ ${t("areas.addToAreas", { name: climb.name.trim() })}`}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={{ gap: 7 }}>
            <Text style={label}>{t("logSession.climbKind")}</Text>
            <ClimbKindPicker climb={climb} gyms={gyms} prefs={prefs} onChange={onChange} />
          </View>
          {endurance && <EnduranceFields climb={climb} onChange={onChange} />}
          <View style={{ gap: 7 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text style={label}>{endurance ? t("endurance.feltLike") : t("common.grade")}</Text>
              {endurance && (
                <DisciplineToggle
                  value={disciplineOf(climb.scale)}
                  onChange={(discipline) => onChange(withClimbDiscipline(climb, discipline, prefs))}
                />
              )}
            </View>
            <ClimbGradePicker climb={climb} gyms={gyms} onChange={onChange} />
          </View>
          {gym !== null && <CircuitFields climb={climb} gym={gym} onChange={onChange} />}

          {!endurance && (
            <ResultFields key={climb.key} climb={climb} known={known} onChange={onChange} />
          )}

          <View style={{ gap: 9 }}>
            <Text style={label}>{t("logSession.noteOptional")}</Text>
            <BottomSheetTextInput
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              value={climb.note}
              editable={named}
              multiline
              maxLength={2000}
              placeholder={t("logSession.climbNotePlaceholder")}
              placeholderTextColor={colors.textFaint}
              onChangeText={(note) => onChange({ ...climb, note })}
              accessibilityState={{ disabled: !named }}
              style={{
                ...input,
                lineHeight: 22,
                paddingVertical: 11,
                minHeight: 72,
                textAlignVertical: "top",
                opacity: named ? 1 : 0.45,
              }}
            />
            {named && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary }}>
                {t("logSession.noteKeptOn", { name: climb.name.trim() })}
              </Text>
            )}
            {!endurance && (
              <ProjectRow
                on={project}
                enabled={named}
                meta={known === null ? null : projectMetaLabel(known)}
                onPress={tap(onToggleProject)}
              />
            )}
            {!named && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <Icon name="lock" color={colors.textSecondary} size={14} strokeWidth={1.8} />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts.sans,
                    fontSize: 12,
                    lineHeight: 17,
                    color: colors.textSecondary,
                  }}
                >
                  {endurance ? t("logSession.noteNeedsName") : t("logSession.nameUnlocksNote")}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Sheet>
  );
}
