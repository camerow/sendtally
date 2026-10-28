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
import { AddNoteSheet } from "./AddNoteSheet";
import { LabelTile } from "./LabelTile";
import { RenameSheet } from "./RenameSheet";

/** One climb: a Project pill to mark it, its days, tries and best, and every session on it. */
export function ClimbDetailScreen({ id }: { id: string }): React.ReactElement {
  const api = useApi();
  const { state, setWorking, rename, addNote } = useClimb(api, id);
  const [noting, setNoting] = React.useState(false);
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable
            onPress={() => void setWorking(!vm.project)}
            accessibilityRole="switch"
            accessibilityState={{ checked: vm.project }}
            accessibilityLabel={t("common.project")}
            style={press({
              height: 36,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              borderRadius: 18,
              backgroundColor: vm.project ? colors.gold : colors.surfaceSoft,
            })}
          >
            <Icon name="star" color={colors.gunmetal} size={15} strokeWidth={2} />
            <Text
              style={{ fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.gunmetal }}
            >
              {t("common.project")}
            </Text>
          </Pressable>
          <Pressable
            onPress={more}
            accessibilityRole="button"
            accessibilityLabel={t("climbs.more")}
            style={press({ width: 44, height: 44, alignItems: "center", justifyContent: "center" })}
          >
            <Icon name="more" color={colors.gunmetal} size={20} strokeWidth={3} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{
          gap: 14,
          paddingHorizontal: 18,
          paddingTop: 10,
          paddingBottom: 24,
        }}
      >
        <Text style={{ fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSecondary }}>
          {vm.eyebrow}
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.displayHeavy,
            fontSize: 34,
            lineHeight: 38,
            letterSpacing: -1,
            color: colors.gunmetal,
          }}
        >
          {vm.name}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <LabelTile label={t("climbs.days")} value={vm.days} />
          <LabelTile label={t("logSession.tries")} value={vm.tries} />
          <LabelTile label={t("statistics.best")} value={vm.best} />
        </View>
        <View>
          {vm.sessions.map((s) => (
            <Pressable
              key={s.fingerprint}
              onPress={() =>
                router.push({
                  pathname: "/session/[fingerprint]",
                  params: { fingerprint: s.fingerprint },
                })
              }
              accessibilityRole="button"
              style={pressRow({
                minHeight: 60,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.lineOnLightSoft,
              })}
            >
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
                >
                  {s.dateLabel}
                </Text>
                <Text
                  style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary }}
                >
                  {s.meta}
                </Text>
                {s.note !== null && (
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors.gunmetal,
                    }}
                  >
                    {s.note}
                  </Text>
                )}
              </View>
              <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.gunmetal }}>
                {s.triesLabel}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => setNoting(true)}
          accessibilityRole="button"
          style={press({
            height: 52,
            borderRadius: radius.card,
            borderWidth: 1.5,
            borderColor: "rgba(64,63,76,0.3)",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
            {t("climbs.addNote")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: "/climb/log", params: { climbId: climb.id } })}
          accessibilityRole="button"
          style={press({
            height: 52,
            borderRadius: radius.card,
            borderWidth: 1.5,
            borderColor: "rgba(64,63,76,0.3)",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}>
            {t("climbs.logSession")}
          </Text>
        </Pressable>
      </ScrollView>
      <AddNoteSheet
        visible={noting}
        sessions={vm.sessions}
        onSave={addNote}
        onClose={() => setNoting(false)}
      />
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
