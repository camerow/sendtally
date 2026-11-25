import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { alwaysFree, trialPanel, useMembersGet, useMembership } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { MembersGet } from "./MembersGet";

/** The closing screen's offer to a free account: the trial, what stays free, and what members get. */
export function ClosingOffer({
  api,
  onJoin,
}: {
  api: SendtallyApi;
  onJoin: () => void;
}): React.ReactElement | null {
  const view = useMembersGet(api);
  const { state } = useMembership(api);
  if (view === null || state.status !== "ready") return null;
  const trial = trialPanel(state.data);
  return (
    <>
      {trial !== null && (
        <div className="closing-trial">
          <span className="closing-trial-eyebrow">{trial.eyebrow}</span>
          <p className="closing-trial-headline">{trial.headline}</p>
          <p className="closing-trial-note">{trial.note}</p>
        </div>
      )}
      <section className="closing-free">
        <h2 className="members-get-heading">{t("billing.alwaysFree")}</h2>
        <ul className="closing-free-list">
          {alwaysFree().map((line) => (
            <li key={line}>
              <Icon name="check" size={16} strokeWidth={3} />
              {line}
            </li>
          ))}
        </ul>
      </section>
      <MembersGet view={view} onJoin={onJoin} />
    </>
  );
}
