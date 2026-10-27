import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { press } from "../../lib/press";

export const UNDO_MS = 4000;

export type UndoSnackbarProps = {
  /** A new id for each tap restarts the countdown. */
  id: number;
  message: string;
  bottom: number;
  onUndo: () => void;
  onExpire: () => void;
};

export function UndoSnackbar({
  id,
  message,
  bottom,
  onUndo,
  onExpire,
}: UndoSnackbarProps): React.ReactElement {
  const expire = React.useRef(onExpire);
  React.useEffect(() => {
    expire.current = onExpire;
  });
  React.useEffect(() => {
    const timer = setTimeout(() => expire.current(), UNDO_MS);
    return () => clearTimeout(timer);
  }, [id]);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        position: "absolute",
        left: 18,
        right: 18,
        bottom,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.white,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 14,
        paddingRight: 6,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.gunmetal }}>
        {message}
      </Text>
      <Pressable
        onPress={onUndo}
        accessibilityRole="button"
        style={press({ height: 44, paddingHorizontal: 10, justifyContent: "center" })}
      >
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.azureInk }}>
          {t("tally.undo")}
        </Text>
      </Pressable>
    </View>
  );
}
