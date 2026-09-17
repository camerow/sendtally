import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import type { Gym } from "@sendtally/features/gyms";
import {
  climbOutcome,
  disciplineOf,
  gymOfCircuit,
  withClimbDiscipline,
  withClimbOutcome,
  withTries,
  type ClimbDraft,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { CircuitFields } from "../../gyms/components/CircuitFields";
import {
  EnduranceLapOutcome,
  EnduranceLaps,
  EnduranceTargetField,
  EnduranceUnitField,
  useSelectedLap,
} from "./EnduranceFields";
import { ClimbGradeSelect, ClimbKindSelect } from "./ClimbKindSelect";
import { ClimbNameField } from "./ClimbNameField";
import { ClimbNoteField } from "./ClimbNoteField";
import { DisciplineToggle } from "./DisciplineToggle";
import { Glyph } from "./Glyph";
import { OutcomeControl } from "./OutcomeControl";
import { ProjectToggle } from "./ProjectToggle";
import { TriesStepper } from "./TriesStepper";
import { CROSS, columnHead, stepperButton } from "./styles";

function LabelRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="climb-card-result">
      <span style={columnHead}>{label}</span>
      {children}
    </div>
  );
}

export type ClimbCardProps = {
  climb: ClimbDraft;
  gyms?: readonly Gym[];
  prefs: GradePrefs;
  removable: boolean;
  project: boolean;
  suggestions: ClimbSummary[];
  onChange: (climb: ClimbDraft) => void;
  onChangeName: (name: string) => void;
  onPick: (climb: ClimbSummary) => void;
  onToggleProject: () => void;
  onRemove: () => void;
};

export function ClimbCard({
  climb,
  gyms = [],
  prefs,
  removable,
  project,
  suggestions,
  onChange,
  onChangeName,
  onPick,
  onToggleProject,
  onRemove,
}: ClimbCardProps): React.ReactElement {
  const named = climb.name.trim() !== "";
  const endurance = climb.endurance !== undefined;
  const gym = gymOfCircuit(gyms, climb.circuit?.id);
  const [selectedLap, selectLap] = useSelectedLap(climb);
  return (
    <div className="climb-card">
      <div className="climb-card-main">
        <div className="climb-card-cell">
          <span style={columnHead}>{endurance ? t("endurance.oneLapIs") : t("common.grade")}</span>
          {endurance ? (
            <EnduranceTargetField climb={climb} onChange={onChange} />
          ) : (
            <ClimbGradeSelect
              climb={climb}
              gyms={gyms}
              style={{ height: "auto", padding: "11px 8px" }}
              onChange={onChange}
            />
          )}
        </div>
        <div className="climb-card-cell">
          <span style={columnHead}>{t("logSession.nameOptional")}</span>
          <ClimbNameField
            value={climb.name}
            scale={climb.scale}
            suggestions={suggestions}
            placeholder={
              endurance
                ? t("endurance.namePlaceholder")
                : gym === null
                  ? t("logSession.climbNamePlaceholder")
                  : t("logSession.circuitClimbNamePlaceholder")
            }
            onChange={onChangeName}
            onPick={onPick}
          />
        </div>
        <div className="climb-card-cell">
          <span style={columnHead}>{endurance ? t("endurance.unit") : t("logSession.tries")}</span>
          {endurance ? (
            <EnduranceUnitField climb={climb} onChange={onChange} />
          ) : (
            <TriesStepper
              tries={climb.tries}
              onChange={(tries) => onChange(withTries(climb, tries))}
            />
          )}
        </div>
        <button
          type="button"
          aria-label={t("logSession.removeClimb")}
          disabled={!removable}
          onClick={onRemove}
          style={{
            ...stepperButton,
            width: 32,
            height: 32,
            alignSelf: "end",
            border: "none",
            color: "rgba(64,63,76,0.45)",
            opacity: removable ? 1 : 0,
          }}
        >
          <Glyph d={CROSS} width={1.7} />
        </button>
      </div>
      <LabelRow label={t("logSession.climbKind")}>
        <ClimbKindSelect
          climb={climb}
          gyms={gyms}
          prefs={prefs}
          style={{ height: 40, padding: "8px 12px", maxWidth: 240 }}
          onChange={onChange}
        />
      </LabelRow>
      {endurance && (
        <>
          <LabelRow label={t("endurance.laps")}>
            <EnduranceLaps
              climb={climb}
              selected={selectedLap}
              onSelect={selectLap}
              onChange={onChange}
            />
          </LabelRow>
          <LabelRow label={t("endurance.lapNumber", { n: selectedLap + 1 })}>
            <EnduranceLapOutcome climb={climb} selected={selectedLap} onChange={onChange} />
          </LabelRow>
          <LabelRow label={t("endurance.feltLike")}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <DisciplineToggle
                value={disciplineOf(climb.scale)}
                onChange={(d) => onChange(withClimbDiscipline(climb, d, prefs))}
              />
              <ClimbGradeSelect
                climb={climb}
                gyms={gyms}
                style={{ width: 100, height: 40, padding: "0 10px" }}
                onChange={onChange}
              />
            </div>
          </LabelRow>
        </>
      )}
      {gym !== null && <CircuitFields climb={climb} gym={gym} onChange={onChange} />}
      {!endurance && (
        <LabelRow label={t("common.result")}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <OutcomeControl
              discipline={disciplineOf(climb.scale)}
              outcome={climbOutcome(climb)}
              onChange={(outcome) => onChange(withClimbOutcome(climb, outcome))}
            />
            <ProjectToggle project={project} named={named} onToggle={onToggleProject} />
          </div>
        </LabelRow>
      )}
      <div className="climb-card-result climb-card-result--note">
        {named ? (
          <>
            <span style={columnHead}>{t("common.note")}</span>
            <ClimbNoteField
              note={climb.note}
              name={climb.name}
              onChange={(note) => onChange({ ...climb, note })}
            />
          </>
        ) : (
          <span style={{ ...columnHead, gridColumn: "1 / -1" }}>
            {t("logSession.noteNeedsName")}
          </span>
        )}
      </div>
    </div>
  );
}
