import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { justLogged, justLoggedText, useJustLogged } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Toast } from "../../../components/Toast";

const ROOM = 72;

/** What a review just saved, above the tab bar it landed on, with a way to open it. */
export function JustLoggedToast(): React.ReactElement | null {
  const logged = useJustLogged();
  if (logged === null) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, bottom: "100%", height: ROOM }}
    >
      <Toast
        bottom={8}
        message={justLoggedText(logged)}
        action={{
          label: t("common.view"),
          onPress: () => router.push({ pathname: "/activity/[id]", params: { id: logged.id } }),
        }}
        onHide={justLogged.clear}
      />
    </View>
  );
}
