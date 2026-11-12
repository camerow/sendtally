import React from "react";
import { t } from "@sendtally/features/i18n";
import { AreaPicker } from "../../areas/components/AreaPicker";
import type { ClimbAreas } from "./AreaClimbNameField";
import { inputStyle } from "../../components/styles";

/** The area a climb was at, which also scopes its name's search of Areas. */
export function ClimbAreaField({
  areas,
  id,
}: {
  areas: ClimbAreas;
  id?: string;
}): React.ReactElement {
  return (
    <AreaPicker
      api={areas.api}
      crags
      id={id}
      value={areas.area}
      near={areas.near}
      placeholder={t("areas.searchAreas")}
      className="log-session-control"
      inputStyle={inputStyle}
      addLabel={(name) => t("areas.addThisArea", { name })}
      onPick={(area) => areas.onArea(area === null ? null : { id: area.id, name: area.name })}
      onAdd={areas.onAddArea}
      onFocus={areas.onLocate}
    />
  );
}
