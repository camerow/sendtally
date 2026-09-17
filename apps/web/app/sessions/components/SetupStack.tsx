import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";

export type SetupCard = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  to: string;
  onDismiss: () => void;
};

/** One card per thing not set up yet, gym first. Any new step is one more entry in the list. */
export function SetupStack({
  cards,
  total,
}: {
  cards: SetupCard[];
  total: number;
}): React.ReactElement | null {
  if (cards.length === 0) return null;
  return (
    <div className="sessions-setup-stack">
      <span className="sessions-setup-eyebrow">
        {t("gyms.setupProgress", { done: total - cards.length, total })}
      </span>
      {cards.map((card) => (
        <div key={card.key} className="sessions-setup">
          <span className="sessions-setup-text">
            <span className="sessions-setup-eyebrow">{card.eyebrow}</span>
            <span className="sessions-setup-title">{card.title}</span>
            <span className="sessions-setup-body">{card.body}</span>
          </span>
          <span className="sessions-setup-actions">
            <Link to={card.to} className="sessions-setup-connect">
              {card.action}
            </Link>
            <button type="button" onClick={card.onDismiss} className="sessions-setup-later">
              {t("sessions.notNow")}
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}
