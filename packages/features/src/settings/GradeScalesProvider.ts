import React from "react";
import type { GradeScales, SendtallyApi } from "@sendtally/api-client";
import { DEFAULT_GRADE_SCALES } from "./transforms";
import { useGradeScalePrefs } from "./useGradeScales";

const GradeScalesContext = React.createContext<GradeScales>(DEFAULT_GRADE_SCALES);

/** Puts the climber's grade scales in reach of every row that shows a grade. */
export function GradeScalesProvider({
  api,
  children,
}: {
  api: SendtallyApi;
  children: React.ReactNode;
}): React.ReactElement {
  const { scales } = useGradeScalePrefs(api);
  return React.createElement(GradeScalesContext.Provider, { value: scales }, children);
}

/** The scales grades are shown in: what the climber picked in settings. */
export function useDisplayScales(): GradeScales {
  return React.useContext(GradeScalesContext);
}
