import React from "react";
import type { UpNextItem } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";

/** The phases coming after this one: a side badge, the step or Rest, and how long or how many. */
export function UpNext({ items }: { items: readonly UpNextItem[] }): React.ReactElement | null {
  if (items.length === 0) return null;
  return (
    <div className="timer-upnext">
      <span className="timer-label timer-upnext-label">{t("activities.upNext")}</span>
      {items.map((item) => (
        <div
          key={item.index}
          className={item.rest ? "timer-upnext-row timer-upnext-row--rest" : "timer-upnext-row"}
        >
          <span className="timer-upnext-side">{item.side}</span>
          <span className="timer-upnext-name">{item.name}</span>
          <span className="timer-upnext-dose">{item.dose}</span>
        </div>
      ))}
    </div>
  );
}
