import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { QueryState } from "@sendtally/features/query";
import { t } from "@sendtally/features/i18n";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Button } from "../components/Button";
import { type } from "../type";

export type LoadStateProps = {
  state: QueryState<unknown>;
  onRetry: () => void;
  /** What failed to load; the training by default. */
  title?: string;
  /** Inside a detail screen's frame, so Back stays put while it loads or fails. */
  framed?: boolean;
};

export function LoadState({
  state,
  onRetry,
  title,
  framed = false,
}: LoadStateProps): React.ReactElement {
  const body = (
    <View
      style={{
        flex: 1,
        minHeight: 160,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 32,
      }}
    >
      {state.status === "error" ? (
        <>
          <Text
            style={[type.bodyBold, { fontSize: 16, color: colors.gunmetal, textAlign: "center" }]}
          >
            {title ?? t("hang.loadFailed")}
          </Text>
          <Text
            style={[type.body, { fontSize: 14, color: colors.textSecondary, textAlign: "center" }]}
          >
            {state.message}
          </Text>
          <Button label={t("hang.retry")} onPress={onRetry} variant="primary" />
        </>
      ) : (
        <ActivityIndicator color={colors.gunmetal} />
      )}
    </View>
  );
  return framed ? <ScreenFrame>{body}</ScreenFrame> : body;
}
