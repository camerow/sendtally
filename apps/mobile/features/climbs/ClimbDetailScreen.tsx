import { router } from "expo-router";
import React from "react";
import { randomUUID } from "expo-crypto";
import type { ClimbNote } from "@sendtally/api-client";
import { useClimb } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { ScreenFrame } from "../../components/ScreenFrame";
import { useApi } from "../../lib/api";
import { Button } from "../training/components/Button";
import { DetailActions } from "../training/components/DetailActions";
import { LoadState } from "../training/data/LoadState";
import { HistoryList } from "../training/history/HistoryList";
import { SummaryTiles } from "../training/summary/SummaryTiles";
import { AddNoteSheet } from "./AddNoteSheet";
import { ClimbingHero } from "./ClimbingHero";
import { ClimbPill } from "./ClimbPill";

/** One climb: Project when it is one, its days, tries and best, every session on it, and Log session. */
export function ClimbDetailScreen({ id }: { id: string }): React.ReactElement {
  const api = useApi();
  const { state, saveNote, deleteNote, reload } = useClimb(api, id, randomUUID);
  const [noting, setNoting] = React.useState<ClimbNote | "new" | null>(null);

  if (state.status !== "ready")
    return <LoadState state={state} onRetry={() => void reload()} framed />;

  const { climb, vm } = state.data;

  return (
    <ScreenFrame
      action={
        <DetailActions
          onEdit={() =>
            router.push({ pathname: "/climb/log", params: { climbId: climb.id, edit: "1" } })
          }
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
        title={vm.title}
        meta={vm.meta}
        aside={vm.project ? <ClimbPill kind="project" label={t("common.project")} /> : undefined}
      />
      <SummaryTiles
        stats={[
          { value: vm.days, label: t("climbs.days") },
          { value: vm.tries, label: t("logSession.tries") },
          { value: vm.best, label: t("statistics.best") },
        ]}
      />
      <HistoryList
        onAdd={{ label: t("climbs.addNote"), onPress: () => setNoting("new") }}
        items={[
          ...vm.sessions.map((s) => ({
            day: s.day,
            item: {
              id: s.fingerprint,
              date: s.dateLabel,
              name: s.name,
              meta: `${s.meta} · ${s.triesLabel}`,
              rpe: s.rpe,
              note: s.note,
            },
          })),
          ...vm.notes.map((n) => ({
            day: n.day,
            item: {
              id: n.id,
              date: n.dateLabel,
              name: t("climbs.note"),
              meta: "",
              rpe: null,
              note: n.note,
              kind: "note" as const,
            },
          })),
        ]
          .sort((a, b) => b.day.localeCompare(a.day))
          .map((row) => row.item)}
        onOpen={(rowId) => {
          const note = vm.notes.find((n) => n.id === rowId);
          if (note !== undefined) setNoting(note);
          else router.push({ pathname: "/session/[fingerprint]", params: { fingerprint: rowId } });
        }}
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
