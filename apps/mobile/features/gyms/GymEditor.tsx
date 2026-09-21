import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  customStart,
  gymDraftProblem,
  nextCircuit,
  standardCircuits,
  withoutWall,
  withWall,
  type Circuit,
  type CircuitMode,
  type GymDraft,
  type GymScale,
} from "@sendtally/features/gyms";
import { scaleLabel } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { BackButton } from "../../components/BackButton";
import { Icon } from "../../components/Icon";
import { OptionRow } from "../../components/OptionRow";
import { SelectRow } from "../../components/SelectRow";
import { press } from "../../lib/press";
import {
  bodyText,
  dangerButton,
  dangerButtonLabel,
  messageText,
  primaryButton,
  primaryButtonLabel,
  sectionLabel,
} from "../../lib/styles";
import { CircuitRow } from "./CircuitRow";

const input = {
  height: 46,
  fontFamily: fonts.sans,
  fontSize: 15,
  color: colors.gunmetal,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: "rgba(64,63,76,0.15)",
  borderRadius: radius.control,
  paddingHorizontal: 13,
} as const;

export type GymEditorProps = {
  initial: GymDraft;
  saving: boolean;
  error: string | null;
  onSave: (draft: GymDraft) => void;
  onDelete: (() => void) | null;
  inSheet?: boolean;
};

/** One screen for a new gym and for editing one; nothing is written until Save. */
export function GymEditor({
  initial,
  saving,
  error,
  onSave,
  onDelete,
  inSheet = false,
}: GymEditorProps): React.ReactElement {
  const [draft, setDraft] = React.useState<GymDraft>(initial);
  const [mode, setMode] = React.useState<CircuitMode>("standard");
  const [wall, setWall] = React.useState("");
  const [problem, setProblem] = React.useState<string | null>(null);
  const Input = inSheet ? BottomSheetTextInput : TextInput;

  const setCircuits = (circuits: Circuit[]): void => setDraft((d) => ({ ...d, circuits }));
  const changeMode = (next: CircuitMode): void => {
    setMode(next);
    setCircuits(next === "standard" ? standardCircuits() : customStart());
  };
  const addWall = (): void => {
    setDraft((d) => ({ ...d, walls: withWall(d.walls, wall) }));
    setWall("");
  };
  const save = (): void => {
    const p = gymDraftProblem(draft);
    setProblem(p);
    if (p === null) onSave({ ...draft, name: draft.name.trim() });
  };
  const confirmDelete = (): void => {
    if (onDelete === null) return;
    Alert.alert(t("gyms.deleteGym"), t("gyms.deleteConfirm", { name: draft.name }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("gyms.deleteGym"), style: "destructive", onPress: onDelete },
    ]);
  };

  const content = (
    <>
      {!inSheet && <BackButton label={t("common.settings")} />}
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 28,
          letterSpacing: -0.5,
          color: colors.gunmetal,
        }}
      >
        {initial.id === null ? t("gyms.newGym") : t("gyms.editGym")}
      </Text>

      <View style={{ gap: 7 }}>
        <Text style={sectionLabel}>{t("gyms.gymName")}</Text>
        <Input
          value={draft.name}
          placeholder={t("gyms.gymName")}
          placeholderTextColor={colors.textFaint}
          autoCorrect={false}
          maxLength={80}
          testID="gym-name"
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          style={input}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <SelectRow
            label={t("gyms.circuits")}
            value={mode === "standard" ? t("gyms.standard") : t("gyms.custom")}
          >
            {(close) =>
              (["standard", "custom"] as const).map((m) => (
                <OptionRow
                  key={m}
                  label={m === "standard" ? t("gyms.standard") : t("gyms.custom")}
                  mono={false}
                  selected={m === mode}
                  onPress={() => {
                    changeMode(m);
                    close();
                  }}
                />
              ))
            }
          </SelectRow>
        </View>
        <View style={{ width: 110 }}>
          <SelectRow
            label={t("gyms.scale")}
            value={scaleLabel(draft.scale)}
            valueFont={fonts.monoSemiBold}
          >
            {(close) =>
              (["v", "font"] as const satisfies readonly GymScale[]).map((scale) => (
                <OptionRow
                  key={scale}
                  label={scaleLabel(scale)}
                  selected={scale === draft.scale}
                  onPress={() => {
                    setDraft((d) => ({ ...d, scale }));
                    close();
                  }}
                />
              ))
            }
          </SelectRow>
        </View>
      </View>
      <Text style={bodyText}>
        {mode === "standard" ? t("gyms.modeStandard") : t("gyms.modeCustom")}
      </Text>

      <View>
        {draft.circuits.map((circuit) => (
          <CircuitRow
            key={circuit.id}
            circuit={circuit}
            scale={draft.scale}
            inSheet={inSheet}
            onChange={(next) =>
              setCircuits(draft.circuits.map((c) => (c.id === next.id ? next : c)))
            }
            onRemove={() =>
              setDraft((d) => ({
                ...d,
                circuits: d.circuits.filter((c) => c.id !== circuit.id),
              }))
            }
          />
        ))}
      </View>
      <Pressable
        onPress={() =>
          setDraft((d) => ({ ...d, circuits: [...d.circuits, nextCircuit(d.circuits)] }))
        }
        accessibilityRole="button"
        style={press({
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
        })}
      >
        <Icon name="plus" color={colors.gunmetal} size={16} strokeWidth={2.2} />
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
          {t("gyms.addCircuit")}
        </Text>
      </Pressable>

      <View style={{ gap: 10 }}>
        <Text style={sectionLabel}>{t("gyms.walls")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {draft.walls.map((w) => (
            <Pressable
              key={w}
              onPress={() => setDraft((d) => ({ ...d, walls: withoutWall(d.walls, w) }))}
              accessibilityRole="button"
              accessibilityLabel={`${t("gyms.removeWall")}: ${w}`}
              style={press({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                minHeight: 36,
                paddingHorizontal: 12,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: "rgba(64,63,76,0.18)",
              })}
            >
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 11,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: colors.gunmetal,
                }}
              >
                {w}
              </Text>
              <Icon name="x" color={colors.textFaint} size={12} strokeWidth={2.2} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Input
            value={wall}
            placeholder={t("gyms.wallPlaceholder")}
            placeholderTextColor={colors.textFaint}
            autoCorrect={false}
            maxLength={40}
            returnKeyType="done"
            testID="gym-wall"
            onChangeText={setWall}
            onSubmitEditing={addWall}
            style={{ ...input, flex: 1 }}
          />
          <Pressable
            onPress={addWall}
            disabled={wall.trim() === ""}
            accessibilityRole="button"
            accessibilityLabel={t("gyms.addWall")}
            style={press({
              width: 46,
              height: 46,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.control,
              borderWidth: 1,
              borderColor: colors.lineOnLightStrong,
              opacity: wall.trim() === "" ? 0.4 : 1,
            })}
          >
            <Icon name="plus" color={colors.gunmetal} size={16} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      {(problem ?? error) !== null && (
        <Text style={{ ...messageText, color: colors.watermelonInk }}>{problem ?? error}</Text>
      )}
      <Pressable
        onPress={save}
        disabled={saving}
        accessibilityRole="button"
        style={press({ ...primaryButton, opacity: saving ? 0.55 : 1 })}
      >
        <Text style={primaryButtonLabel}>{saving ? t("gyms.saving") : t("gyms.save")}</Text>
      </Pressable>
      {onDelete !== null && (
        <Pressable onPress={confirmDelete} accessibilityRole="button" style={press(dangerButton)}>
          <Text style={dangerButtonLabel}>{t("gyms.deleteGym")}</Text>
        </Pressable>
      )}
    </>
  );

  if (inSheet) return <View style={{ padding: 18, gap: 18 }}>{content}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 18, paddingBottom: 48, gap: 18 }}
        >
          {content}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
