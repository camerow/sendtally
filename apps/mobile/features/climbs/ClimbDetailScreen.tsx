import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { randomUUID } from "expo-crypto";
import type { ClimbNote } from "@sendtally/api-client";
import { useClimb } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { NoteRow } from "../../components/NoteRow";
import { ScreenFrame } from "../../components/ScreenFrame";
import { SectionHeading } from "../../components/SectionHeading";
import { useApi } from "../../lib/api";
import { Button } from "../training/components/Button";
import { DetailActions } from "../training/components/DetailActions";
import { deleteRow } from "../training/components/deleteRow";
import { LoadState } from "../training/data/LoadState";
import { HistoryList } from "../training/history/HistoryList";
import { SummaryTiles } from "../training/summary/SummaryTiles";
import { AddNoteSheet } from "./AddNoteSheet";
import { ClimbingHero } from "./ClimbingHero";
import { ClimbPill } from "./ClimbPill";

/** One climb: Project when it is one, its days, tries and best, every session on it, and Log session. */
export function ClimbDetailScreen({ id }: { id: string }): React.ReactElement {
  const api = useApi();
  const { state, saveNote, deleteNote, remove, reload } = useClimb(api, id, randomUUID);
  const [noting, setNoting] = React.useState<ClimbNote | "new" | null>(null);

  if (state.status !== "ready")
    return <LoadState state={state} onRetry={() => void reload()} framed />;

  const { climb, vm } = state.data;

  return (
    <ScreenFrame
      action={
        <DetailActions
          menu={[
            {
              icon: "pencil",
              title: t("climbs.editClimb"),
              onPress: () =>
                router.push({ pathname: "/climb/log", params: { climbId: climb.id, edit: "1" } }),
            },
            deleteRow({
              title: t("climbs.deleteClimb"),
              confirm: {
                title: t("climbs.deleteClimb"),
                body: t("climbs.deleteConfirm", { name: vm.name }),
              },
              onDelete: remove,
            }),
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
        title={vm.title}
        meta={vm.meta}
        kicker={vm.project ? <ClimbPill kind="project" label={t("common.project")} /> : undefined}
      />
      <SummaryTiles
        stats={[
          { value: vm.days, label: t("climbs.days") },
          { value: vm.tries, label: t("logSession.tries") },
          { value: vm.best, label: t("statistics.best") },
        ]}
      />
      <View style={{ gap: 2 }}>
        <SectionHeading
          title={t("common.notes")}
          add={{ label: t("climbs.addNote"), onPress: () => setNoting("new") }}
        />
        {vm.notes.map((n) => (
          <NoteRow key={n.id} date={n.dateLabel} body={n.note} onPress={() => setNoting(n)} />
        ))}
      </View>
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
        note={noting}
        onSave={(day, note) =>
          saveNote({ ...(noting !== "new" && noting !== null && { id: noting.id }), day, note })
        }
        onDelete={deleteNote}
        onClose={() => setNoting(null)}
      />
    </ScreenFrame>
  );
}
