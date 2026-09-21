import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useAreaClimbSearch, type AreaClimb } from "@sendtally/features/areas";
import { ClimbNameField, type ClimbNameFieldProps } from "./ClimbNameField";

/** Where an outdoor row looks for Areas climbs, and what picking or adding one does. */
export type ClimbAreas = {
  api: SendtallyApi;
  areaId: string | null;
  onPickArea: (climb: AreaClimb) => void;
  onAdd: () => void;
};

/** The climb name field for an outdoor session: the user's own history alongside Areas. */
export function AreaClimbNameField({
  areas,
  linkedId,
  ...props
}: Omit<ClimbNameFieldProps, "found" | "onPickArea" | "onAdd" | "onFocus"> & {
  areas: ClimbAreas;
}): React.ReactElement {
  const [focused, setFocused] = React.useState(false);
  const search = useAreaClimbSearch(areas.api, props.value, areas.areaId, focused);
  return (
    <ClimbNameField
      {...props}
      linkedId={linkedId}
      found={search.found}
      onPickArea={areas.onPickArea}
      onAdd={search.canAdd ? areas.onAdd : undefined}
      onFocus={() => setFocused(true)}
    />
  );
}
