import React from "react";
import { Link } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import { useModerationQueue } from "@sendtally/features/areas";
import { formatNumber } from "@sendtally/features/i18n";
import { libraryGapCount } from "@sendtally/features/library";
import { queries, useQuery } from "@sendtally/features/query";
import { useClientApi } from "../../lib/useClientApi";
import { AdminFrame } from "./AdminFrame";

function Row({
  to,
  title,
  detail,
  count,
}: {
  to: string;
  title: string;
  detail: string;
  count: string | null;
}): React.ReactElement {
  return (
    <Link to={to} className="mod-card admin-row">
      <span className="admin-row-text">
        <span className="mod-title">{title}</span>
        <span className="mod-muted">{detail}</span>
        {count !== null && <span className="mod-lib-faint">{count}</span>}
      </span>
      <span className="admin-row-chevron" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

function Rows({ api }: { api: SendtallyApi }): React.ReactElement {
  const { state: queue } = useModerationQueue(api);
  const { state: library } = useQuery(queries.library(api));
  const waiting =
    queue.status === "ready"
      ? Object.values(queue.data).reduce((sum, q) => sum + q.count, 0)
      : null;
  return (
    <nav className="mod-list" aria-label="Admin">
      <Row
        to="/app/admin/library"
        title="Library"
        detail="Built-in exercises and workouts every user gets"
        count={
          library.status === "ready"
            ? `${formatNumber(libraryGapCount(library.data))} missing text or picture`
            : null
        }
      />
      <Row
        to="/app/admin/areas"
        title="Areas"
        detail="Creations, edits, duplicates and reports"
        count={waiting === null ? null : `${formatNumber(waiting)} waiting`}
      />
    </nav>
  );
}

/** The admin root: one row per admin page, with what waits on it. */
export function AdminHome({ apiUrl }: { apiUrl: string }): React.ReactElement {
  const api = useClientApi(apiUrl);
  return (
    <AdminFrame title="Admin">
      <Rows api={api} />
    </AdminFrame>
  );
}
