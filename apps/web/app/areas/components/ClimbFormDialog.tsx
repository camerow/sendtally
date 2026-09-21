import React from "react";
import { useNavigate } from "react-router";
import type { GradeScales, SendtallyApi } from "@sendtally/api-client";
import {
  CLIMB_TYPES,
  areaClimbGradeLabel,
  climbFieldsOf,
  climbFormOf,
  climbTypeLabel,
  emptyClimbForm,
  useDuplicateCheck,
  withType,
  type AreaClimb,
  type AreaSummary,
  type ClimbFormValues,
} from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { gradeOptions, scaleLabel, scaleOptionsFor } from "@sendtally/features/log-session";
import { queries, useQuery } from "@sendtally/features/query";
import { chipStyle } from "../../components/chip";
import { inputStyle } from "../styles";
import { useDraftForm } from "../useDraftForm";
import { useDeviceLocation } from "../useDeviceLocation";
import { AreaDialog } from "./AreaDialog";
import { AreaPicker } from "./AreaPicker";
import { Candidates } from "./Candidates";
import { Field } from "./Field";

export type ClimbFormDialogProps = {
  api: SendtallyApi;
  onClose: () => void;
  onSuggested: () => void;
} & (
  | {
      mode: "create";
      /** Null when adding from a log form with no crag picked yet; the dialog asks for one. */
      area: AreaSummary | { id: string; name: string } | null;
      initial?: ClimbFormValues;
      /** Stays on the caller's screen with the new climb instead of opening its page. */
      onCreated?: (climb: AreaClimb, area: AreaSummary | { id: string; name: string }) => void;
    }
  | { mode: "suggest"; climb: AreaClimb }
);

const DEFAULT_SCALES: GradeScales = { boulder: "v", route: "yds" };

const chip = (active: boolean): React.CSSProperties =>
  chipStyle(active, { minHeight: 36, padding: "0 14px" });

function failure(error: unknown): string {
  return error instanceof Error && error.message === "no changes"
    ? t("areas.noChanges")
    : t("common.somethingWentWrongTryAgain");
}

export function ClimbFormDialog(props: ClimbFormDialogProps): React.ReactElement {
  const { api, onClose, onSuggested } = props;
  const navigate = useNavigate();
  const suggest = props.mode === "suggest";
  const { state: status } = useQuery(queries.status(api));
  const scales = status.status === "ready" ? status.data.gradeScales : DEFAULT_SCALES;
  const [values, setValues, loaded] = useDraftForm(
    props.mode === "suggest" ? climbFormOf(props.climb) : (props.initial ?? emptyClimbForm(scales)),
    props.mode === "suggest"
      ? async () => climbFormOf(props.climb, (await api.areaClimbDraft(props.climb.id)).draft)
      : null
  );
  const [summary, setSummary] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [chosenArea, setChosenArea] = React.useState<AreaSummary | null>(null);
  const [near, locate] = useDeviceLocation();
  const area = props.mode === "create" ? (props.area ?? chosenArea) : null;
  const askArea = props.mode === "create" && props.area === null;
  const check = useDuplicateCheck<AreaClimb, AreaClimb | null>(
    `${values.name.trim().toLowerCase()}|${area?.id ?? ""}`
  );

  const set =
    (field: keyof ClimbFormValues) =>
    (e: { target: { value: string } }): void =>
      setValues({ ...values, [field]: e.target.value });
  const route = values.type !== "boulder";
  const scaleChoices = scaleOptionsFor(route ? "route" : "boulder");

  async function submit(): Promise<void> {
    const fields = climbFieldsOf(values);
    if (fields.name === "") return setError(t("areas.nameRequired"));
    setBusy(true);
    setError(null);
    try {
      if (props.mode === "suggest") {
        await api.saveAreaClimbDraft(props.climb.id, {
          ...fields,
          changeSummary: summary.trim() || null,
        });
        onSuggested();
        return;
      }
      if (area === null) {
        setBusy(false);
        return setError(t("areas.pickCrag"));
      }
      const areaId = area.id;
      const created = await check.save({
        similar: async () => (await api.similarAreaClimbs(areaId, fields.name)).candidates,
        create: async (confirmedNew) =>
          (await api.createAreaClimb({ ...fields, areaId, confirmedNew })).climb,
      });
      if (created === null) setBusy(false);
      else if (props.onCreated !== undefined) props.onCreated(created, area);
      else void navigate(`/app/climbs/${created.slug}`);
    } catch (e: unknown) {
      setBusy(false);
      setError(failure(e));
    }
  }

  const title =
    props.mode === "create"
      ? area === null || askArea
        ? t("areas.addAClimb")
        : t("areas.addClimbIn", { name: area.name })
      : t("areas.suggestEditsTo", { name: props.climb.name });

  return (
    <AreaDialog
      label={suggest ? t("areas.suggestEdits") : t("areas.newClimb")}
      title={title}
      submitLabel={
        check.confirming
          ? t("areas.yesItsNew")
          : suggest
            ? t("areas.sendSuggestion")
            : t("common.save")
      }
      busy={busy || !loaded}
      error={error}
      licence
      onClose={onClose}
      onSubmit={() => void submit()}
    >
      <Field id="climb-name" label={t("areas.name")}>
        <input
          id="climb-name"
          value={values.name}
          autoFocus
          autoComplete="off"
          placeholder={t("areas.climbNamePlaceholder")}
          onChange={set("name")}
          style={inputStyle}
        />
      </Field>
      {askArea && (
        <Field id="climb-area" label={t("areas.crag")}>
          <AreaPicker
            api={api}
            id="climb-area"
            crags
            value={chosenArea}
            near={near}
            placeholder={t("areas.searchCrags")}
            inputStyle={inputStyle}
            onPick={setChosenArea}
            onFocus={locate}
          />
        </Field>
      )}
      {check.confirming && (
        <Candidates
          candidates={check.candidates.map((c) => ({
            id: c.id,
            name: c.name,
            to: `/app/climbs/${c.slug}`,
            meta: areaClimbGradeLabel(c),
          }))}
        />
      )}
      <Field label={t("areas.type")}>
        <div className="area-chips" role="radiogroup" aria-label={t("areas.type")}>
          {CLIMB_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={values.type === type}
              style={chip(values.type === type)}
              onClick={() => setValues(withType(values, type, scales))}
            >
              {climbTypeLabel(type)}
            </button>
          ))}
        </div>
      </Field>
      <div className="area-form-row">
        <Field id="climb-grade" label={t("areas.grade")} optional>
          <select id="climb-grade" value={values.grade} onChange={set("grade")} style={inputStyle}>
            <option value="">{t("areas.gradeUnknown")}</option>
            {gradeOptions(values.gradeScale).map((grade) => (
              <option key={grade} value={grade}>
                {areaClimbGradeLabel({ grade_value: grade })}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("areas.gradeScale")}>
          <div className="area-chips" role="radiogroup" aria-label={t("areas.gradeScale")}>
            {scaleChoices.map((scale) => (
              <button
                key={scale}
                type="button"
                role="radio"
                aria-checked={values.gradeScale === scale}
                style={chip(values.gradeScale === scale)}
                onClick={() => setValues({ ...values, gradeScale: scale, grade: "" })}
              >
                {scaleLabel(scale)}
              </button>
            ))}
          </div>
        </Field>
      </div>
      {route && (
        <div className="area-form-row">
          <Field id="climb-length" label={t("areas.lengthMetres")} optional>
            <input
              id="climb-length"
              value={values.lengthM}
              inputMode="numeric"
              onChange={set("lengthM")}
              style={inputStyle}
            />
          </Field>
          {values.type === "sport" && (
            <Field id="climb-bolts" label={t("areas.bolts")} optional>
              <input
                id="climb-bolts"
                value={values.bolts}
                inputMode="numeric"
                onChange={set("bolts")}
                style={inputStyle}
              />
            </Field>
          )}
        </div>
      )}
      <Field id="climb-fa" label={t("areas.firstAscent")} optional>
        <input
          id="climb-fa"
          value={values.firstAscent}
          placeholder={t("areas.firstAscentPlaceholder")}
          onChange={set("firstAscent")}
          style={inputStyle}
        />
      </Field>
      <Field id="climb-description" label={t("areas.description")} optional>
        <textarea
          id="climb-description"
          value={values.description}
          placeholder={t("areas.climbDescriptionPlaceholder")}
          onChange={set("description")}
          className="area-textarea"
          style={inputStyle}
        />
      </Field>
      {suggest && (
        <Field id="climb-summary" label={t("areas.changeSummary")} optional>
          <input
            id="climb-summary"
            value={summary}
            placeholder={t("areas.changeSummaryPlaceholder")}
            onChange={(e) => setSummary(e.target.value)}
            style={inputStyle}
          />
        </Field>
      )}
    </AreaDialog>
  );
}
