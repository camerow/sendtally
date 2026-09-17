import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { emptyGymDraft, gymDraftOf, useGyms, type GymDraft } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { GymEditor } from "../../features/gyms/GymEditor";
import { useApi } from "../../lib/api";

/** `/gym/new` creates; `/gym/<id>` edits. Saving returns to wherever the user came from. */
export default function GymScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const gyms = useGyms(api);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const editing = id !== undefined && id !== "new";
  const existing = editing ? (gyms.gyms.find((g) => g.id === id) ?? null) : null;

  if (editing && !gyms.ready) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
        <View style={{ padding: 28, alignItems: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      </SafeAreaView>
    );
  }

  const onSave = (draft: GymDraft): void => {
    setSaving(true);
    setError(null);
    gyms
      .save(draft.id, {
        name: draft.name,
        scale: draft.scale,
        circuits: draft.circuits,
        walls: draft.walls,
      })
      .then(() => router.back())
      .catch(() => setError(t("gyms.saveFailed")))
      .finally(() => setSaving(false));
  };

  return (
    <GymEditor
      key={existing?.id ?? "new"}
      initial={existing === null ? emptyGymDraft() : gymDraftOf(existing)}
      saving={saving}
      error={error}
      onSave={onSave}
      onDelete={
        existing === null
          ? null
          : () => {
              void gyms.remove(existing.id).then(() => router.back());
            }
      }
    />
  );
}
