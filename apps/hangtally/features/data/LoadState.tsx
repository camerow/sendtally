import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { QueryState } from "@sendtally/features/query";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

export type LoadStateProps = { state: QueryState<unknown>; onRetry: () => void };

export function LoadState({ state, onRetry }: LoadStateProps): React.ReactElement {
  const c = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 32,
        backgroundColor: c.ground,
      }}
    >
      {state.status === "error" ? (
        <>
          <Text style={[type.bodyBold, { fontSize: 16, color: c.onDark, textAlign: "center" }]}>
            {t("hang.loadFailed")}
          </Text>
          <Text style={[type.body, { fontSize: 14, color: c.onDark3, textAlign: "center" }]}>
            {state.message}
          </Text>
          <Button label={t("hang.retry")} onPress={onRetry} variant="accent" />
        </>
      ) : (
        <ActivityIndicator color={c.accent} />
      )}
    </View>
  );
}
