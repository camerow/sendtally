import { router } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";
import { useClimb } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { ScreenFrame } from "../../components/ScreenFrame";
import { useApi } from "../../lib/api";
import { press } from "../../lib/press";
import { Button } from "../training/components/Button";
import { DetailActions } from "../training/components/DetailActions";
import { LoadState } from "../training/data/LoadState";
import { HistoryList } from "../training/history/HistoryList";
import { SummaryTiles } from "../training/summary/SummaryTiles";
import { AddNoteSheet } from "./AddNoteSheet";
import { ClimbingHero } from "./ClimbingHero";
import { RenameSheet } from "./RenameSheet";

/** One climb: a Project chip to mark it, its days, tries and best, every session on it, and Log session. */
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
    <ScreenFrame
      action={
        <DetailActions
          onEdit={() => setRenaming((n) => n + 1)}
          menu={[
            {
              icon: "journal",
              title: t("climbs.addNote"),
              hint: t("climbs.addNoteHint"),
              onPress: () => setNoting(true),
            },
          ]}
        />
      }
      footer={
        <Button
          label={t("climbs.logSession")}
          onPress={() => router.push({ pathname: "/climb/log", params: { climbId: climb.id } })}
          variant="primary"
          height={54}
        />
      }
    >
      <ClimbingHero
        kind={vm.kicker}
        title={vm.name}
        meta={vm.meta}
        aside={
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
        }
      />
      <SummaryTiles
        stats={[
          { value: vm.days, label: t("climbs.days") },
          { value: vm.tries, label: t("logSession.tries") },
          { value: vm.best, label: t("statistics.best") },
        ]}
      />
      <HistoryList
        items={vm.sessions.map((s) => ({
          id: s.fingerprint,
          date: s.dateLabel,
          name: s.name,
          meta: `${s.meta} · ${s.triesLabel}`,
          rpe: s.rpe,
          note: s.note,
        }))}
        onOpen={(fingerprint) =>
          router.push({ pathname: "/session/[fingerprint]", params: { fingerprint } })
        }
      />
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
