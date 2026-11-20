import React from "react";
import type { Capture } from "@sendtally/features/settings";

/** No client means nothing is sent: a build without a PostHog key, or an E2E run. */
const nothing: Capture = () => undefined;

export const CaptureContext = React.createContext<Capture>(nothing);

/** The app-side PostHog capture, safe to call anywhere: it never throws and sends nothing without a client. */
export function useCapture(): Capture {
  return React.useContext(CaptureContext);
}
