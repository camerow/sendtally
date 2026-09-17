import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { draftFromEntry, useEntryDetail } from "@sendtally/features/journal";
import { colors, fonts } from "@sendtally/design/tokens";
import { EntryComposer } from "../../../features/journal/EntryComposer";
import { useApi } from "../../../lib/api";

export default function EditEntryScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const { state } = useEntryDetail(api, id ?? "");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {state.status === "loading" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      )}
      {state.status === "error" && (
        <Text
          style={{ padding: 24, fontFamily: fonts.mono, fontSize: 12, color: colors.watermelonInk }}
        >
          {t("journal.loadFailed")}
        </Text>
      )}
      {state.status === "ready" && (
        <EntryComposer
          api={api}
          initial={draftFromEntry(state.data.entry)}
          editing={state.data.entry.id}
          heading={t("journal.editEntry")}
          sessions={state.data.sessions}
          entries={state.data.entries}
        />
      )}
    </SafeAreaView>
  );
}
