import React from "react";
import { logCountLabel, sessionTitle } from "@sendtally/features/sessions";
import type { LogItem } from "@sendtally/features/journal";
import { EntryRowItem } from "./EntryRowItem";
import { SessionRowItem } from "./SessionRowItem";

export function LogRowItem({ item }: { item: LogItem }): React.ReactElement {
  if (item.type === "session") {
    return <SessionRowItem session={item.session} title={sessionTitle(item.session)} />;
  }
  if (item.inside.length === 0) return <EntryRowItem entry={item.entry} />;
  return (
    <div className="log-trip">
      <EntryRowItem entry={item.entry} detail={logCountLabel(item.inside)} heading />
      {item.inside.map((inner) => (
        <LogRowItem key={inner.key} item={inner} />
      ))}
    </div>
  );
}
