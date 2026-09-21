import React from "react";
import type { LatLon } from "@sendtally/features/areas";

/** Asks for the device location once, on the first request; a refusal just leaves it unknown. */
export function useDeviceLocation(): [LatLon | null, () => void] {
  const [near, setNear] = React.useState<LatLon | null>(null);
  const asked = React.useRef(false);
  const request = React.useCallback((): void => {
    if (asked.current || typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    asked.current = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setNear({
          lat: Number(coords.latitude.toFixed(5)),
          lon: Number(coords.longitude.toFixed(5)),
        }),
      () => undefined
    );
  }, []);
  return [near, request];
}
