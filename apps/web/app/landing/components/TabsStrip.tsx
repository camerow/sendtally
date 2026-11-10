import React from "react";
import { Label } from "@sendtally/design";
import { useLanding } from "../LandingContext";

export function TabsStrip(): React.ReactElement {
  const { copy } = useLanding();
  return (
    <div className="l-tabs">
      {copy.tabs.map((tab) => (
        <a key={tab.href} href={tab.href} className="l-tab">
          <Label on="accent">{tab.label}</Label>
          <span className="l-tab-title">{tab.title}</span>
        </a>
      ))}
    </div>
  );
}
