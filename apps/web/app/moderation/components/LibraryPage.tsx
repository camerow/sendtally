import React from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import { Button } from "@sendtally/design";
import { queries, useQuery } from "@sendtally/features/query";
import { useClientApi } from "../../lib/useClientApi";
import { AdminFrame } from "./AdminFrame";
import { LibraryPanel } from "./LibraryPanel";

export const LIBRARY_PATH = "/app/admin/library";

/** The editor on one built-in, as "type:id". */
export const libraryItemPath = (type: string, id: string): string =>
  `${LIBRARY_PATH}?${new URLSearchParams({ item: `${type}:${id}` }).toString()}`;

function Library({ api }: { api: SendtallyApi }): React.ReactElement {
  const { state: library } = useQuery(queries.library(api));
  const [params, setParams] = useSearchParams();
  return (
    <div className="mod-list">
      {library.status === "loading" && <span className="area-meta">Loading…</span>}
      {library.status === "error" && <span className="area-meta">Could not load the library.</span>}
      {library.status === "ready" && (
        <LibraryPanel
          api={api}
          library={library.data}
          item={params.get("item")}
          onOpen={(item) => setParams(item === null ? {} : { item }, { replace: item === null })}
        />
      )}
    </div>
  );
}

/** The built-in library: every exercise and workout, each opening its editor, and New ones. */
export function LibraryPage({ apiUrl }: { apiUrl: string }): React.ReactElement {
  const api = useClientApi(apiUrl);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const create = (type: "exercise" | "workout") => () =>
    void navigate(`${LIBRARY_PATH}/new?type=${type}`);
  return (
    <AdminFrame
      title="Library"
      {...(params.get("item") === null && {
        back: { to: "/app/admin", label: "Admin" },
        actions: (
          <>
            <Button variant="ghostOnLight" onClick={create("exercise")}>
              New exercise
            </Button>
            <Button variant="ghostOnLight" onClick={create("workout")}>
              New workout
            </Button>
          </>
        ),
      })}
    >
      <Library api={api} />
    </AdminFrame>
  );
}
