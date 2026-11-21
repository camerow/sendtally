import React from "react";
import { Button } from "@sendtally/design";
import { useAreaClimbSearch, withAreaClimb, withTypedName } from "@sendtally/features/areas";
import { climbSuggestions, useClimbs } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import {
  disciplineLabel,
  disciplineOf,
  draftGrade,
  gradeOptions,
  localDate,
  logClimbOnDay,
  newClimb,
  withClimbDiscipline,
  withPickedClimb,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import {
  ADD_OUTCOMES,
  addedClimb,
  addOutcomeLabel,
  addOutcomePill,
  asLogged,
  climbAddedEvent,
  needsClimbName,
  sendsAdded,
  useDisplayScales,
  useHistoryCard,
  yearDate,
  type AddedClimb,
  type AddOutcome,
} from "@sendtally/features/settings";
import { ClimbLogRow } from "../../climbs/components/ClimbLogRow";
import { ComboField } from "../../components/ComboField";
import { GradeChips } from "../../components/GradeChips";
import { Icon } from "../../components/Icon";
import { Segmented } from "../../components/Segmented";
import { inputStyle } from "../../components/styles";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { HistoryCard } from "./components/HistoryCard";

const YEARS = 12;

/** H2h: past climbs that mattered, each saved on its own Add, the card beside them growing with them. */
export const AddClimbsStep: StepComponent = ({ wizard, api }) => {
  const scales = useDisplayScales();
  const card = useHistoryCard(api);
  const { state } = useClimbs(api);
  const mine = state.status === "ready" ? state.data.climbs : [];
  const [climb, setClimb] = React.useState<ClimbDraft>(() => ({
    ...newClimb("climb-1", scales.boulder),
    grade: "",
  }));
  const [outcome, setOutcome] = React.useState<AddOutcome>("send");
  const [now] = React.useState(() => new Date());
  const [year, setYear] = React.useState(now.getFullYear());
  const [day, setDay] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [added, setAdded] = React.useState<readonly AddedClimb[]>([]);

  const areaClimbs = useAreaClimbSearch(api, climb.name, null, true).found;
  const suggestions = climbSuggestions(climb.name, mine, areaClimbs, null);
  const discipline = disciplineOf(climb.scale);
  const ladder = gradeOptions(climb.scale);
  const at = ladder.indexOf(climb.grade);
  const needsName = needsClimbName(climb, outcome);
  const picked = climb.grade !== "" && draftGrade(climb.grade, climb.scale) !== undefined;
  const canAdd = picked && !needsName && !saving;
  const years = Array.from({ length: YEARS }, (_, i) => String(now.getFullYear() - i));

  const cardRef = React.useRef<HTMLDivElement>(null);
  const showCard = (): void => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardRef.current?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  };

  const add = (): void => {
    if (!canAdd) return;
    setSaving(true);
    setFailed(false);
    logClimbOnDay(api, asLogged(climb, outcome), day ?? yearDate(year, now), []).then(
      () => {
        showCard();
        wizard.capture("climb_added", climbAddedEvent(climb, outcome, day));
        setAdded((list) => [
          addedClimb(`${list.length}`, climb, outcome, { year, day }, scales),
          ...list,
        ]);
        setClimb({ ...climb, name: "", grade: "" });
        setSaving(false);
      },
      () => {
        setSaving(false);
        setFailed(true);
      }
    );
  };

  const total = card?.climbs ?? 0;
  return (
    <WizardFrame
      wizard={wizard}
      wide
      footer={
        <Button
          variant="azure"
          disabled={total === 0}
          onClick={() =>
            total > 0 &&
            wizard.next({
              count: added.length,
              sends: sendsAdded(added),
            })
          }
        >
          {total === 0
            ? t("onboarding.history.add.see")
            : t("onboarding.history.add.seeCount", { count: total })}
        </Button>
      }
    >
      <div className="history-head">
        <h1 className="wizard-title">{t("onboarding.history.add.title")}</h1>
        <p className="history-lede">{t("onboarding.history.add.body")}</p>
      </div>
      <div className="add-climbs">
        <div ref={cardRef} className="add-climbs-card">
          {card !== null && (
            <HistoryCard vm={card} label={t("onboarding.history.card.soFar")} max={4} next raised />
          )}
        </div>
        <div className="add-climbs-form">
          <div className="field">
            <span className="field-label">{t("climbs.climb")}</span>
            <ComboField
              value={climb.name}
              ariaLabel={t("climbs.climb")}
              placeholder={t("climbs.namePlaceholder")}
              inputStyle={inputStyle}
              items={suggestions.map((s) => ({
                key: s.key,
                label: s.name,
                meta: s.meta,
                onPick: () => {
                  if (s.kind === "areas") setClimb(withAreaClimb(climb, s.climb));
                  else
                    setClimb(
                      withPickedClimb(
                        { ...climb, scale: s.climb.grade?.scale ?? scales[s.climb.discipline] },
                        s.climb
                      )
                    );
                },
              }))}
              onChange={(name) => setClimb(withTypedName(climb, name))}
            />
          </div>
          <div className="field">
            <div className="add-climbs-field-head">
              <span className="field-label">{t("common.grade")}</span>
              <Segmented
                soft
                label={t("climbs.discipline")}
                options={(["boulder", "route"] as const).map((d) => ({
                  value: d,
                  label: disciplineLabel(d),
                }))}
                value={discipline}
                onChange={(d) => setClimb({ ...withClimbDiscipline(climb, d, scales), grade: "" })}
              />
            </div>
            <GradeChips
              label={t("common.grade")}
              chips={ladder.map((g) => ({ key: g, label: g }))}
              active={at < 0 ? null : climb.grade}
              startIndex={Math.max(0, at)}
              onPick={(grade) => setClimb({ ...climb, grade })}
            />
          </div>
          <div className="field">
            <span className="field-label">{t("onboarding.history.add.howItWent")}</span>
            <Segmented
              soft
              label={t("onboarding.history.add.howItWent")}
              options={ADD_OUTCOMES.map((o) => ({ value: o, label: addOutcomeLabel(o) }))}
              value={outcome}
              onChange={setOutcome}
            />
            {needsName && (
              <span className="add-climbs-warn">{t("onboarding.history.add.needsName")}</span>
            )}
          </div>
          <div className="field">
            <div className="add-climbs-field-head">
              <span className="field-label">{t("onboarding.history.add.whenRoughly")}</span>
              <button
                type="button"
                className="history-link"
                onClick={() => setDay(day === null ? localDate(now) : null)}
              >
                {t("onboarding.history.add.pickDay")}
              </button>
            </div>
            {day === null ? (
              <GradeChips
                label={t("onboarding.history.add.whenRoughly")}
                chips={years.map((y) => ({ key: y, label: y }))}
                active={String(year)}
                startIndex={0}
                onPick={(y) => setYear(Number(y))}
              />
            ) : (
              <input
                type="date"
                className="field-input"
                aria-label={t("logSession.date")}
                value={day}
                max={localDate(now)}
                onChange={(e) => e.target.value !== "" && setDay(e.target.value)}
              />
            )}
          </div>
          {failed && <span className="add-climbs-error">{t("climbs.saveFailed")}</span>}
          <button
            type="button"
            className="outline-button outline-button--wide"
            disabled={!canAdd}
            onClick={add}
          >
            <Icon name="plus" size={16} strokeWidth={2.4} />
            {t("climbs.addClimb")}
          </button>
          {added.length > 0 && (
            <div>
              <span className="history-section-label">
                {t("onboarding.history.add.addedCount", { n: added.length })}
              </span>
              {added.map((a) => (
                <ClimbLogRow
                  key={a.key}
                  row={{
                    id: null,
                    gradeLabel: a.gradeLabel,
                    name: a.name,
                    meta: a.when,
                    pill: addOutcomePill(a.outcome),
                  }}
                  onPress={null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </WizardFrame>
  );
};
