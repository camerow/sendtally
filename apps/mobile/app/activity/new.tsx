import { randomUUID } from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import {
  newActivityDraft,
  usePlanTemplate,
  type ActivityDraft,
  type ActivityPrefill,
} from "@sendtally/features/activities";
import { today } from "@sendtally/features/journal";
import { ActivityForm } from "../../features/training/activity/ActivityForm";
import { useApi } from "../../lib/api";

// A plan opens this with what it already knows: the kind, its title, the day and itself.
// Its template fills the sets or checklist in, so the form waits for the plan to load.
export default function NewActivityScreen(): React.ReactElement {
  const params = useLocalSearchParams<ActivityPrefill>();
  const [id] = React.useState(randomUUID);
  const template = usePlanTemplate(useApi(), params.planItemId ?? null);
  const [initial, setInitial] = React.useState<ActivityDraft | null>(null);
  if (initial === null && template !== undefined) {
    setInitial(newActivityDraft(params, today(), template));
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {initial === null ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      ) : (
        <ActivityForm id={id} initial={initial} logged={null} />
      )}
    </SafeAreaView>
  );
}
