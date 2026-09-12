import React from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ClimbSummary, ProjectInput } from "@sendtally/api-client";
import { climbGradeLabel, matchClimbs, projectMetaLabel } from "@sendtally/features/climbs";
import {
  GRADE_SCALE_OPTIONS,
  convertGrade,
  disciplineOf,
  draftGrade,
  gradeOptions,
  type GradeScale,
} from "@sendtally/features/log-session";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Icon } from "../../components/Icon";

export type AddProjectSheetProps = {
  visible: boolean;
  climbs: ClimbSummary[];
  onSave: (input: ProjectInput) => Promise<void>;
  onClose: () => void;
};

const label = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  lineHeight: 13,
  letterSpacing: 0.8,
  color: colors.textMuted,
} as const;

const input = {
  fontFamily: fonts.sans,
  fontSize: 15,
  color: colors.gunmetal,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: "rgba(64,63,76,0.15)",
  borderRadius: radius.control,
  paddingHorizontal: 16,
  paddingVertical: 14,
} as const;

function suggestionMeta(climb: ClimbSummary): string {
  if (climb.project) return "ALREADY A PROJECT";
  if (climb.sessions === 0) return "NOTHING LOGGED YET";
  return projectMetaLabel(climb);
}

export function AddProjectSheet({
  visible,
  climbs,
  onSave,
  onClose,
}: AddProjectSheetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [name, setName] = React.useState("");
  const [scale, setScale] = React.useState<GradeScale>("v");
  const [grade, setGrade] = React.useState("");
  const [settled, setSettled] = React.useState(false);
  const [beta, setBeta] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setName("");
      setScale("v");
      setGrade("");
      setSettled(false);
      setBeta("");
      setError(null);
    }
  }, [visible]);

  const trimmed = name.trim();
  const matches = trimmed === "" ? [] : matchClimbs(climbs, name);
  const exact = climbs.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  const showSuggestions = !settled && trimmed !== "" && (matches.length > 0 || exact === undefined);

  const pick = (climb: ClimbSummary): void => {
    setName(climb.name);
    setSettled(true);
    if (climb.grade === null) return;
    setScale(climb.grade.scale);
    setGrade(climb.grade.scale === "v" ? `V${climb.grade.value}` : climb.grade.value);
  };

  const changeScale = (next: GradeScale): void => {
    setGrade(grade === "" ? "" : convertGrade(grade, scale, next));
    setScale(next);
  };

  const save = async (): Promise<void> => {
    if (trimmed === "") return;
    setBusy(true);
    setError(null);
    const picked = draftGrade(grade, scale);
    try {
      await onSave({
        name: trimmed,
        discipline: disciplineOf(scale),
        ...(picked === undefined ? {} : { grade: picked }),
        ...(beta.trim() === "" ? {} : { beta: beta.trim() }),
      });
      setBusy(false);
      onClose();
    } catch {
      setBusy(false);
      setError("Could not add the project. Try again.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close new project"
        style={{ flex: 1, backgroundColor: "rgba(64,63,76,0.45)" }}
      />
      <View
        style={{
          gap: 18,
          paddingTop: 10,
          paddingHorizontal: 18,
          paddingBottom: Math.max(insets.bottom, 16) + 18,
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
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            letterSpacing: 0.88,
            color: colors.watermelonInk,
          }}
        >
          NEW PROJECT
        </Text>

        <View style={{ gap: 9 }}>
          <Text style={label}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              setSettled(false);
            }}
            placeholder="Name of the climb"
            placeholderTextColor={colors.textFaint}
            autoCorrect={false}
            style={input}
          />
          {showSuggestions && (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{
                maxHeight: 156,
                borderWidth: 1,
                borderColor: colors.lineOnLight,
                borderRadius: radius.control,
              }}
            >
              {matches.map((climb, i) => (
                <Pressable
                  key={climb.slug}
                  accessibilityRole="button"
                  onPress={() => pick(climb)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: colors.lineOnLightSoft,
                  }}
                >
                  <Text
                    style={{
                      width: 30,
                      fontFamily: fonts.monoSemiBold,
                      fontSize: 13,
                      color: colors.gunmetal,
                    }}
                  >
                    {climbGradeLabel(climb)}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontFamily: fonts.sansSemiBold,
                      fontSize: 14,
                      color: colors.gunmetal,
                    }}
                  >
                    {climb.name}
                  </Text>
                  <Text style={label}>{suggestionMeta(climb)}</Text>
                </Pressable>
              ))}
              {exact === undefined && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSettled(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderTopWidth: matches.length === 0 ? 0 : 1,
                    borderTopColor: colors.lineOnLightSoft,
                  }}
                >
                  <Icon name="plus" size={15} strokeWidth={2} color={colors.azureInk} />
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.azureInk }}
                  >
                    Track “{trimmed}” as a new climb
                  </Text>
                </Pressable>
              )}
            </ScrollView>
          )}
        </View>

        <View style={{ gap: 9 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ ...label, flex: 1 }}>GRADE · OPTIONAL</Text>
            {GRADE_SCALE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                active={scale === option.value}
                onPress={() => changeScale(option.value)}
              />
            ))}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 6 }}
          >
            {gradeOptions(scale).map((g) => (
              <Chip
                key={g}
                label={g}
                active={g === grade}
                onPress={() => setGrade(g === grade ? "" : g)}
              />
            ))}
          </ScrollView>
          <Text style={label}>LEAVE IT OFF AND THE GRADE COMES FROM THE FIRST SESSION</Text>
        </View>

        <View style={{ gap: 9 }}>
          <Text style={label}>BETA · OPTIONAL</Text>
          <TextInput
            value={beta}
            onChangeText={setBeta}
            multiline
            placeholder="What you know about it so far"
            placeholderTextColor={colors.textFaint}
            style={{ ...input, minHeight: 64, textAlignVertical: "top" }}
          />
        </View>

        {error !== null && <Text style={{ ...label, color: colors.watermelonInk }}>{error}</Text>}

        <Pressable
          onPress={() => void save()}
          accessibilityRole="button"
          disabled={trimmed === "" || busy}
          style={{
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.control,
            backgroundColor: colors.azureInk,
            opacity: trimmed === "" || busy ? 0.45 : 1,
          }}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}>
            {busy ? "Adding…" : "Add project"}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
