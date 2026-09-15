import * as Application from "expo-application";
import * as Updates from "expo-updates";
import React from "react";
import { Text, View } from "react-native";
import { formatDate, t } from "@sendtally/features/i18n";
import { monoMuted } from "../../lib/styles";

function dot(parts: (string | null | undefined)[]): string {
  return parts.filter((part): part is string => Boolean(part)).join(" · ");
}

/** Which binary is installed, and which bundle it is running - the two questions a stale app raises. */
export function BuildInfo(): React.ReactElement {
  const version = dot([
    `${Application.nativeApplicationVersion ?? "?"} (${Application.nativeBuildVersion ?? "?"})`,
    Updates.channel,
    Updates.runtimeVersion?.slice(0, 8),
  ]);
  const bundle = Updates.isEmbeddedLaunch
    ? t("settings.embeddedBundle")
    : dot([
        Updates.updateId?.slice(0, 8),
        Updates.createdAt === null
          ? null
          : formatDate(Updates.createdAt, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }),
      ]);

  return (
    <View style={{ alignItems: "center", gap: 3, paddingTop: 8 }}>
      <Text style={monoMuted}>{version}</Text>
      <Text style={monoMuted}>{bundle}</Text>
    </View>
  );
}
