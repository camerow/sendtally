import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { typicalGradeIndex, useClimbVocabulary } from "@sendtally/features/climbs";
import { useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  finishLiveSession,
  finishSummary,
  tallyElapsedSeconds,
  tallySummary,
  useLiveSession,
  useLocalSessions,
  useTally,
} from "@sendtally/features/log-session";
import { queries, useQuery } from "@sendtally/features/query";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { useRest } from "@sendtally/features/workouts";
import { GradeChips } from "../../components/GradeChips";
import { Icon } from "../../components/Icon";
import { LiveClock } from "../../components/LiveClock";
import { Sheet } from "../../components/Sheet";
import { climbKindStorage } from "../../lib/localStorages";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../../lib/useGoBack";
import { useExerciseTallyStorage, useLiveRunStore } from "../../lib/useLiveRun";
import { useLiveSessionStorage } from "../../lib/useLiveSessionStorage";
import { ExerciseClock } from "./ExerciseClock";
import { LapsTally } from "./LapsTally";
import { FinishSheet } from "./FinishSheet";
import { GymSheet } from "./GymSheet";
import { LiveClimbEditor } from "./LiveClimbEditor";
import { TallyRow } from "./TallyRow";
import { UndoSnackbar } from "./UndoSnackbar";

export type TallyPageProps = {
  /**
   * Logs the workout exercise the player started it on, back into the player: its sets end on
   * their last climb or their time, and rest; Done hands the climbs back, asking no effort.
   */
  exercise?: boolean;
};

/** The gym session as it happens: a grade starts a climb, then Fell or Sent for each go. */
export function TallyPage({ exercise = false }: TallyPageProps): React.ReactElement | null {
  const api = useAppApi();
  const navigate = useNavigate();
  const leave = useGoBack("/app");
  const [params] = useSearchParams();
  const sessionStorage = useLiveSessionStorage();
  const exerciseStorage = useExerciseTallyStorage();
  const storage = exercise ? exerciseStorage : sessionStorage;
  const live = useLiveSession(storage);
  const rest = useRest(useLiveRunStore());
  const localSessions = useLocalSessions(api, () => crypto.randomUUID());
  const gyms = useGyms(api);
  const vocabulary = useClimbVocabulary(api);
  const { scales } = useGradeScalePrefs(api);
  const sessions = useQuery(queries.sessions(api)).state;
  const [editing, setEditing] = React.useState<string | null>(null);
  const [picking, setPicking] = React.useState(false);
  const [finishing, setFinishing] = React.useState(params.get("finish") === "1");
  const [discarding, setDiscarding] = React.useState(false);
  const tally = useTally({
    live,
    rest,
    exercise,
    gyms: gyms.gyms,
    settled: sessions.status !== "loading" && gyms.state.status !== "loading",
    lastGymId:
      sessions.status === "ready"
        ? (sessions.data.sessions.find((s) => s.gym_id !== null)?.gym_id ?? undefined)
        : undefined,
    scales,
    kindStorage: climbKindStorage,
    typicalIndex: (scale) => typicalGradeIndex(vocabulary.climbs, scale),
  });
  const { draft, gym, circuitGym, selection, snack } = tally;

  if (draft === null || (exercise && draft.exercise === undefined))
    return <div className="tally" />;

  const done = (): void => {
    tally.done();
    leave();
  };
  if (exercise && draft.exercise?.lap !== undefined)
    return (
      <LapsTally
        draft={draft}
        live={live}
        rest={rest}
        now={tally.now}
        gymName={gym?.name ?? t("gyms.noGym")}
        prefs={scales}
        vocabulary={vocabulary}
        gyms={circuitGym === null ? [] : [circuitGym]}
        onDone={done}
      />
    );

  const save = (rpe: number | null): void => {
    const fingerprint = finishLiveSession(localSessions.save, storage, rpe);
    setFinishing(false);
    if (fingerprint === null) leave();
    else void navigate(`/app/sessions/${encodeURIComponent(fingerprint)}`, { replace: true });
  };

  const minutes = Math.floor(tallyElapsedSeconds(draft, new Date()) / 60);
  const editingClimb = draft.climbs.find((c) => c.key === editing) ?? null;
  const { active, off, segment } = tally;
  const gymName = gym?.name ?? t("gyms.noGym");

  return (
    <div className="tally">
      <div className="tally-column">
        <div className="tally-head">
          <button
            type="button"
            className="tally-minimise"
            aria-label={t("tally.minimise")}
            onClick={leave}
          >
            <Icon name="chevron" size={20} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="tally-gym"
            aria-label={`${t("gyms.gym")}, ${gymName}`}
            onClick={() => setPicking(true)}
          >
            <span className="tally-gym-name">{gymName}</span>
            <span className="tally-gym-chevron">
              <Icon name="chevron" size={14} strokeWidth={2.2} />
            </span>
          </button>
          <button
            type="button"
            className="tally-finish"
            onClick={exercise ? done : () => setFinishing(true)}
          >
            {exercise ? t("common.done") : t("tally.finish")}
          </button>
        </div>
        {exercise ? (
          <ExerciseClock clock={tally.clock} rest={rest} />
        ) : (
          <div className="tally-clock">
            <LiveClock elapsed={(at) => tallyElapsedSeconds(draft, at)} className="tally-time" />
            <span className="tally-summary">{tallySummary(draft)}</span>
          </div>
        )}
        <div className="tally-list">
          {tally.groups.every((g) => g.climbs.length === 0) ? (
            <p className="tally-empty">{t("tally.pickGrade")}</p>
          ) : (
            tally.groups.map((group) => (
              <React.Fragment key={group.set}>
                {group.label !== "" && <span className="tally-set-label">{group.label}</span>}
                {group.climbs.length === 0 && group.label !== "" && (
                  <p className="tally-set-empty">
                    {t("tally.pickGradeForSet", { set: group.set })}
                  </p>
                )}
                {group.climbs.map((climb) => (
                  <TallyRow
                    key={climb.key}
                    climb={climb}
                    selected={selection?.kind === "row" && selection.key === climb.key}
                    onPress={() => tally.toggleRow(climb.key)}
                    onEdit={() => setEditing(climb.key)}
                  />
                ))}
              </React.Fragment>
            ))
          )}
          {snack !== null && (
            <UndoSnackbar
              id={snack.id}
              message={snack.message}
              onUndo={tally.undo}
              onExpire={tally.clearSnack}
            />
          )}
        </div>
        <div className="tally-controls">
          <div className="tally-segments" role="radiogroup" aria-label={t("climbs.discipline")}>
            {tally.segments.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={d === segment}
                className="tally-segment"
                onClick={() => tally.pickSegment(d)}
              >
                {tally.segmentLabel(d)}
              </button>
            ))}
          </div>
          <GradeChips
            dark
            label={t("common.grade")}
            chips={tally.chips}
            active={active}
            startIndex={tally.startIndex}
            onPick={tally.pick}
          />
          <div className="tally-goes">
            <button
              type="button"
              className="tally-fell"
              disabled={off}
              onClick={() => tally.go("fell")}
            >
              {t("tally.fell")}
            </button>
            <button
              type="button"
              className="tally-sent-button"
              disabled={off}
              onClick={() => tally.go("sent")}
            >
              {t("common.sent")}
            </button>
          </div>
        </div>
      </div>
      <LiveClimbEditor
        climb={editingClimb}
        index={editingClimb === null ? 0 : draft.climbs.indexOf(editingClimb)}
        count={draft.climbs.length}
        prefs={scales}
        vocabulary={vocabulary}
        gyms={circuitGym === null ? [] : [circuitGym]}
        onChange={(c) => live.updateClimb(c.key, () => c, gyms.gyms)}
        onRemove={() => {
          if (editing !== null)
            live.replace({ ...draft, climbs: draft.climbs.filter((c) => c.key !== editing) });
          tally.clearSelection();
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
      <GymSheet
        open={picking}
        gyms={gyms.gyms}
        gymId={draft.gymId}
        onPick={(gymId) => {
          tally.pickGym(gymId);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
      <FinishSheet
        open={finishing && !discarding}
        summary={finishSummary(draft, minutes)}
        onSave={save}
        onDiscard={() => setDiscarding(true)}
        onClose={() => setFinishing(false)}
      />
      <Sheet
        open={discarding}
        title={t("tally.discardTitle")}
        onClose={() => setDiscarding(false)}
        action={{
          label: t("common.discard"),
          danger: true,
          onPress: () => {
            live.discard();
            setDiscarding(false);
            setFinishing(false);
            leave();
          },
        }}
      >
        <p className="sheet-body">{t("tally.discardBody")}</p>
      </Sheet>
    </div>
  );
}
