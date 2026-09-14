import React from "react";
import { Pressable, Text, View } from "react-native";
import type { StoredSessionDraft } from "@sendtally/features/log-session";
import { formatDate, t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import { confirmDiscardDraft } from "./confirmDiscardDraft";

function Action({
  label,
  onPress,
  background,
  text,
  flex,
}: {
  label: string;
  onPress: () => void;
  background: string;
  text: string;
  flex: number;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={press({
        flex,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.control,
        backgroundColor: background,
        borderWidth: background === "transparent" ? 1 : 0,
        borderColor: "rgba(64,63,76,0.32)",
      })}
    >
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: text }}>{label}</Text>
    </Pressable>
  );
}

export function DraftBanner({
  stored,
  onResume,
  onStartFresh,
}: {
  stored: StoredSessionDraft;
  onResume: () => void;
  onStartFresh: () => void;
}): React.ReactElement {
  const { draft, savedAt } = stored;
  const count = draft.climbs.length;
  const climbs = t("common.climbCount", { count });

  return (
    <View style={{ gap: 12, backgroundColor: colors.gold, borderRadius: radius.card, padding: 16 }}>
      <View style={{ gap: 3 }}>
        <Text
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: 15,
            lineHeight: 20,
            color: colors.gunmetal,
          }}
        >
          {t("logSession.unfinished", {
            when: formatDate(savedAt, { weekday: "long", hour: "numeric", minute: "2-digit" }),
          })}
        </Text>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "rgba(64,63,76,0.7)",
          }}
        >
          {t("logSession.draftMetaShort", {
            climbs,
            start: draft.startTime,
            end: draft.endTime,
          })}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Action
          label={t("logSession.startFresh")}
          onPress={() => confirmDiscardDraft(stored, onStartFresh)}
          background="transparent"
          text="rgba(64,63,76,0.8)"
          flex={1}
        />
        <Action
          label={t("logSession.pickUpShort")}
          onPress={onResume}
          background={colors.gunmetal}
          text={colors.white}
          flex={1.4}
        />
      </View>
    </View>
  );
}
