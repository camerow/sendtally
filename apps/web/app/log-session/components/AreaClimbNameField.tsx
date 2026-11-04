import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { useAreaClimbSearch, type AreaClimb, type LatLon } from "@sendtally/features/areas";
import type { ClimbArea } from "@sendtally/features/log-session";
import { ClimbNameField, type ClimbNameFieldProps } from "./ClimbNameField";

/** A climb's area, which scopes its search of Areas climbs, and what picking or adding does. */
export type ClimbAreas = {
  api: SendtallyApi;
  /** Whether the climb can have an area: every climb outdoors, a named one indoors. */
  pickable: boolean;
  area: ClimbArea | null;
  near: LatLon | null;
  onArea: (area: ClimbArea | null) => void;
  /** Starts a new area from the typed name. */
  onAddArea: (typed: string) => void;
  onLocate: () => void;
  onPickArea: (climb: AreaClimb) => void;
  onAdd: () => void;
};

/** The climb name field: the user's own history, alongside Areas when the climb can have an area. */
export function AreaClimbNameField({
  areas,
  linkedId,
  ...props
}: Omit<ClimbNameFieldProps, "found" | "onPickArea" | "onAdd" | "onFocus"> & {
  areas: ClimbAreas;
}): React.ReactElement {
  const [focused, setFocused] = React.useState(false);
  const search = useAreaClimbSearch(
    areas.api,
    props.value,
    areas.area?.id ?? null,
    focused && areas.pickable
  );
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
