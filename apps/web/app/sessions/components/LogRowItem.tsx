import React from "react";
import { sessionTitle } from "@sendtally/features/sessions";
import type { LogItem } from "@sendtally/features/journal";
import { EntryRowItem } from "./EntryRowItem";
import { SessionRowItem } from "./SessionRowItem";

export function LogRowItem({ item }: { item: LogItem }): React.ReactElement {
  if (item.type === "entry") return <EntryRowItem entry={item.entry} />;
  return <SessionRowItem session={item.session} title={sessionTitle(item.session)} />;
}
