import React from "react";
import { Link } from "react-router";
import type { MembersGet as MembersGetView } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { LoadBars } from "../../first-run/plan/components/LoadBars";
import { YoursTag } from "../../first-run/plan/components/YoursTag";
import { RestPreview } from "../../training/players/RestPreview";
import { panelButton } from "./MembershipPanel";

function SampleWorkout({ view }: { view: MembersGetView }): React.ReactElement {
  const head = (e: MembersGetView["exercises"][number]): React.ReactElement => (
    <span className="members-get-exercise">
      <span className="members-get-exercise-name">
        {e.name}
        {e.yours && <YoursTag />}
      </span>
      <span className="members-get-exercise-work">{e.work}</span>
    </span>
  );
  return (
    <>
      {head(view.exercises[0])}
      <RestPreview seconds={view.restS} />
      {head(view.exercises[1])}
    </>
  );
}

/** What membership opens, as two cards; on the closing screen a scroll-snap row with the support row under it. */
export function MembersGet({
  view,
  closing = false,
}: {
  view: MembersGetView;
  closing?: boolean;
}): React.ReactElement {
  const art = {
    blocks: <LoadBars bars={view.bars} height={44} />,
    workouts: <SampleWorkout view={view} />,
  };
  return (
    <section className={closing ? "members-get members-get--closing" : "members-get"}>
      <div className="members-get-head">
        <h2 className="members-get-heading">{view.heading}</h2>
        <p className="members-get-line">{view.line}</p>
      </div>
      <div
        className="members-get-cards"
        {...(closing ? { role: "region", tabIndex: 0, "aria-label": view.heading } : {})}
      >
        {view.cards.map((card) => (
          <div key={card.key} className="members-get-card">
            <div className={`members-get-art members-get-art--${card.key}`} aria-hidden>
              {art[card.key]}
            </div>
            <div className="members-get-text">
              <h3 className="members-get-title">{card.title}</h3>
              <p className="members-get-body">{card.body}</p>
            </div>
          </div>
        ))}
      </div>
      {closing && (
        <div className="members-get-support">
          <span className="members-get-support-text">
            <b>{t("billing.supportTitle")}</b>
            <span>{t("billing.supportBody")}</span>
          </span>
          <Link
            to="/app/membership?source=onboarding"
            style={{ ...panelButton, height: 44, padding: "0 16px", boxSizing: "border-box" }}
          >
            {t("billing.becomeAMember")}
          </Link>
        </div>
      )}
    </section>
  );
}
