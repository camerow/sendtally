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
  art?: { background: string; content: React.ReactNode };
};

/** One card per thing not set up yet. Any new step is one more entry in the list. Link components/setup-stack.css. */
export function SetupStack({
  cards,
  total,
}: {
  cards: SetupCard[];
  total: number;
}): React.ReactElement | null {
  if (cards.length === 0) return null;
  return (
    <div className="setup-stack">
      <span className="setup-eyebrow">
        {t("gyms.setupProgress", { done: total - cards.length, total })}
      </span>
      <div key={cards.map((c) => c.key).join()} className="setup-track">
        {cards.map((card) => (
          <div key={card.key} className="setup">
            {card.art !== undefined && (
              <div
                className="setup-art"
                aria-hidden="true"
                inert
                style={{ background: card.art.background }}
              >
                {card.art.content}
              </div>
            )}
            <div className="setup-main">
              <span className="setup-text">
                <span className="setup-eyebrow">{card.eyebrow}</span>
                <span className="setup-title">{card.title}</span>
                <span className="setup-body">{card.body}</span>
              </span>
              <span className="setup-actions">
                <Link to={card.to} className="setup-connect">
                  {card.action}
                </Link>
                <button type="button" onClick={card.onDismiss} className="setup-later">
                  {t("sessions.notNow")}
                </button>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
