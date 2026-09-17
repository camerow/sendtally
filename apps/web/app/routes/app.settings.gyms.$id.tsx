import React from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useParams } from "react-router";
import { emptyGymDraft, gymDraftOf, useGyms, type GymDraft } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { requireApi } from "../lib/api.server";
import { cloudflareContext } from "../lib/cloudflare-context";
import { useClientApi } from "../lib/useClientApi";
import { GymEditor } from "../gyms/components/GymEditor";
import logSessionStyles from "../log-session/log-session.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: logSessionStyles }];

export async function loader(args: LoaderFunctionArgs): Promise<{ apiUrl: string }> {
  await requireApi(args);
  return { apiUrl: args.context.get(cloudflareContext).env.API_URL };
}

/** `/app/settings/gyms/new` creates; `/app/settings/gyms/<id>` edits. Both return to settings. */
export default function GymRoute(): React.ReactElement | null {
  const { apiUrl } = useLoaderData<typeof loader>();
  const { id } = useParams();
  const api = useClientApi(apiUrl);
  const gyms = useGyms(api);
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const editing = id !== undefined && id !== "new";
  const existing = editing ? (gyms.gyms.find((g) => g.id === id) ?? null) : null;

  if (editing && !gyms.ready) return null;

  const onSave = (draft: GymDraft): void => {
    setSaving(true);
    setError(null);
    gyms
      .save(draft.id, {
        name: draft.name,
        scale: draft.scale,
        circuits: draft.circuits,
        walls: draft.walls,
      })
      .then(() => navigate("/app/settings"))
      .catch(() => {
        setError(t("gyms.saveFailed"));
        setSaving(false);
      });
  };

  return (
    <GymEditor
      key={existing?.id ?? "new"}
      initial={existing === null ? emptyGymDraft() : gymDraftOf(existing)}
      saving={saving}
      error={error}
      onSave={onSave}
      onDelete={
        existing === null
          ? null
          : () => {
              void gyms.remove(existing.id).then(() => navigate("/app/settings"));
            }
      }
    />
  );
}
