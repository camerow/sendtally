import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  useAreaClimbSearch,
  useAreaSearch,
  withAreaClimb,
  withTypedName,
} from "@sendtally/features/areas";
import {
  areaChoice,
  climbChange,
  climbSuggestions,
  climbTitle,
  isNewClimb,
  knownOf,
  placeOf,
  typicalGradeIndex,
  useClimbs,
} from "@sendtally/features/climbs";
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
import { useGradeScalePrefs } from "@sendtally/features/settings";
import { GradeChips } from "../../components/GradeChips";
import { Segmented } from "../../components/Segmented";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../../lib/useGoBack";
import { SentResultControl } from "../../log-session/components/SentResultControl";
import { SuggestField } from "./SuggestField";

type Area = { id: string; name: string };

/**
 * One page for a climb: its name and area autocomplete, and anything not found is created.
 * It saves into that day's session at the area, or starts one there. With `climbId` it logs that
 * climb again, and with `edit` it edits the climb itself: its name and grade everywhere it was
 * logged, and its crag on the climb.
 */
export function AddClimb(): React.ReactElement {
  const api = useAppApi();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const climbId = params.get("climbId") ?? undefined;
  const editing = params.get("edit") === "1" && climbId !== undefined;
  const logging = climbId !== undefined && !editing;
  const goBack = useGoBack(climbId === undefined ? "/app" : `/app/log/climbs/${climbId}`);
  const { state } = useClimbs(api);
  const { scales } = useGradeScalePrefs(api);
  const mine = state.status === "ready" ? state.data.climbs : [];
  const [climb, setClimb] = React.useState<ClimbDraft>(() => ({
    ...newClimb("climb-1", scales.boulder),
    grade: "",
  }));
  const [touched, setProject] = React.useState<boolean | null>(null);
  const project =
    touched ?? (editing ? (mine.find((c) => c.id === climbId)?.project ?? false) : true);
  const [date, setDate] = React.useState(() => localDate(new Date()));
  const [areaText, setAreaText] = React.useState("");
  const [area, setArea] = React.useState<Area | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const areaClimbs = useAreaClimbSearch(api, climb.name, area?.id ?? null, true).found;
  const areas = useAreaSearch(api, area === null ? areaText : "", null, {
    crags: true,
    enabled: area === null,
  });
  const choice = areaChoice(areaText, area, areas);
  const suggestions = climbSuggestions(climb.name, mine, areaClimbs, area?.name ?? null);

  const pickMine = (c: ClimbSummary): void => {
    const picked = withPickedClimb({ ...climb, scale: c.grade?.scale ?? scales[c.discipline] }, c);
    setClimb(c.area_climb_id === null ? picked : { ...picked, climbId: c.area_climb_id });
    if (area === null && c.area !== null) {
      setArea(c.area);
      setAreaText(c.area.name);
    }
  };

  const [preset, setPreset] = React.useState(false);
  if (!preset && state.status !== "loading") {
    setPreset(true);
    const known = mine.find((c) => c.id === climbId);
    if (known !== undefined) pickMine(known);
  }

  const existing = mine.find((c) => c.id === climbId);
  const title = editing
    ? t("climbs.editClimb")
    : existing === undefined
      ? t("climbs.addClimb")
      : climbTitle(existing, scales);
  const discipline = disciplineOf(climb.scale);
  const ladder = gradeOptions(climb.scale);
  const at = ladder.indexOf(climb.grade);
  const valid = climb.name.trim() !== "" && draftGrade(climb.grade, climb.scale) !== undefined;
  const sent = climb.kind === "send";

  const fail = (): void => {
    setSaving(false);
    setFailed(true);
  };

  const saveEdit = (id: string): void => {
    placeOf(api, choice)
      .then((place) => api.updateClimb(id, climbChange(existing, climb, place, touched)))
      .then(({ id: next }) => {
        if (next === id) goBack();
        else void navigate(`/app/log/climbs/${encodeURIComponent(next)}`, { replace: true });
      }, fail);
  };

  const submit = (): void => {
    if (!valid || saving) return;
    setSaving(true);
    setFailed(false);
    if (editing) return saveEdit(climbId);
    const { key: _key, ...draft } = climb;
    placeOf(api, choice)
      .then((place) =>
        logClimbOnDay(
          api,
          { ...draft, name: draft.name.trim(), project: sent || logging ? undefined : project },
          date,
          [],
          { area: place }
        )
      )
      .then(goBack, fail);
  };

  const projectRow = (
    <label className="add-climb-row">
      <span className="add-climb-row-text">
        {t("common.project")}
        {!editing && <span className="add-climb-row-hint">{t("climbs.projectHint")}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="climb-switch"
        checked={project}
        onChange={(e) => setProject(e.target.checked)}
      />
    </label>
  );

  const dateRow = (
    <label className="add-climb-row">
      <span className="add-climb-row-text">{t("logSession.date")}</span>
      <input
        type="date"
        className="field-input add-climb-date"
        value={date}
        max={localDate(new Date())}
        onChange={(e) => setDate(e.target.value)}
      />
    </label>
  );

  return (
    <div className="detail">
      <div className="editor-bar">
        <button type="button" className="editor-cancel" onClick={goBack}>
          {t("common.cancel")}
        </button>
        <h1 className="editor-title">{title}</h1>
      </div>
      <div className="detail-body add-climb-body">
        {failed && <span className="add-climb-error">{t("climbs.saveFailed")}</span>}
        {!logging && (
          <>
            <SuggestField
              label={t("climbs.climb")}
              value={climb.name}
              placeholder={t("climbs.namePlaceholder")}
              suggestions={suggestions}
              isNew={isNewClimb(climb.name, mine, areaClimbs)}
              onChangeText={(name) => setClimb(withTypedName(climb, name))}
              onPick={(key) => {
                const s = suggestions.find((x) => x.key === key);
                if (s?.kind === "areas") setClimb(withAreaClimb(climb, s.climb));
                if (s?.kind === "mine") pickMine(s.climb);
              }}
            />
            <SuggestField
              label={t("areas.area")}
              value={areaText}
              placeholder={t("areas.searchAreas")}
              suggestions={areas.map((a) => ({ key: a.id, name: a.name, meta: "" }))}
              isNew={choice?.kind === "new"}
              hint={choice?.kind === "new" ? t("climbs.newArea") : null}
              onChangeText={(text) => {
                setAreaText(text);
                setArea(null);
                if (editing) setClimb(({ climbId: _link, ...rest }) => rest);
              }}
              onPick={(id) => {
                const picked = areas.find((a) => a.id === id);
                if (picked === undefined) return;
                setArea({ id: picked.id, name: picked.name });
                setAreaText(picked.name);
              }}
            />
            <div className="field">
              <div className="add-climb-grade-head">
                <span className="field-label">{t("common.grade")}</span>
                <Segmented
                  label={t("climbs.discipline")}
                  options={(["boulder", "route"] as const).map((d) => ({
                    value: d,
                    label: disciplineLabel(d),
                  }))}
                  value={discipline}
                  onChange={(d) => setClimb(withClimbDiscipline(climb, d, scales))}
                />
              </div>
              <div className="add-climb-grade-chips">
                <GradeChips
                  label={t("common.grade")}
                  chips={ladder.map((g) => ({ key: g, label: g }))}
                  active={at < 0 ? null : climb.grade}
                  startIndex={at < 0 ? typicalGradeIndex(mine, climb.scale) : at}
                  onPick={(grade) => setClimb({ ...climb, grade })}
                />
              </div>
            </div>
            {editing && projectRow}
          </>
        )}
        {logging && dateRow}
        {!editing && (
          <>
            <SentResultControl climb={climb} summary={knownOf(mine, climb)} onChange={setClimb} />
            {!sent && !logging && projectRow}
            {!logging && dateRow}
            <label className="field">
              <span className="field-label">{t("common.notes")}</span>
              <textarea
                className="field-input field-input--area"
                value={climb.note}
                rows={3}
                placeholder={t("climbs.notesPlaceholder")}
                onChange={(e) => setClimb({ ...climb, note: e.target.value })}
              />
            </label>
          </>
        )}
      </div>
      <div className="detail-footer">
        <button
          type="button"
          className="detail-primary"
          disabled={!valid || saving}
          onClick={submit}
        >
          {saving ? t("common.saving") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
