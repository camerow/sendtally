import React from "react";
import { Button } from "@sendtally/design";
import type { QueryState } from "@sendtally/features/query";
import { t } from "@sendtally/features/i18n";

export type LoadStateProps = {
  state: QueryState<unknown>;
  onRetry: () => void;
  /** What failed to load; the training by default. */
  title?: string;
};

/** Loading, or what failed with a way to try again. */
export function LoadState({ state, onRetry, title }: LoadStateProps): React.ReactElement {
  return (
    <div className="load-state" role={state.status === "error" ? "alert" : "status"}>
      {state.status === "error" ? (
        <>
          <strong className="load-state-title">{title ?? t("hang.loadFailed")}</strong>
          <span className="load-state-message">{state.message}</span>
          <Button variant="azure" onClick={onRetry}>
            {t("hang.retry")}
          </Button>
        </>
      ) : (
        <span className="load-state-loading">{t("common.loading")}</span>
      )}
    </div>
  );
}
