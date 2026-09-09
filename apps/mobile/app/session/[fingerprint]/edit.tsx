import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSessionDraft } from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";
import { LogSessionForm } from "../../../features/log-session/LogSessionForm";
import { useApi } from "../../../lib/api";

export default function EditSessionScreen(): React.ReactElement {
  const { fingerprint } = useLocalSearchParams<{ fingerprint: string }>();
  const api = useApi();
  const state = useSessionDraft(api, fingerprint ?? "");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      {state.status === "loading" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.gunmetal} />
        </View>
      )}
      {(state.status === "error" || (state.status === "ready" && !state.data.editable)) && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.watermelonInk,
              textAlign: "center",
            }}
          >
            {state.status === "error"
              ? "Could not load this session."
              : "This session was synced from a board and is kept as read-only history."}
          </Text>
        </View>
      )}
      {state.status === "ready" && state.data.editable && (
        <LogSessionForm editing={{ fingerprint: fingerprint ?? "", draft: state.data.draft }} />
      )}
    </SafeAreaView>
  );
}
