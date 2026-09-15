import React from "react";
import { logCountLabel, type SessionMonth } from "@sendtally/features/sessions";
import { SectionHeading } from "./SectionHeading";
import { LogRowItem } from "./LogRowItem";

export function SessionMonthGroup({ month }: { month: SessionMonth }): React.ReactElement {
  return (
    <section>
      <SectionHeading
        sectionKey={month.key}
        title={month.name}
        year={month.year}
        meta={logCountLabel(month.items)}
      />
      <div className="sessions-rows">
        {month.items.map((item) => (
          <LogRowItem key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
