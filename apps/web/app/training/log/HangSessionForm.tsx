import React from "react";
import type { HangSessionRecord } from "@sendtally/api-client";
import { protocolDose, type ItemDone } from "@sendtally/core/hang";
import { hangCount, hangGrid, hangSets, keptSets } from "@sendtally/features/activities";
import { hangResult } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { hangTitle } from "@sendtally/features/sessions";
import { KIND_LOOK } from "@sendtally/features/training";
import { useToast } from "../../components/Toast";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useGoBack } from "../../lib/useGoBack";
import { useHangData } from "../data/HangDataContext";
import { DoneDetails } from "./DoneDetails";
import { EffortField } from "./EffortField";
import { FocusField } from "./FocusField";
import { SetupPill } from "./SetupPill";

/**
 * Edit a finished hangboard session: its day, grip, each set's hangs and load under the pill
 * that sets the edge and every set's load not changed by hand, effort and focus.
 */
export function HangSessionForm({ session }: { session: HangSessionRecord }): React.ReactElement {
  const { model, actions, today } = useHangData();
  const back = useGoBack("/app");
  const toast = useToast();
  const [draft, setDraft] = React.useState(session);
  const update = (patch: Partial<HangSessionRecord>): void => setDraft((d) => ({ ...d, ...patch }));
  const ids = { date: React.useId(), grip: React.useId() };
  const kind = session.protocol.kind;
  const unit = model.settings.units;
  const [sets, setSets] = React.useState<{ done: ItemDone[]; off: string[] }>(() => ({
    done: [
      {
        item: 0,
        exercise: session.gripId,
        sets: hangSets(session).map(({ weightKg, ...set }) =>
          weightKg === undefined || weightKg === session.loadKg ? set : { ...set, weightKg }
        ),
      },
    ],
    off: [],
  }));
  const result = hangResult(
    keptSets(sets.done, sets.off),
    [{ exercise: session.gripId, dose: protocolDose(session.protocol) }],
    () => ({
      exercise: draft.gripId,
      setup: { edgeMm: draft.edgeMm, loadKg: draft.loadKg },
      hang: kind === "hang",
    })
  );
  const grid = hangGrid({ ...draft, done: result.done });
  const grips = model.grips.filter((g) => !g.hidden || g.id === draft.gripId);

  const save = (): void => {
    const { stravaActivityId: _s, postState: _p, postError: _e, updatedAt: _u, ...fields } = draft;
    void actions.saveSession({
      ...fields,
      done: result.done,
      pct: result.pct,
      misses: result.misses,
    });
    back();
  };

  return (
    <DetailFrame
      backTo="/app"
      backLabel={t("common.cancel")}
      footer={
        <button type="button" className="detail-primary" onClick={save}>
          {t("common.save")}
        </button>
      }
    >
      <span className="train-label form-mode">{t("summary.editWorkout")}</span>
      <h1 className="train-title form-title">{hangTitle(session)}</h1>
      <div className="form-row">
        <div className="form-section">
          <label htmlFor={ids.date} className="train-label">
            {t("hang.date")}
          </label>
          <input
            id={ids.date}
            type="date"
            className="form-input"
            value={draft.date}
            max={today}
            required
            onChange={(e) => e.target.value !== "" && update({ date: e.target.value })}
          />
        </div>
        <div className="form-section">
          <label htmlFor={ids.grip} className="train-label">
            {t("hang.grip")}
          </label>
          <select
            id={ids.grip}
            className="form-input"
            value={draft.gripId}
            onChange={(e) => update({ gripId: e.target.value })}
          >
            {grips.map((g) => (
              <option key={g.id} value={g.id}>
                {model.gripName(g.id)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <DoneDetails
        done={sets.done.map((d) => ({ ...d, exercise: model.gripName(draft.gripId) }))}
        off={sets.off}
        planned={[protocolDose(session.protocol)]}
        unit={unit}
        color={KIND_LOOK.hangboard.ink}
        hangs
        hangLoadKg={draft.loadKg}
        setup={
          <SetupPill
            kind={kind}
            setup={{ edgeMm: draft.edgeMm, loadKg: draft.loadKg }}
            kicker={model.gripName(draft.gripId)}
            onChange={(setup) => update(setup)}
          />
        }
        onRemoved={(message, undo) =>
          toast.show({ message, action: { label: t("tally.undo"), onPress: undo } })
        }
        onChange={(done, off) => setSets({ done, off })}
      />
      <span className="hang-count">{hangCount(grid, unit)}</span>
      <EffortField value={draft.rpe} onChange={(rpe) => update({ rpe })} />
      <FocusField value={draft.focus} onChange={(focus) => update({ focus })} />
    </DetailFrame>
  );
}
