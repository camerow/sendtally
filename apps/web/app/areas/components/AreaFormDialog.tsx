import React from "react";
import { useNavigate } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import {
  areaFieldsOf,
  areaFormOf,
  mappedAreas,
  pickedSummary,
  roundedSpot,
  useAreaSearch,
  useDuplicateCheck,
  type Area,
  type AreaFormValues,
  type AreaSummary,
  type PickedArea,
} from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { inputStyle } from "../styles";
import { AreaDialog } from "./AreaDialog";
import { AreaPicker } from "./AreaPicker";
import { Candidates } from "./Candidates";
import { Field } from "./Field";
import { LocationMap } from "./LocationMap";
import { useDraftForm } from "../useDraftForm";

export type AreaFormDialogProps = {
  api: SendtallyApi;
  onClose: () => void;
  /** A suggested edit stays on the page, which says it is waiting for review. */
  onSuggested: () => void;
} & (
  | {
      mode: "create";
      /** Null when adding from the log form, where the dialog asks where the area is. */
      parent: AreaSummary | null;
      /** Where the dialog's own picker starts when `parent` is null, still changeable. */
      initialParent?: PickedArea | null;
      initial?: Partial<AreaFormValues>;
      /** Stays on the caller's screen with the new area instead of opening its page. */
      onCreated?: (area: Area, parent: PickedArea) => void;
    }
  | { mode: "suggest"; area: Area }
);

const EMPTY: AreaFormValues = { name: "", description: "", lat: "", lon: "" };

function failure(error: unknown): string {
  return error instanceof Error && error.message === "no changes"
    ? t("areas.noChanges")
    : t("common.somethingWentWrongTryAgain");
}

export function AreaFormDialog(props: AreaFormDialogProps): React.ReactElement {
  const { api, onClose, onSuggested } = props;
  const navigate = useNavigate();
  const suggest = props.mode === "suggest";
  const [values, setValues, loaded] = useDraftForm(
    { ...EMPTY, ...(props.mode === "create" ? props.initial : {}) },
    props.mode === "suggest"
      ? async () => areaFormOf(props.area, (await api.areaDraft(props.area.id)).draft)
      : null
  );
  const [summary, setSummary] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [chosenParent, setChosenParent] = React.useState<PickedArea | null>(
    props.mode === "create" ? (props.initialParent ?? null) : null
  );
  const parent =
    props.mode !== "create"
      ? null
      : props.parent === null
        ? chosenParent
        : pickedSummary(props.parent);
  const askParent = props.mode === "create" && props.parent === null;
  const needsCoordinates =
    props.mode === "create" ? parent === null || parent.region === true : props.area.lat !== null;
  const typedAt = areaFieldsOf(values);
  const near =
    typeof typedAt?.lat === "number" && typeof typedAt.lon === "number"
      ? { lat: typedAt.lat, lon: typedAt.lon }
      : null;
  const around = mappedAreas(
    useAreaSearch(api, "", near, { crags: true, enabled: near !== null }).filter(
      (a) => props.mode !== "suggest" || a.id !== props.area.id
    )
  );
  const check = useDuplicateCheck<AreaSummary, Area | null>(
    `${values.name.trim().toLowerCase()}|${values.lat}|${values.lon}`
  );

  const set = (field: keyof AreaFormValues) => (e: { target: { value: string } }) =>
    setValues({ ...values, [field]: e.target.value });

  function locate(): void {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        setValues({
          ...values,
          lat: coords.latitude.toFixed(5),
          lon: coords.longitude.toFixed(5),
        });
      },
      () => {
        setLocating(false);
        setError(t("areas.locationFailed"));
      }
    );
  }

  async function submit(): Promise<void> {
    const fields = areaFieldsOf(values);
    if (fields === null) return setError(t("areas.coordinatesInvalid"));
    if (fields.name === "") return setError(t("areas.nameRequired"));
    if (props.mode === "create" && parent === null) return setError(t("areas.pickWhere"));
    if (needsCoordinates && fields.lat === null) return setError(t("areas.coordinatesRequired"));
    setBusy(true);
    setError(null);
    try {
      if (props.mode === "suggest") {
        await api.saveAreaDraft(props.area.id, {
          ...fields,
          changeSummary: summary.trim() || null,
        });
        onSuggested();
        return;
      }
      if (parent === null) return;
      const at =
        fields.lat === null || fields.lon === null ? {} : { lat: fields.lat, lon: fields.lon };
      const created = await check.save({
        similar: async () =>
          (await api.similarAreas({ parentId: parent.id, name: fields.name, ...at })).candidates,
        create: async (confirmedNew) =>
          (await api.createArea({ ...fields, parentId: parent.id, confirmedNew })).area,
      });
      if (created === null) setBusy(false);
      else if (props.onCreated !== undefined) props.onCreated(created, parent);
      else void navigate(`/app/areas/${created.slug}`);
    } catch (e: unknown) {
      setBusy(false);
      setError(failure(e));
    }
  }

  const title =
    props.mode === "create"
      ? parent === null || parent.region === true
        ? t("areas.addACrag")
        : t("areas.addAreaIn", { name: parent.name })
      : t("areas.suggestEditsTo", { name: props.area.name });

  return (
    <AreaDialog
      label={suggest ? t("areas.suggestEdits") : t("areas.newArea")}
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
      <Field id="area-name" label={t("areas.name")}>
        <input
          id="area-name"
          value={values.name}
          autoFocus
          autoComplete="off"
          placeholder={t("areas.areaNamePlaceholder")}
          onChange={set("name")}
          style={inputStyle}
        />
      </Field>
      {askParent && (
        <Field id="area-parent" label={t("areas.whereIsIt")}>
          <AreaPicker
            api={api}
            id="area-parent"
            value={chosenParent}
            near={near}
            placeholder={t("areas.searchRegions")}
            inputStyle={inputStyle}
            onPick={setChosenParent}
          />
        </Field>
      )}
      {check.confirming && (
        <Candidates
          candidates={check.candidates.map((a) => ({
            id: a.id,
            name: a.name,
            to: `/app/areas/${a.slug}`,
            meta: a.status === "pending" ? t("areas.pending") : "",
          }))}
        />
      )}
      <div className="project-dialog-field">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span className="project-dialog-label">
            {t("areas.location")}
            {!needsCoordinates && <span style={{ opacity: 0.6 }}> {t("common.optional")}</span>}
          </span>
          <button
            type="button"
            className="project-dialog-change"
            disabled={locating}
            onClick={locate}
          >
            {locating ? t("areas.locating") : t("areas.useMyLocation")}
          </button>
        </div>
        <div className="area-form-row">
          <input
            aria-label={t("areas.latitude")}
            value={values.lat}
            inputMode="decimal"
            placeholder={t("areas.latitude")}
            onChange={set("lat")}
            style={inputStyle}
          />
          <input
            aria-label={t("areas.longitude")}
            value={values.lon}
            inputMode="decimal"
            placeholder={t("areas.longitude")}
            onChange={set("lon")}
            style={inputStyle}
          />
        </div>
        <LocationMap
          value={near}
          near={parent?.at ?? null}
          around={around}
          onMove={(at) => {
            const spot = roundedSpot(at);
            setValues({ ...values, lat: String(spot.lat), lon: String(spot.lon) });
          }}
        />
        <span className="area-form-hint">{t("areas.mapHint")}</span>
      </div>
      <Field id="area-description" label={t("areas.description")} optional>
        <textarea
          id="area-description"
          value={values.description}
          placeholder={t("areas.areaDescriptionPlaceholder")}
          onChange={set("description")}
          className="area-textarea"
          style={inputStyle}
        />
      </Field>
      {suggest && (
        <Field id="area-summary" label={t("areas.changeSummary")} optional>
          <input
            id="area-summary"
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
