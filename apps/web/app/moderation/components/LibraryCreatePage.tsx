import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { BuiltInLibrary, SendtallyApi } from "@sendtally/api-client";
import { libraryIdOf, TRANSLATED_LOCALES, type WeightUnit } from "@sendtally/core/hang";
import { MAX_DESCRIPTION } from "@sendtally/core/text";
import { Button } from "@sendtally/design";
import { useWeightUnit } from "@sendtally/features/activities";
import { queries, useQuery } from "@sendtally/features/query";
import { Field } from "../../areas/components/Field";
import { inputStyle } from "../../components/styles";
import { useClientApi } from "../../lib/useClientApi";
import {
  createBody,
  NEW_EXERCISE,
  NEW_WORKOUT,
  type CreateType,
  type TextDraft,
} from "../libraryDraft";
import { AdminFrame } from "./AdminFrame";
import { ExerciseSpecFields } from "./ExerciseSpecFields";
import { LIBRARY_PATH, libraryItemPath } from "./LibraryPage";
import { WorkoutSpecFields } from "./WorkoutSpecFields";

const LANGUAGES = { de: "German", fr: "French", es: "Spanish" } as const;

const messageOf = (error: unknown): string =>
  error instanceof Error && error.message !== "" ? error.message : "Could not create it.";

function Form({
  api,
  type,
  library,
  unit,
}: {
  api: SendtallyApi;
  type: CreateType;
  library: BuiltInLibrary;
  unit: WeightUnit;
}): React.ReactElement {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [text, setText] = React.useState<TextDraft>({ name: "", description: "", names: {} });
  const [exercise, setExercise] = React.useState(NEW_EXERCISE);
  const [workout, setWorkout] = React.useState(NEW_WORKOUT);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const kind = type === "exercise" ? exercise.kind : workout.kind;
  const id = libraryIdOf(type, text.name, kind);
  const taken = [...library.exercises, ...library.workouts].some(
    (e) => e.type === type && e.id === id
  );
  const ready = id !== "" && !taken && (type === "exercise" || workout.items.length > 0);

  const create = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const body = createBody(
        text,
        type === "exercise" ? { type, draft: exercise } : { type, draft: workout }
      );
      const { entry } = await api.createLibraryEntry(type, body);
      await client.invalidateQueries({ queryKey: queries.library(api).queryKey });
      void navigate(libraryItemPath(entry.type, entry.id), { replace: true });
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  };

  return (
    <div className="mod-list mod-lib-fields admin-create">
      <Field id="create-name" label="Name · English">
        <input
          id="create-name"
          value={text.name}
          maxLength={80}
          autoFocus
          onChange={(e) => setText({ ...text, name: e.target.value })}
          style={inputStyle}
        />
        <span className={taken ? "area-error" : "mod-lib-faint"}>
          {id === ""
            ? "The id comes from the name."
            : taken
              ? `The id ${id} is already used by a built-in ${type}. Choose another name.`
              : `Id ${id}. It cannot be changed later.`}
        </span>
      </Field>
      <details className="mod-lib-fold">
        <summary>Other languages</summary>
        {TRANSLATED_LOCALES.map((locale) => (
          <Field key={locale} id={`create-name-${locale}`} label={LANGUAGES[locale]} optional>
            <input
              id={`create-name-${locale}`}
              value={text.names[locale] ?? ""}
              maxLength={80}
              onChange={(e) =>
                setText({ ...text, names: { ...text.names, [locale]: e.target.value } })
              }
              style={inputStyle}
            />
          </Field>
        ))}
      </details>
      <Field id="create-description" label="Description · English" optional>
        <textarea
          id="create-description"
          className="form-notes"
          value={text.description}
          maxLength={MAX_DESCRIPTION}
          onChange={(e) => setText({ ...text, description: e.target.value })}
          style={{ ...inputStyle, minHeight: 120 }}
        />
      </Field>
      {type === "exercise" ? (
        <ExerciseSpecFields
          draft={exercise}
          name={text.name.trim() || "New exercise"}
          unit={unit}
          onChange={setExercise}
        />
      ) : (
        <WorkoutSpecFields draft={workout} library={library} unit={unit} onChange={setWorkout} />
      )}
      {error !== null && (
        <span className="area-error" role="alert">
          {error}
        </span>
      )}
      <div className="admin-create-foot">
        <span className="mod-muted">Live for every user as soon as it is created.</span>
        <Button variant="azure" onClick={() => void create()} disabled={busy || !ready}>
          {`Create ${type}`}
        </Button>
      </div>
    </div>
  );
}

function Loaded({ api, type }: { api: SendtallyApi; type: CreateType }): React.ReactElement {
  const { state: library } = useQuery(queries.library(api));
  const unit = useWeightUnit(api);
  if (library.status === "error")
    return <span className="area-meta">Could not load the library.</span>;
  if (library.status !== "ready" || unit === null)
    return <span className="area-meta">Loading…</span>;
  return <Form key={type} api={api} type={type} library={library.data} unit={unit} />;
}

/** A new built-in exercise or workout, with every field its row needs. */
export function LibraryCreatePage({ apiUrl }: { apiUrl: string }): React.ReactElement {
  const api = useClientApi(apiUrl);
  const [params] = useSearchParams();
  const type: CreateType = params.get("type") === "workout" ? "workout" : "exercise";
  return (
    <AdminFrame
      title={type === "workout" ? "New workout" : "New exercise"}
      back={{ to: LIBRARY_PATH, label: "Library" }}
    >
      <Loaded api={api} type={type} />
    </AdminFrame>
  );
}
