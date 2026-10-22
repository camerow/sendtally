import { randomUUID } from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { newActivityDraft, type ActivityPrefill } from "@sendtally/features/activities";
import { today } from "@sendtally/features/journal";
import { ActivityForm } from "../../features/training/activity/ActivityForm";

// A plan opens this with what it already knows: the kind, its title, the day and itself.
export default function NewActivityScreen(): React.ReactElement {
  const params = useLocalSearchParams<ActivityPrefill>();
  const [id] = React.useState(randomUUID);
  const [initial] = React.useState(() => newActivityDraft(params, today()));
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <ActivityForm id={id} initial={initial} editing={false} />
    </SafeAreaView>
  );
}
