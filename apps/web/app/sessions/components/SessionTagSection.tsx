import React from "react";
import { logTotalsLabel, type SessionTagGroup } from "@sendtally/features/sessions";
import type { LogItem } from "@sendtally/features/journal";
import { SectionHeading } from "./SectionHeading";
import { LogRowItem } from "./LogRowItem";
import { useDisplayScales } from "@sendtally/features/settings";

export function SessionTagSection({
  group,
}: {
  group: SessionTagGroup<LogItem>;
}): React.ReactElement {
  const scales = useDisplayScales();
  return (
    <section>
      <SectionHeading
        sectionKey={group.key}
        title={group.label}
        year={null}
        meta={logTotalsLabel(group.items, scales)}
        top
      />
      <div className="sessions-rows">
        {group.items.map((item) => (
          <LogRowItem key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
