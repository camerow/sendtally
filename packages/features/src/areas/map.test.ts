import { describe, expect, it } from "vitest";
import { mapView, mappedAreas, roundedSpot, sameSpot } from "./map";
import type { AreaSummary } from "./types";

describe("area map", () => {
  it("opens on the chosen spot, then the device, then the world", () => {
    expect(mapView({ lat: 37.3, lon: -118.5 }, { lat: 1, lon: 1 })).toEqual({
      lat: 37.3,
      lon: -118.5,
      zoom: 14,
    });
    expect(mapView(null, { lat: 1, lon: 2 })).toEqual({ lat: 1, lon: 2, zoom: 12 });
    expect(mapView(null, null).zoom).toBeLessThan(2);
  });

  it("treats a metre as the same spot and rounds to it", () => {
    expect(sameSpot({ lat: 37.327001, lon: -118.577 }, { lat: 37.327, lon: -118.577 })).toBe(true);
    expect(sameSpot({ lat: 37.3271, lon: -118.577 }, { lat: 37.327, lon: -118.577 })).toBe(false);
    expect(roundedSpot({ lat: 37.3270049, lon: -118.5769951 })).toEqual({
      lat: 37.327,
      lon: -118.577,
    });
  });

  it("draws only crags that have coordinates", () => {
    const area = (id: string, lat: number | null, region: string | null = null): AreaSummary =>
      ({ id, name: id, lat, lon: lat, region_code: region }) as AreaSummary;
    expect(mappedAreas([area("a", 1), area("b", null), area("c", 2, "US")])).toEqual([
      { id: "a", name: "a", lat: 1, lon: 1 },
    ]);
  });
});
