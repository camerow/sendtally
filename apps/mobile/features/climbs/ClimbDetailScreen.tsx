import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useClimb } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { BackButton } from "../../components/BackButton";
import { Icon } from "../../components/Icon";
import { useApi } from "../../lib/api";
import { press, pressRow } from "../../lib/press";
import { RenameSheet } from "./RenameSheet";

const eyebrow = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.9,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

/** Every visit to one climb, newest first, and a way to log today's. */
export function ClimbDetailScreen({ id }: { id: string }): React.ReactElement {
  const api = useApi();
  const { state, setWorking, rename } = useClimb(api, id);
  const [renaming, setRenaming] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  if (state.status !== "ready") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
        <View style={{ paddingHorizontal: 12 }}>
          <BackButton label={t("climbs.title")} />
        </View>
        <View style={{ padding: 28, alignItems: "center" }}>
          {state.status === "loading" ? (
            <ActivityIndicator color={colors.gunmetal} />
          ) : (
            <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted }}>
              {state.message}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const { climb, vm } = state.data;
  const more = (): void =>
    Alert.alert(vm.name, undefined, [
      { text: t("climbs.rename"), onPress: () => setRenaming((n) => n + 1) },
      {
        text: vm.working ? t("climbs.stopWorking") : t("climbs.markWorking"),
        onPress: () => void setWorking(!vm.working),
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);

  const save = (name: string): void => {
    setSaving(true);
    setFailed(false);
    rename(name).then(
      (next) => {
        setSaving(false);
        setRenaming(0);
        if (next !== climb.id) router.replace({ pathname: "/climb/[id]", params: { id: next } });
      },
      () => {
        setSaving(false);
        setFailed(true);
      }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
        }}
      >
        <BackButton label={t("climbs.title")} />
        <Pressable
          onPress={more}
          accessibilityRole="button"
          accessibilityLabel={t("climbs.more")}
          style={press({ width: 44, height: 44, alignItems: "center", justifyContent: "center" })}
        >
          <Icon name="more" color={colors.gunmetal} size={20} strokeWidth={3} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 }}
      >
        <Text style={eyebrow}>{vm.eyebrow}</Text>
        <View
          style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 14 }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: fonts.displayHeavy,
              fontSize: 38,
              lineHeight: 42,
              letterSpacing: -1.1,
              color: colors.gunmetal,
            }}
          >
            {vm.name}
          </Text>
          {vm.gradeLabel !== null && (
            <Text
              style={{
                fontFamily: fonts.displayHeavy,
                fontSize: 38,
                lineHeight: 42,
                letterSpacing: -1.1,
                color: colors.azureInk,
              }}
            >
              {vm.gradeLabel}
            </Text>
          )}
        </View>
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.gunmetal }}>
          {vm.status}
        </Text>
        <View>
          {vm.visits.map((v) => (
            <Pressable
              key={v.fingerprint}
              onPress={() =>
                router.push({
                  pathname: "/session/[fingerprint]",
                  params: { fingerprint: v.fingerprint },
                })
              }
              accessibilityRole="button"
              style={pressRow({
                flexDirection: "row",
                gap: 14,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.lineOnLightSoft,
              })}
            >
              <View style={{ width: 40, alignItems: "center" }}>
                <Text style={{ ...eyebrow, fontSize: 9 }}>{v.month}</Text>
                <Text
                  style={{ fontFamily: fonts.monoSemiBold, fontSize: 18, color: colors.gunmetal }}
                >
                  {v.dayOfMonth}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
                >
                  {v.triesLabel}
                </Text>
                {v.note !== null && (
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors.textSecondary,
                    }}
                  >
                    {v.note}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: 12,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLight,
        }}
      >
        <Pressable
          onPress={() => router.push({ pathname: "/climb/log", params: { climbId: climb.id } })}
          accessibilityRole="button"
          style={press({
            height: 54,
            borderRadius: radius.card,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.gunmetal,
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.white }}>
            {t("climbs.logToday")}
          </Text>
        </Pressable>
      </View>
      <RenameSheet
        key={renaming}
        visible={renaming > 0}
        name={vm.name}
        saving={saving}
        failed={failed}
        onSave={save}
        onClose={() => setRenaming(0)}
      />
    </SafeAreaView>
  );
}
