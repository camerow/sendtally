import React from "react";

/** The session's Target RPE that the screen states itself, so a block head leaves out an equal one. */
export const SessionTargetContext = React.createContext<number | null>(null);

export const useSessionTarget = (): number | null => React.useContext(SessionTargetContext);
