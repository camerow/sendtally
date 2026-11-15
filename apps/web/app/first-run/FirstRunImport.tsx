import React from "react";
import { Link } from "react-router";
import type { SendtallyApi } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import type { ImportSource } from "@sendtally/features/import";
import { ImportFlow } from "../import/components/ImportFlow";
import { FirstRunTop } from "./FirstRunTop";

/** The import page as first run opens it: in first run's frame, with Skip for now to its days. */
export function FirstRunImport({
  api,
  from,
}: {
  api: SendtallyApi;
  from: ImportSource | undefined;
}): React.ReactElement {
  return (
    <div className="first-run">
      <FirstRunTop>
        <Link to="/app/start?later=1" className="first-run-link">
          {t("import.skipForNow")}
        </Link>
      </FirstRunTop>
      <main className="first-run-body first-run-body--wide">
        <ImportFlow api={api} then="/app/start" from={from} />
      </main>
    </div>
  );
}
