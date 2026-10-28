import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useClimb } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { ScreenFrame } from "../../components/ScreenFrame";
import { useApi } from "../../lib/api";
import { press, pressRow } from "../../lib/press";
import { DetailActions } from "../training/components/DetailActions";
import { LoadState } from "../training/data/LoadState";
import { AddNoteSheet } from "./AddNoteSheet";
import { LabelTile } from "./LabelTile";
import { RenameSheet } from "./RenameSheet";

/** One climb: a Project chip to mark it, its days, tries and best, and every session on it. */
export function ClimbDetailScreen({ id }: { id: string }): React.ReactElement {
  const api = useApi();
  const { state, setWorking, rename, addNote, reload } = useClimb(api, id);
  const [noting, setNoting] = React.useState(false);
  const [renaming, setRenaming] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  if (state.status !== "ready")
    return <LoadState state={state} onRetry={() => void reload()} framed />;

  const { climb, vm } = state.data;
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
    <ScreenFrame action={<DetailActions onEdit={() => setRenaming((n) => n + 1)} />}>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            style={{ flex: 1, fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSecondary }}
          >
            {vm.eyebrow}
          </Text>
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
        </View>
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
      </View>
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
              <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary }}>
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
    </ScreenFrame>
  );
}
