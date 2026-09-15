import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import {
  ENTRY_KINDS,
  emptyDraft,
  newEntryHeading,
  today,
  useSessionRows,
  type EntryKind,
} from "@sendtally/features/journal";
import { colors } from "@sendtally/design/tokens";
import { EntryComposer } from "../../features/journal/EntryComposer";
import { useApi } from "../../lib/api";

type Params = { kind?: string; date?: string; session?: string; parent?: string };

const kindParam = (value: string | undefined): EntryKind =>
  ENTRY_KINDS.find((kind) => kind === value) ?? "journal";

// Every doorway lands here with what it already knows in the query: the date,
// sometimes the session, sometimes the kind. Nothing has to be re-stated.
export default function NewEntryScreen(): React.ReactElement {
  const params = useLocalSearchParams<Params>();
  const api = useApi();
  const { state } = useSessionRows(api);

  const initial = React.useMemo(
    () => ({
      ...emptyDraft(kindParam(params.kind), params.date ?? today()),
      fingerprints: params.session === undefined ? [] : [params.session],
      parentId: params.parent ?? "",
    }),
    [params.kind, params.date, params.session, params.parent]
  );

  const heading =
    params.parent !== undefined ? t("journal.addUpdate") : newEntryHeading(initial.kind);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {state.status === "ready" ? (
        <EntryComposer api={api} initial={initial} heading={heading} sessions={state.data} />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      )}
    </SafeAreaView>
  );
}
