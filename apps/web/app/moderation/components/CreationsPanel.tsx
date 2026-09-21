import React from "react";
import type { CreationItem, CreationResult, SendtallyApi } from "@sendtally/api-client";
import {
  creationEntity,
  creationId,
  creationRef,
  decisionOrder,
  EVERY_CREATION,
  filterCreations,
  groupCreations,
  idsBetween,
  inChunks,
  REJECT_REASONS,
  useModerationAction,
  useModerationCreations,
  type CreationFilter,
} from "@sendtally/features/areas";
import { BulkBar } from "./BulkBar";
import { CreationGroupSection } from "./CreationGroupSection";
import { CreationRow } from "./CreationRow";
import { CreationToolbar } from "./CreationToolbar";
import { MoveDialog } from "./MoveDialog";
import { NoteDialog } from "./NoteDialog";

type Dialog = { kind: "reject" | "move"; ids: string[] } | null;

const typing = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** "6 approved · 1 skipped: changed since you loaded it" */
function summaryOf(results: CreationResult[], verb: string): string {
  const skipped = results.filter((result) => result.error !== null);
  const done = `${results.length - skipped.length} ${verb}`;
  return skipped.length === 0
    ? done
    : `${done} · ${skipped.length} skipped: ${[...new Set(skipped.map((r) => r.error))].join(", ")}`;
}

export function CreationsPanel({ api }: { api: SendtallyApi }): React.ReactElement {
  const { state } = useModerationCreations(api);
  const { busy, error, run } = useModerationAction();
  const [filter, setFilter] = React.useState<CreationFilter>(EVERY_CREATION);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [collapsed, setCollapsed] = React.useState<ReadonlySet<string>>(new Set());
  const [dialog, setDialog] = React.useState<Dialog>(null);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [anchor, setAnchor] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const queue = state.status === "ready" ? state.data : null;
  const groups = React.useMemo(
    () => groupCreations(filterCreations(queue?.items ?? [], filter), filter.sort),
    [queue, filter]
  );
  const rows = groups.flatMap((group) => group.rows);
  const open = groups.flatMap((group) => (collapsed.has(group.key) ? [] : group.rows));
  const byId = new Map(rows.map((row) => [row.id, row.item]));
  const chosen = rows.filter((row) => selected.has(row.id)).map((row) => row.item);
  const itemsOf = (ids: string[]): CreationItem[] => ids.flatMap((id) => byId.get(id) ?? []);

  const select = (ids: string[], on: boolean): void =>
    setSelected((before) => {
      const next = new Set(before);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  const toggle = (ids: string[]): void => select(ids, !ids.every((id) => selected.has(id)));

  const finish = (results: CreationResult[], verb: string): void => {
    setNotice(summaryOf(results, verb));
    select(
      results.filter((result) => result.error === null).map((result) => result.id),
      false
    );
    setDialog(null);
  };

  const decide = (action: "approve" | "reject", ids: string[], note?: string): void =>
    void run(async () => {
      const results = await inChunks(decisionOrder(itemsOf(ids), action), (items) =>
        api.decideCreations({ action, note, items })
      );
      finish(results, action === "approve" ? "approved" : "rejected");
    });

  const move = (ids: string[], parent: { id: string; name: string }): void =>
    void run(async () => {
      const results = await inChunks(itemsOf(ids).map(creationRef), (items) =>
        api.moveCreations(parent.id, items)
      );
      finish(results, `moved under ${parent.name}`);
    });

  // Keys act on the selection when there is one, otherwise on the row the cursor is on.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const now = { open, cursor, chosen, dialog };
      if (now.dialog !== null || typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const ids = now.open.map((row) => row.id);
      const at = now.cursor === null ? -1 : ids.indexOf(now.cursor);
      const targets =
        now.chosen.length > 0
          ? now.chosen.map(creationId)
          : now.cursor === null
            ? []
            : [now.cursor];
      const acts: Record<string, () => void> = {
        j: () => setCursor(ids[Math.min(at + 1, ids.length - 1)] ?? null),
        k: () => setCursor(ids[Math.max(at - 1, 0)] ?? null),
        x: () => now.cursor !== null && toggle([now.cursor]),
        a: () => targets.length > 0 && decide("approve", targets),
        r: () => targets.length > 0 && setDialog({ kind: "reject", ids: targets }),
        m: () => targets.length > 0 && setDialog({ kind: "move", ids: targets }),
        Escape: () => setSelected(new Set()),
      };
      const act = acts[e.key];
      if (act === undefined) return;
      e.preventDefault();
      act();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (state.status === "loading") return <span className="area-meta">Loading…</span>;
  if (queue === null)
    return <span className="area-meta">Could not load the moderation queue.</span>;
  if (queue.count === 0) return <p className="area-empty">Nothing waiting here.</p>;

  const only = dialog?.ids.length === 1 ? byId.get(dialog.ids[0] ?? "") : undefined;
  const clean = rows.filter((row) => row.item.candidates.length === 0).map((row) => row.id);
  const allIds = rows.map((row) => row.id);

  return (
    <div className="mod-creations">
      <CreationToolbar filter={filter} onChange={setFilter} />

      <div className="mod-columns">
        <input
          type="checkbox"
          className="mod-check"
          aria-label="Select everything shown"
          checked={rows.length > 0 && chosen.length === rows.length}
          onChange={() => toggle(allIds)}
        />
        <span>Name</span>
        <span>Type / grade</span>
        <span>Submitter</span>
        <span>Queued</span>
        <span>Possible duplicate of</span>
        <button type="button" className="mod-pill" onClick={() => select(clean, true)}>
          Select clean
        </button>
      </div>

      <span className="area-meta">
        {`${rows.length} shown of ${queue.count} pending · ${groups.length} ${groups.length === 1 ? "area" : "areas"}`}
        <span className="mod-keys"> · keys: j k move, x select, a approve, r reject, m move</span>
      </span>
      {queue.count > queue.items.length && (
        <span className="area-meta">{`The oldest ${queue.items.length} are loaded; the rest follow as these are decided.`}</span>
      )}
      {notice !== null && (
        <span className="mod-notice" role="status">
          {notice}
        </span>
      )}
      {error !== null && dialog === null && (
        <span className="area-error" role="alert">
          {error}
        </span>
      )}
      {rows.length === 0 && (
        <p className="area-empty">Nothing matches. Clear the search or filters.</p>
      )}

      {groups.map((group) => {
        const ids = group.rows.map((row) => row.id);
        return (
          <CreationGroupSection
            key={group.key}
            group={group}
            selectedCount={ids.filter((id) => selected.has(id)).length}
            collapsed={collapsed.has(group.key)}
            busy={busy}
            onToggleAll={() => toggle(ids)}
            onToggleCollapsed={() =>
              setCollapsed((before) => {
                const next = new Set(before);
                if (!next.delete(group.key)) next.add(group.key);
                return next;
              })
            }
            onApproveAll={() => decide("approve", ids)}
          >
            {group.rows.map((row) => (
              <CreationRow
                key={row.id}
                row={row}
                selected={selected.has(row.id)}
                current={cursor === row.id}
                busy={busy}
                onSelect={(id, range) => {
                  const ids = range && anchor !== null ? idsBetween(allIds, anchor, id) : [id];
                  select(ids, !selected.has(id));
                  setAnchor(id);
                  setCursor(id);
                }}
                onApprove={(id) => decide("approve", [id])}
                onReject={(id) => setDialog({ kind: "reject", ids: [id] })}
                onMove={(id) => setDialog({ kind: "move", ids: [id] })}
                onMergeInto={(id, keepId) => void run(() => api.mergeClimbInto(id, keepId))}
              />
            ))}
          </CreationGroupSection>
        );
      })}

      {chosen.length > 0 && (
        <BulkBar
          areas={chosen.filter((item) => item.entity_type === "area").length}
          climbs={chosen.filter((item) => item.entity_type === "climb").length}
          flagged={chosen.filter((item) => item.candidates.length > 0).length}
          busy={busy}
          onClear={() => setSelected(new Set())}
          onMove={() => setDialog({ kind: "move", ids: chosen.map(creationId) })}
          onReject={() => setDialog({ kind: "reject", ids: chosen.map(creationId) })}
          onApprove={() => decide("approve", chosen.map(creationId))}
        />
      )}

      {dialog?.kind === "reject" && (
        <NoteDialog
          title={
            only === undefined
              ? `Reject ${dialog.ids.length} submissions`
              : `Reject ${creationEntity(only).name}`
          }
          submitLabel="Reject"
          busy={busy}
          error={error}
          reasons={REJECT_REASONS}
          hint={
            dialog.ids.length > 1
              ? "One note goes to every submitter. An area is only rejected once everything inside it is."
              : undefined
          }
          onClose={() => setDialog(null)}
          onSubmit={(note) => decide("reject", dialog.ids, note)}
        />
      )}
      {dialog?.kind === "move" && (
        <MoveDialog
          api={api}
          count={dialog.ids.length}
          busy={busy}
          error={error}
          onClose={() => setDialog(null)}
          onSubmit={(parent) => move(dialog.ids, parent)}
        />
      )}
    </div>
  );
}
