import { router } from "expo-router";
import React from "react";
import { Text, useWindowDimensions, View } from "react-native";
import type { SendtallyApi } from "@sendtally/api-client";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { alwaysFree, trialPanel, useMembersGet } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { Title } from "../training/components/Title";
import { type } from "../training/type";
import { MembersGet } from "./MembersGet";
import { useBilling } from "./useBilling";

export function ClosingOffer({ api }: { api: SendtallyApi }): React.ReactElement | null {
  const view = useMembersGet(api);
  const state = useBilling()?.membership.state;
  const oneColumn = useWindowDimensions().fontScale >= 2;
  if (view === null || state?.status !== "ready") return null;
  const trial = trialPanel(state.data);
  return (
    <>
      {trial !== null && (
        <View
          style={{
            backgroundColor: colors.gold,
            borderRadius: radius.card,
            paddingTop: 16,
            paddingHorizontal: 18,
            paddingBottom: 18,
            gap: 6,
          }}
        >
          <Text style={[type.labelSmall, { color: colors.gunmetal }]}>{trial.eyebrow}</Text>
          <Title size={38} style={{ lineHeight: 38 }}>
            {trial.headline}
          </Title>
          <Text
            style={{
              fontFamily: fonts.sansSemiBold,
              fontSize: 15,
              lineHeight: 20,
              color: colors.gunmetal,
            }}
          >
            {trial.note}
          </Text>
        </View>
      )}
      <View style={{ gap: 10 }}>
        <Title size={26}>{t("billing.alwaysFree")}</Title>
        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8, columnGap: 12 }}>
          {alwaysFree().map((line, i) => (
            <View
              key={line}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                ...(i === 0 || oneColumn ? { width: "100%" } : { flexBasis: "40%", flexGrow: 1 }),
              }}
            >
              <Icon name="check" size={16} strokeWidth={3} color={colors.fern} />
              <Text
                style={{
                  flexShrink: 1,
                  fontFamily: fonts.sansSemiBold,
                  fontSize: 14,
                  lineHeight: 18,
                  color: colors.gunmetal,
                }}
              >
                {line}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <MembersGet view={view} onBecomeMember={() => router.push("/membership?source=onboarding")} />
    </>
  );
}
