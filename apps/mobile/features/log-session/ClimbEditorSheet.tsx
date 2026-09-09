import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ClimbSummary } from "@sendtally/api-client";
import { climbDraftGrade } from "@sendtally/features/climbs";
import { gradeOptions, type ClimbDraft, type GradeScale } from "@sendtally/features/log-session";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Icon } from "../../components/Icon";

export type ClimbEditorSheetProps = {
  climb: ClimbDraft | null;
  index: number;
  count: number;
  scale: GradeScale;
  project: boolean;
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
  color: colors.textSecondary,
} as const;

function Segment({
  label: text,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={{
        flex: 1,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? activeColor : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: fonts.monoMedium,
          fontSize: 11,
          letterSpacing: 0.6,
          color: active ? colors.white : "rgba(64,63,76,0.65)",
        }}
      >
        {text}
      </Text>
    </Pressable>
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
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(64,63,76,0.18)",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text style={{ fontFamily: fonts.monoMedium, fontSize: 16, color: colors.gunmetal }}>
        {glyph}
      </Text>
    </Pressable>
  );
}

function MarkedName({ name, query }: { name: string; query: string }): React.ReactElement {
  const upper = name.toUpperCase();
  const needle = query.trim().toUpperCase();
  const at = needle === "" ? -1 : upper.indexOf(needle);
  const base = {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: colors.gunmetal,
  };
  if (at < 0) return <Text style={base}>{upper}</Text>;
  return (
    <Text style={base}>
      {upper.slice(0, at)}
      <Text style={{ fontFamily: fonts.monoSemiBold, color: colors.petalInk }}>
        {upper.slice(at, at + needle.length)}
      </Text>
      {upper.slice(at + needle.length)}
    </Text>
  );
}

export function ClimbEditorSheet({
  climb,
  index,
  count,
  scale,
  project,
  suggestions,
  onChange,
  onChangeName,
  onPick,
  onToggleProject,
  onRemove,
  onClose,
}: ClimbEditorSheetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const rail = React.useRef<ScrollView>(null);
  const chipX = React.useRef(new Map<string, number>());
  const [nameFocused, setNameFocused] = React.useState(false);
  const options = gradeOptions(scale);
  const grade = climb?.grade ?? "";

  React.useEffect(() => {
    const x = chipX.current.get(grade);
    if (x !== undefined) rail.current?.scrollTo({ x: Math.max(0, x - 120), animated: false });
  }, [grade]);

  const named = climb !== null && climb.name.trim() !== "";
  const showList = nameFocused && suggestions.length > 0;

  return (
    <Modal visible={climb !== null} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close climb editor"
          style={{ flex: 1, backgroundColor: "rgba(64,63,76,0.45)" }}
        />
        {climb !== null && (
          <View
            style={{
              gap: 14,
              paddingTop: 10,
              paddingHorizontal: 18,
              paddingBottom: Math.max(insets.bottom, 16) + 4,
              borderTopLeftRadius: radius.panel,
              borderTopRightRadius: radius.panel,
              backgroundColor: colors.white,
            }}
          >
            <View
              style={{
                alignSelf: "center",
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(64,63,76,0.2)",
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ ...label, color: colors.watermelonInk }}>
                CLIMB {index + 1} OF {count}
              </Text>
              {count > 1 && (
                <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button">
                  <Text style={{ ...label, color: colors.textFaint }}>REMOVE</Text>
                </Pressable>
              )}
            </View>

            <View style={{ gap: 7 }}>
              <Text style={label}>GRADE</Text>
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
                      active={g === climb.grade}
                      onPress={() => onChange({ ...climb, grade: g })}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={{ gap: 7 }}>
              <Text style={label}>NAME · OPTIONAL</Text>
              <TextInput
                value={climb.name}
                placeholder="Name (optional)"
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
                      RECENT
                    </Text>
                  )}
                  {suggestions.map((known) => (
                    <Pressable
                      key={known.slug}
                      onPress={() => onPick(known)}
                      accessibilityRole="button"
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        height: 40,
                        paddingHorizontal: 12,
                        borderRadius: radius.sm,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 7,
                          flexShrink: 1,
                        }}
                      >
                        {known.project && (
                          <Icon name="projects" color={colors.gunmetal} size={13} strokeWidth={2} />
                        )}
                        <MarkedName name={known.name} query={climb.name} />
                      </View>
                      <Text
                        style={{
                          fontFamily: fonts.monoMedium,
                          fontSize: 11,
                          letterSpacing: 0.6,
                          color: colors.textMuted,
                        }}
                      >
                        {climbDraftGrade(known, scale)}
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
                <Segment
                  label="✓ SEND"
                  active={climb.kind === "send"}
                  activeColor={colors.azureInk}
                  onPress={() => onChange({ ...climb, kind: "send" })}
                />
                <Segment
                  label="✗ ATTEMPT"
                  active={climb.kind === "attempt"}
                  activeColor={colors.gunmetal}
                  onPress={() => onChange({ ...climb, kind: "attempt" })}
                />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <StepButton
                  glyph="−"
                  disabled={climb.tries <= 1}
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
                  onPress={() => onChange({ ...climb, tries: Math.min(99, climb.tries + 1) })}
                />
              </View>
            </View>

            <Pressable
              onPress={onToggleProject}
              disabled={!named}
              accessibilityRole="button"
              accessibilityState={{ selected: project, disabled: !named }}
              style={{
                alignSelf: "flex-start",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 32,
                opacity: named ? 1 : 0.4,
              }}
            >
              <Icon
                name="projects"
                color={project ? colors.gunmetal : colors.textFaint}
                size={14}
                strokeWidth={2}
              />
              <Text style={{ ...label, color: project ? colors.gunmetal : colors.textFaint }}>
                {project ? "PROJECT" : "MARK AS PROJECT"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={{
                minHeight: 50,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.control,
                backgroundColor: colors.azureInk,
              }}
            >
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
                Done
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
