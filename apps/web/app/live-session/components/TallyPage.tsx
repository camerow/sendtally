import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { typicalGradeIndex, useClimbVocabulary } from "@sendtally/features/climbs";
import {
  CIRCUIT_HEX,
  circuitLabel,
  gymOfDraft,
  liveGymOfDraft,
  useGyms,
} from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import {
  disciplineLabel,
  finishLiveSession,
  finishSummary,
  gradeOptions,
  readClimbKind,
  tallyDraft,
  tallyElapsedSeconds,
  tallyStep,
  tallySummary,
  useLiveSession,
  useLocalSessions,
  type Discipline,
  type LogSessionDraft,
  type TallyChoice,
  type TallyGo,
  type TallySelection,
  type TallyUndo,
} from "@sendtally/features/log-session";
import { queries, useQuery } from "@sendtally/features/query";
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { GradeChips, type GradeChip } from "../../components/GradeChips";
import { Icon } from "../../components/Icon";
import { LiveClock } from "../../components/LiveClock";
import { Sheet } from "../../components/Sheet";
import { climbKindStorage } from "../../lib/localStorages";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../../lib/useGoBack";
import { useLiveSessionStorage } from "../../lib/useLiveSessionStorage";
import { FinishSheet } from "./FinishSheet";
import { GymSheet } from "./GymSheet";
import { LiveClimbEditor } from "./LiveClimbEditor";
import { TallyRow } from "./TallyRow";
import { UndoSnackbar } from "./UndoSnackbar";

type Segment = Discipline | "circuit";

/** The gym session as it happens: a grade starts a climb, then Fell or Sent for each go. */
export function TallyPage(): React.ReactElement | null {
  const api = useAppApi();
  const navigate = useNavigate();
  const leave = useGoBack("/app");
  const [params] = useSearchParams();
  const storage = useLiveSessionStorage();
  const live = useLiveSession(storage);
  const localSessions = useLocalSessions(api, () => crypto.randomUUID());
  const gyms = useGyms(api);
  const vocabulary = useClimbVocabulary(api);
  const { scales } = useGradeScalePrefs(api);
  const sessions = useQuery(queries.sessions(api)).state;
  const [selection, setSelection] = React.useState<TallySelection>(null);
  const [snack, setSnack] = React.useState<TallyUndo | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [picking, setPicking] = React.useState(false);
  const [finishing, setFinishing] = React.useState(params.get("finish") === "1");
  const [discarding, setDiscarding] = React.useState(false);
  const [discipline, setDiscipline] = React.useState<Discipline>(() =>
    readClimbKind(climbKindStorage, []) === "route" ? "route" : "boulder"
  );
  const [onCircuit, setOnCircuit] = React.useState(true);

  const started = React.useRef(false);
  const settled = sessions.status !== "loading" && gyms.state.status !== "loading";
  const draft = live.stored?.draft ?? null;
  React.useEffect(() => {
    if (started.current || !settled) return;
    started.current = true;
    if (draft !== null) return;
    const lastGym =
      sessions.status === "ready"
        ? sessions.data.sessions.find((s) => s.gym_id !== null)?.gym_id
        : undefined;
    const gymId = gyms.gyms.some((g) => g.id === lastGym) ? (lastGym ?? undefined) : undefined;
    live.start(tallyDraft(new Date(), { gymId }));
  }, [settled, draft, live, sessions, gyms.gyms]);

  if (draft === null) return <div className="tally" />;

  const gym = gymOfDraft(gyms.gyms, draft.gymId);
  const circuitGym = liveGymOfDraft(gyms.gyms, draft.gymId);
  const scale = scales[discipline];
  const segment: Segment = circuitGym !== null && onCircuit ? "circuit" : discipline;
  const segments: Segment[] =
    circuitGym === null ? ["boulder", "route"] : ["boulder", "route", "circuit"];
  const chips: GradeChip[] =
    segment === "circuit" && circuitGym !== null
      ? circuitGym.circuits.map((c) => ({
          key: c.id,
          label: circuitLabel(c),
          colour: CIRCUIT_HEX[c.colour],
        }))
      : gradeOptions(scale).map((g) => ({ key: g, label: g }));

  const choiceOf = (chip: string): TallyChoice | null => {
    if (segment !== "circuit" || circuitGym === null) return { kind: "grade", scale, grade: chip };
    const circuit = circuitGym.circuits.find((c) => c.id === chip);
    return circuit === undefined ? null : { kind: "circuit", gym: circuitGym, circuit };
  };

  const go = (g: TallyGo): void => {
    const step = tallyStep(draft, selection, g, choiceOf, snack);
    if (step === null) return;
    setSelection(step.selection);
    live.replace(step.draft);
    setSnack(step.undo);
  };

  const undo = (): void => {
    if (snack === null) return;
    live.replace(snack.draft);
    setSelection(snack.selection);
    setSnack(null);
  };

  const pickGym = (gymId: string | undefined): void => {
    const { gymId: _gym, ...rest } = draft;
    live.replace(gymId === undefined ? rest : { ...rest, gymId });
    setOnCircuit(true);
    setSelection(null);
    setPicking(false);
  };

  const pickSegment = (next: Segment): void => {
    setOnCircuit(next === "circuit");
    if (next !== "circuit") {
      setDiscipline(next);
      climbKindStorage.write(next);
    }
    setSelection(null);
  };

  const save = (rpe: number | null): void => {
    const fingerprint = finishLiveSession(localSessions.save, storage, rpe);
    setFinishing(false);
    if (fingerprint === null) leave();
    else void navigate(`/app/sessions/${encodeURIComponent(fingerprint)}`, { replace: true });
  };

  const minutes = Math.floor(tallyElapsedSeconds(draft, new Date()) / 60);
  const climbs: LogSessionDraft["climbs"] = [...draft.climbs].reverse();
  const editingClimb = draft.climbs.find((c) => c.key === editing) ?? null;
  const active = selection?.kind === "pending" ? selection.chip : null;
  const off = selection === null;
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
          <button type="button" className="tally-finish" onClick={() => setFinishing(true)}>
            {t("tally.finish")}
          </button>
        </div>
        <div className="tally-clock">
          <LiveClock elapsed={(at) => tallyElapsedSeconds(draft, at)} className="tally-time" />
          <span className="tally-summary">{tallySummary(draft)}</span>
        </div>
        <div className="tally-list">
          {climbs.length === 0 ? (
            <p className="tally-empty">{t("tally.pickGrade")}</p>
          ) : (
            climbs.map((climb) => (
              <TallyRow
                key={climb.key}
                climb={climb}
                selected={selection?.kind === "row" && selection.key === climb.key}
                onPress={() =>
                  setSelection(
                    selection?.kind === "row" && selection.key === climb.key
                      ? null
                      : { kind: "row", key: climb.key }
                  )
                }
                onEdit={() => setEditing(climb.key)}
              />
            ))
          )}
          {snack !== null && (
            <UndoSnackbar
              id={snack.id}
              message={snack.message}
              onUndo={undo}
              onExpire={() => setSnack(null)}
            />
          )}
        </div>
        <div className="tally-controls">
          <div className="tally-segments" role="radiogroup" aria-label={t("climbs.discipline")}>
            {segments.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={d === segment}
                className="tally-segment"
                onClick={() => pickSegment(d)}
              >
                {d === "circuit" ? t("gyms.circuit") : disciplineLabel(d)}
              </button>
            ))}
          </div>
          <GradeChips
            dark
            label={t("common.grade")}
            chips={chips}
            active={active}
            startIndex={segment === "circuit" ? 0 : typicalGradeIndex(vocabulary.climbs, scale)}
            onPick={(chip) => setSelection({ kind: "pending", chip })}
          />
          <div className="tally-goes">
            <button type="button" className="tally-fell" disabled={off} onClick={() => go("fell")}>
              {t("tally.fell")}
            </button>
            <button
              type="button"
              className="tally-sent-button"
              disabled={off}
              onClick={() => go("sent")}
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
          setSelection(null);
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
      <GymSheet
        open={picking}
        gyms={gyms.gyms}
        gymId={draft.gymId}
        onPick={pickGym}
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
