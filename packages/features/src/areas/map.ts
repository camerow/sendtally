import type { LatLon } from "./useLogFormAreas";
import type { AreaSummary } from "./types";

/** Vector tiles with no key and no account, the same on web and mobile. */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export type MapView = LatLon & { zoom: number };

const WORLD: MapView = { lat: 20, lon: 0, zoom: 1.2 };

/** Close on a spot already chosen, a town's width around the device, the whole world otherwise. */
export function mapView(value: LatLon | null, near: LatLon | null): MapView {
  if (value !== null) return { ...value, zoom: 14 };
  if (near !== null) return { ...near, zoom: 12 };
  return WORLD;
}

/** Five decimal places is about a metre, which is what the form keeps. */
export function sameSpot(a: LatLon, b: LatLon): boolean {
  return Math.abs(a.lat - b.lat) < 1e-5 && Math.abs(a.lon - b.lon) < 1e-5;
}

export function roundedSpot(at: LatLon): LatLon {
  return { lat: Number(at.lat.toFixed(5)), lon: Number(at.lon.toFixed(5)) };
}

/** Areas that can be drawn on the map: the ones with coordinates, regions left out. */
export function mappedAreas(found: AreaSummary[]): Array<LatLon & { id: string; name: string }> {
  return found.flatMap((a) =>
    a.lat === null || a.lon === null || a.region_code !== null
      ? []
      : [{ id: a.id, name: a.name, lat: a.lat, lon: a.lon }]
  );
}
