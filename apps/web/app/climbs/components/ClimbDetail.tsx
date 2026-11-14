import React from "react";
import { useNavigate } from "react-router";
import { useClimb, type ProjectNoteVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { AddNoteSheet } from "../../components/AddNoteSheet";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { HistoryList } from "../../components/detail/HistoryList";
import { NoteRow } from "../../components/detail/NoteRow";
import { SectionHeading } from "../../components/detail/SectionHeading";
import { SummaryTiles } from "../../components/detail/SummaryTiles";
import { MoreMenu } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../../lib/useGoBack";
import { LoadState } from "../../training/data/LoadState";
import { ClimbingHero } from "./ClimbingHero";
import { ClimbPill } from "./ClimbPill";

/** One climb: Project when it is one, its days, tries and best, every session on it, and Log session. */
export function ClimbDetail({ id }: { id: string }): React.ReactElement {
  const api = useAppApi();
  const navigate = useNavigate();
  const goBack = useGoBack("/app");
  const { state, saveNote, deleteNote, remove, reload } = useClimb(api, id, () =>
    crypto.randomUUID()
  );
  const [noting, setNoting] = React.useState<ProjectNoteVM | "new" | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  if (state.status !== "ready") {
    return (
      <DetailFrame backTo="/app">
        <LoadState state={state} onRetry={() => void reload()} title={t("climbs.notFound")} />
      </DetailFrame>
    );
  }

  const { climb, vm } = state.data;
  const log = (edit: boolean): void =>
    void navigate(
      `/app/log/climbs/new?climbId=${encodeURIComponent(climb.id)}${edit ? "&edit=1" : ""}`
    );

  return (
    <DetailFrame
      backTo="/app"
      action={
        <MoreMenu
          label={t("summary.more")}
          items={[
            { label: t("climbs.editClimb"), onSelect: () => log(true) },
            {
              label: t("climbs.deleteClimb"),
              onSelect: () => setDeleting(true),
              destructive: true,
            },
          ]}
        />
      }
      footer={
        <button type="button" className="detail-primary" onClick={() => log(false)}>
          {t("climbs.logSession")}
        </button>
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
      <section className="detail-section">
        <SectionHeading
          title={t("common.notes")}
          add={{ label: t("climbs.addNote"), onPress: () => setNoting("new") }}
        />
        {vm.notes.map((n) => (
          <NoteRow key={n.id} date={n.dateLabel} body={n.note} onPress={() => setNoting(n)} />
        ))}
      </section>
      <HistoryList
        items={vm.sessions.map((s) => ({
          id: s.fingerprint,
          date: s.dateLabel,
          name: s.name,
          meta: [s.meta, s.triesLabel].filter((p) => p !== "").join(" · "),
          rpe: s.rpe,
          opens: s.opens,
        }))}
        to={(fingerprint) => `/app/sessions/${encodeURIComponent(fingerprint)}`}
      />
      <AddNoteSheet
        note={noting}
        onSave={(day, note) =>
          saveNote({
            ...(noting !== "new" && noting !== null && { id: noting.id, source: noting.source }),
            day,
            note,
          })
        }
        onDelete={() => noting !== "new" && noting !== null && deleteNote(noting)}
        onClose={() => setNoting(null)}
      />
      <Sheet
        open={deleting}
        title={t("climbs.deleteClimb")}
        onClose={() => setDeleting(false)}
        action={{
          label: t("common.delete"),
          danger: true,
          onPress: () => {
            remove();
            goBack();
          },
        }}
      >
        <p className="sheet-body">{t("climbs.deleteConfirm", { name: vm.name })}</p>
      </Sheet>
    </DetailFrame>
  );
}
