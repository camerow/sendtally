import React from "react";
import { Link, useNavigate } from "react-router";
import type { JournalEntry } from "@sendtally/api-client";
import { effortTile, kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { forgetLiveSession } from "@sendtally/features/log-session";
import { useSessionDetail } from "@sendtally/features/session-detail";
import { ClimbingHero } from "../../climbs/components/ClimbingHero";
import { AddNoteSheet } from "../../components/AddNoteSheet";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { StravaStatusRow } from "../../components/detail/StravaStatusRow";
import { stravaMenuItem } from "../../components/detail/stravaMenuItem";
import { SummaryTiles } from "../../components/detail/SummaryTiles";
import { MoreMenu } from "../../components/MoreMenu";
import { Pyramid } from "../../components/Pyramid";
import { PyramidLegend } from "../../components/PyramidLegend";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { liveSessionStorage } from "../../lib/localStorages";
import { useAppApi } from "../../lib/useAppApi";
import { LoadState } from "../../training/data/LoadState";
import { SessionClimbTable } from "./SessionClimbTable";
import { SessionJournal } from "./SessionJournal";

type Noting = { id: string; day: string; note: string; entry: JournalEntry } | "new" | null;

/** One logged climbing session: what, where and how hard, its Strava state, the pyramid, its climbs and notes. */
export function SessionDetail({ fingerprint }: { fingerprint: string }): React.ReactElement {
  const api = useAppApi();
  const navigate = useNavigate();
  const toast = useToast();
  const feature = useSessionDetail(api, fingerprint);
  const [noting, setNoting] = React.useState<Noting>(null);
  const [deleting, setDeleting] = React.useState(false);
  const { state, sort, setSort } = feature;

  if (state.status !== "ready") {
    return (
      <DetailFrame backTo="/app">
        <LoadState
          state={state}
          onRetry={() => void feature.reload()}
          title={t("sessionDetail.loadFailed")}
        />
      </DetailFrame>
    );
  }

  const { vm, climbs, entries, strava } = state.data;
  const editHref = `/app/sessions/${encodeURIComponent(fingerprint)}/edit`;
  const onStrava = (): void => {
    if (strava?.kind === "posted") window.open(strava.url, "_blank", "noopener");
    else if (strava?.kind === "connect") void navigate("/app/setup");
    else feature.post.run();
  };
  const remove = (): void => {
    setDeleting(false);
    api
      .deleteLoggedSession(fingerprint)
      .then(() => {
        forgetLiveSession(liveSessionStorage, fingerprint);
        return navigate("/app");
      })
      .catch(() => toast.show({ message: t("sessionDetail.deleteFailed") }));
  };

  return (
    <DetailFrame
      backTo="/app"
      action={
        <MoreMenu
          label={t("summary.more")}
          items={[
            ...(vm.editable
              ? [{ label: t("logSession.editTitle"), onSelect: () => void navigate(editHref) }]
              : []),
            ...(strava === null ? [] : [stravaMenuItem(strava, onStrava)]),
            {
              label: t("sessions.deleteSession"),
              onSelect: () => setDeleting(true),
              destructive: true,
            },
          ]}
        />
      }
    >
      <ClimbingHero kind={kindLabel("climbing")} title={vm.name} place={vm.place} meta={vm.when} />
      {vm.areas.length > 0 && (
        <span className="session-areas">
          {vm.areas.map((area) => (
            <Link key={area.slug} to={`/app/areas/${area.slug}`} className="session-area">
              {area.name} ›
            </Link>
          ))}
        </span>
      )}
      <SummaryTiles
        stats={[
          { value: String(vm.filterCounts.all), label: t("summary.climbs") },
          effortTile(vm.rpe, null),
          { value: String(vm.filterCounts.sent), label: t("summary.sent") },
        ]}
      />
      {strava !== null && <StravaStatusRow state={strava} />}

      {vm.pyramid.length > 0 && (
        <div className="session-pyramid">
          <PyramidLegend inner={t("common.sent")} outer={t("sessionDetail.notYet")} />
          <Pyramid
            rows={vm.pyramid}
            label={vm.pyramid.map((r) => `${r.gradeLabel}: ${r.countLabel}`).join(". ")}
          />
        </div>
      )}

      <SessionClimbTable climbs={climbs} climbAreas={vm.climbAreas} sort={sort} onSort={setSort} />
      <SessionJournal
        entries={entries}
        onAdd={() => setNoting("new")}
        onOpen={(entry) =>
          setNoting({ id: entry.id, day: entry.occurred_at, note: entry.body, entry })
        }
      />
      <AddNoteSheet
        note={noting}
        day={vm.startDay}
        onSave={(day, body) =>
          void feature.saveNote(
            day,
            body,
            noting === "new" || noting === null ? undefined : noting.entry
          )
        }
        onDelete={(id) => void feature.deleteNote(id)}
        onClose={() => setNoting(null)}
      />
      <Sheet
        open={deleting}
        title={t("sessions.deleteTitle")}
        onClose={() => setDeleting(false)}
        action={{ label: t("common.delete"), danger: true, onPress: remove }}
      >
        <p className="sheet-body">
          {strava?.kind === "posted" ? t("summary.deleteHintStrava") : t("sessions.deleteBody")}
        </p>
      </Sheet>
    </DetailFrame>
  );
}
