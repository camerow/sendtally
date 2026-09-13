import React from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ClimbSummary, GradeScales, ProjectInput } from "@sendtally/api-client";
import {
  climbGradeLabel,
  matchClimbs,
  projectMetaLabel,
  typicalGradeIndex,
} from "@sendtally/features/climbs";
import {
  disciplineOf,
  draftGrade,
  gradeOptions,
  type Discipline,
} from "@sendtally/features/log-session";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Chip } from "../../components/Chip";
import { Icon } from "../../components/Icon";

export type AddProjectSheetProps = {
  visible: boolean;
  climbs: ClimbSummary[];
  scales: GradeScales;
  onSave: (input: ProjectInput) => Promise<void>;
  onClose: () => void;
};

const DISCIPLINES: Array<{ value: Discipline; label: string }> = [
  { value: "boulder", label: "BOULDER" },
  { value: "route", label: "SPORT" },
];

const CHIP_WIDTH = 74;

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
  scales,
  onSave,
  onClose,
}: AddProjectSheetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [name, setName] = React.useState("");
  const [picked, setPicked] = React.useState<ClimbSummary | null>(null);
  const [tracking, setTracking] = React.useState(false);
  const [discipline, setDiscipline] = React.useState<Discipline>("boulder");
  const [grade, setGrade] = React.useState("");
  const [beta, setBeta] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const rail = React.useRef<ScrollView>(null);

  const trimmed = name.trim();
  const matches = trimmed === "" ? [] : matchClimbs(climbs, name);
  const exact = climbs.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  const identified = picked !== null || tracking;
  const searching = !identified;
  const showSuggestions =
    searching && trimmed !== "" && (matches.length > 0 || exact === undefined);

  const scale = picked?.grade?.scale ?? (discipline === "boulder" ? scales.boulder : scales.route);
  const ladder = gradeOptions(scale);
  const needsGrade = identified && (picked === null || picked.grade === null);
  const identityName = picked?.name ?? trimmed;
  const identityGrade = needsGrade
    ? grade === ""
      ? "-"
      : grade
    : picked === null
      ? "-"
      : climbGradeLabel(picked);

  // Opening the rail at the bottom of the ladder hides every grade the user
  // would pick, so it starts where they climb.
  React.useEffect(() => {
    if (!needsGrade) return;
    const index = grade === "" ? typicalGradeIndex(climbs, scale) : ladder.indexOf(grade);
    rail.current?.scrollTo({ x: Math.max(0, index - 1) * CHIP_WIDTH, animated: false });
  }, [needsGrade, grade, scale, ladder, climbs]);

  const pick = (climb: ClimbSummary): void => {
    setName(climb.name);
    setPicked(climb);
    setTracking(false);
    setDiscipline(climb.discipline);
    setGrade("");
  };

  const change = (): void => {
    setPicked(null);
    setTracking(false);
    setGrade("");
    setName("");
  };

  const save = async (): Promise<void> => {
    if (trimmed === "" || !identified) return;
    const chosen = needsGrade ? draftGrade(grade, scale) : undefined;
    if (needsGrade && chosen === undefined) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({
        name: identityName,
        ...(chosen === undefined ? {} : { grade: chosen, discipline: disciplineOf(chosen.scale) }),
        ...(beta.trim() === "" ? {} : { beta: beta.trim() }),
      });
      setBusy(false);
      onClose();
    } catch {
      setBusy(false);
      setError("Could not add the project. Try again.");
    }
  };

  const ready = identified && !(needsGrade && grade === "");

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

        {searching && (
          <View style={{ gap: 9 }}>
            <Text style={label}>WHICH CLIMB</Text>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setPicked(null);
                setTracking(false);
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
                    disabled={climb.project}
                    onPress={() => pick(climb)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      opacity: climb.project ? 0.45 : 1,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.lineOnLightSoft,
                    }}
                  >
                    <Text
                      style={{
                        width: 38,
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
                    onPress={() => setTracking(true)}
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
                    <View style={{ width: 38 }}>
                      <Icon name="plus" size={15} strokeWidth={2} color={colors.azureInk} />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fonts.sansSemiBold,
                        fontSize: 14,
                        color: colors.azureInk,
                      }}
                    >
                      Track “{trimmed}” as a new climb
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            )}
            <Text style={label}>
              START TYPING - PICK ONE YOU HAVE LOGGED AND IT KEEPS ITS HISTORY
            </Text>
          </View>
        )}

        {identified && (
          <View style={{ gap: 9 }}>
            <Text style={label}>{picked === null ? "NEW CLIMB" : "FROM YOUR LOGBOOK"}</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingHorizontal: 16,
                paddingVertical: 13,
                backgroundColor: colors.surfaceSoft,
                borderWidth: 1,
                borderColor: "rgba(64,63,76,0.15)",
                borderRadius: radius.control,
              }}
            >
              <Text
                style={{
                  minWidth: 44,
                  fontFamily: fonts.monoSemiBold,
                  fontSize: 15,
                  color: identityGrade === "-" ? colors.textFaint : colors.gunmetal,
                }}
              >
                {identityGrade}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 15,
                  color: colors.gunmetal,
                }}
              >
                {identityName}
              </Text>
              <Pressable accessibilityRole="button" onPress={change}>
                <Text style={{ ...label, color: colors.azureInk }}>CHANGE</Text>
              </Pressable>
            </View>
          </View>
        )}

        {needsGrade && (
          <>
            <View style={{ gap: 9 }}>
              <Text style={label}>DISCIPLINE</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {DISCIPLINES.map((d) => (
                  <Chip
                    key={d.value}
                    label={d.label}
                    active={discipline === d.value}
                    disabled={picked !== null}
                    onPress={() => {
                      setDiscipline(d.value);
                      setGrade("");
                    }}
                  />
                ))}
              </View>
            </View>
            <View style={{ gap: 9 }}>
              <Text style={label}>GRADE</Text>
              <ScrollView
                ref={rail}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: 6 }}
              >
                {ladder.map((g) => (
                  <Chip key={g} label={g} active={g === grade} onPress={() => setGrade(g)} />
                ))}
              </ScrollView>
            </View>
          </>
        )}

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
          disabled={!ready || busy}
          style={{
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.control,
            backgroundColor: colors.azureInk,
            opacity: !ready || busy ? 0.45 : 1,
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
