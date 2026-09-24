import React from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL, mapView, sameSpot, type LatLon } from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";

export type LocationMapProps = {
  /** The coordinates the form holds; the map follows them when they change from outside. */
  value: LatLon | null;
  /** Where to open when there is no value yet: the device, or nothing for the whole world. */
  near: LatLon | null;
  /** Areas already in Areas around the pin, drawn so a duplicate shows before saving. */
  around: Array<LatLon & { id: string; name: string }>;
  onMove: (at: LatLon) => void;
};

const PIN = (
  <svg width="28" height="36" viewBox="0 0 28 36" aria-hidden="true">
    <path d="M14 35S3 21 3 13a11 11 0 0 1 22 0c0 8-11 22-11 22z" fill="var(--bs-watermelon-ink)" />
    <circle cx="14" cy="13" r="4.5" fill="var(--bs-white)" />
  </svg>
);

function aroundMarker(name: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "location-map-around";
  el.textContent = name;
  return el;
}

/**
 * A map with the pin fixed at its centre: dragging the map moves what is under the pin. Only a
 * drag reports a position, so opening the map never fills in coordinates nobody chose.
 */
export function LocationMap({ value, near, around, onMove }: LocationMapProps): React.ReactElement {
  const container = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<MapLibreMap | null>(null);
  const markers = React.useRef<Marker[]>([]);
  const [ready, setReady] = React.useState(false);
  const moved = React.useEffectEvent(onMove);
  const [opening] = React.useState(() => mapView(value, near));
  const aroundKey = around.map((a) => a.id).join(",");
  const draw = React.useEffectEvent((current: MapLibreMap, MapMarker: typeof Marker): void => {
    markers.current.forEach((m) => m.remove());
    markers.current = around.map((a) =>
      new MapMarker({ element: aroundMarker(a.name), anchor: "left" })
        .setLngLat([a.lon, a.lat])
        .addTo(current)
    );
  });

  React.useEffect(() => {
    let cancelled = false;
    void Promise.all([
      import("maplibre-gl"),
      import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
    ]).then(([{ Map: MapLibre, setWorkerUrl }, worker]) => {
      if (cancelled || container.current === null) return;
      setWorkerUrl(worker.default);
      const created = new MapLibre({
        container: container.current,
        style: MAP_STYLE_URL,
        center: [opening.lon, opening.lat],
        zoom: opening.zoom,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
      created.touchZoomRotate.disableRotation();
      created.on("moveend", (e) => {
        if (e.originalEvent === undefined) return;
        const { lat, lng } = created.getCenter();
        moved({ lat, lon: lng });
      });
      created.on("load", () => setReady(true));
      map.current = created;
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [opening]);

  React.useEffect(() => {
    const current = map.current;
    if (current === null || value === null) return;
    const { lat, lng } = current.getCenter();
    if (sameSpot({ lat, lon: lng }, value)) return;
    current.jumpTo({ center: [value.lon, value.lat], zoom: Math.max(current.getZoom(), 13) });
  }, [value, ready]);

  React.useEffect(() => {
    const current = map.current;
    if (current === null) return;
    let cancelled = false;
    void import("maplibre-gl").then(({ Marker: MapMarker }) => {
      if (!cancelled) draw(current, MapMarker);
    });
    return () => {
      cancelled = true;
    };
  }, [aroundKey, ready]);

  return (
    <div className="location-map">
      <div
        ref={container}
        className="location-map-canvas"
        role="application"
        aria-label={t("areas.mapLabel")}
      />
      <div className="location-map-pin">{PIN}</div>
    </div>
  );
}
