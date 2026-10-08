import { router } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NEW_WORKOUT, type HangKind, type Workout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { Segmented } from "../../components/Segmented";
import { newId } from "../../lib/ids";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { BuilderField } from "./BuilderField";
import { BuilderPreview } from "./BuilderPreview";
import { FIELDS, type NumberKey } from "./fields";

type Draft = Omit<Workout, "id" | "source">;

const MAX_PULL_REPS_ON_SWITCH = 12;

export type BuilderScreenProps = {
  /** Edit this workout of the user's own. */
  id?: string;
  /** Customise: start from a copy of this library workout. */
  from?: string;
};

export function BuilderScreen({ id, from }: BuilderScreenProps): React.ReactElement {
  const c = useTheme();
  const { model, actions } = useHangData();
  const editing = id === undefined ? undefined : model.workout(id);
  const [draft, setDraft] = React.useState<Draft>(() => {
    const base = editing ?? (from === undefined ? undefined : model.workout(from));
    if (base === undefined) return NEW_WORKOUT;
    const { id: _id, source: _source, ...fields } = base;
    return editing ? fields : { ...fields, name: t("hang.mineCopy", { name: base.name }) };
  });
  const update = (patch: Partial<Draft>): void => setDraft((d) => ({ ...d, ...patch }));
  const setNumber = (key: NumberKey, value: number): void =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setKind = (kind: HangKind): void =>
    update(kind === "pull" && draft.reps > MAX_PULL_REPS_ON_SWITCH ? { kind, reps: 5 } : { kind });

  const save = (): void => {
    const workoutId = editing?.id ?? newId();
    const name = draft.name.trim() || t("hang.untitledWorkout");
    void actions.saveWorkout({ ...draft, name, id: workoutId, source: "mine" });
    if (editing) router.back();
    else router.replace({ pathname: "/workout/[id]", params: { id: workoutId } });
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: c.ground }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: 18,
            paddingTop: 18,
            paddingHorizontal: 20,
            paddingBottom: 28,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <Button
              label={t("hang.cancel")}
              onPress={() => router.back()}
              variant="outlineDark"
              height={40}
            />
            <Label color={c.onDark3}>
              {editing ? t("hang.editWorkout") : t("hang.newWorkout")}
            </Label>
            <Button label={t("hang.save")} onPress={save} variant="accent" height={40} />
          </View>
          <View style={{ gap: 6 }}>
            <Label color={c.onDark3}>{t("hang.name")}</Label>
            <TextInput
              value={draft.name}
              onChangeText={(name) => update({ name })}
              placeholder={t("hang.namePlaceholder")}
              placeholderTextColor={c.onDark3}
              accessibilityLabel={t("hang.name")}
              maxLength={80}
              style={[
                type.display,
                {
                  height: 52,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  fontSize: 24,
                  color: c.onDark,
                  backgroundColor: c.deep,
                  borderWidth: 1,
                  borderColor: c.lineDark,
                },
              ]}
            />
          </View>
          <Segmented<HangKind>
            surface="dark"
            value={draft.kind}
            onChange={setKind}
            options={[
              { value: "hang", label: t("hang.kindHang") },
              { value: "pull", label: t("hang.kindPull") },
            ]}
          />
          <View>
            {FIELDS[draft.kind].map((spec) => {
              const hint = spec.hint?.(draft) ?? null;
              return (
                <BuilderField
                  key={spec.key}
                  spec={spec}
                  value={draft[spec.key]}
                  unit={spec.time ? draft.timeUnits[spec.key] : "s"}
                  hint={hint === null ? null : t(hint)}
                  onChange={(value) => setNumber(spec.key, value)}
                  onUnit={(unit) => update({ timeUnits: { ...draft.timeUnits, [spec.key]: unit } })}
                />
              );
            })}
          </View>
          <BuilderPreview protocol={draft} units={draft.timeUnits} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
