import { describe, expect, it } from "vitest";
import {
  findNearestValidOffice,
  getDistanceInMeters,
  isGpsAccuracyAllowed,
  isValidGeofence,
  isValidGpsCoordinate,
  type OfficeGeofence,
} from "@/lib/geo";

const offices: OfficeGeofence[] = [
  {
    id: "office-far",
    name: "Far Office",
    latitude: -6.2005,
    longitude: 106.8169,
    radius_meters: 30,
  },
  {
    id: "office-near",
    name: "Near Office",
    latitude: -6.2,
    longitude: 106.8167,
    radius_meters: 100,
  },
];

describe("geo helpers", () => {
  it("calculates the same point as zero meters", () => {
    expect(
      getDistanceInMeters(
        { lat: -6.2, lng: 106.8167 },
        { lat: -6.2, lng: 106.8167 },
      ),
    ).toBe(0);
  });

  it("finds the nearest office inside its geofence", () => {
    const match = findNearestValidOffice(
      { lat: -6.20001, lng: 106.81671 },
      offices,
    );

    expect(match?.office.id).toBe("office-near");
    expect(match?.isWithinRadius).toBe(true);
    expect(match?.distance).toBeLessThan(5);
  });

  it("rejects locations outside all geofences", () => {
    expect(
      findNearestValidOffice({ lat: -6.23, lng: 106.85 }, offices),
    ).toBeNull();
  });

  it("rejects impossible user coordinates before matching geofences", () => {
    expect(findNearestValidOffice({ lat: 120, lng: 106.85 }, offices)).toBeNull();
    expect(
      findNearestValidOffice({ lat: -6.2, lng: Number.NaN }, offices),
    ).toBeNull();
  });

  it("ignores offices with invalid coordinates or radius", () => {
    expect(
      findNearestValidOffice({ lat: -6.2, lng: 106.8167 }, [
        {
          id: "bad-radius",
          name: "Bad Radius",
          latitude: -6.2,
          longitude: 106.8167,
          radius_meters: 0,
        },
        {
          id: "bad-coordinate",
          name: "Bad Coordinate",
          latitude: -91,
          longitude: 106.8167,
          radius_meters: 100,
        },
      ]),
    ).toBeNull();
  });

  it("validates GPS coordinate ranges", () => {
    expect(isValidGpsCoordinate({ lat: -6.2, lng: 106.8167 })).toBe(true);
    expect(isValidGpsCoordinate({ lat: -90, lng: -180 })).toBe(true);
    expect(isValidGpsCoordinate({ lat: 90, lng: 180 })).toBe(true);
    expect(isValidGpsCoordinate({ lat: -90.1, lng: 106.8167 })).toBe(false);
    expect(isValidGpsCoordinate({ lat: -6.2, lng: 180.1 })).toBe(false);
  });

  it("validates geofence master data", () => {
    expect(isValidGeofence(offices[0])).toBe(true);
    expect(isValidGeofence({ ...offices[0], radius_meters: -1 })).toBe(false);
    expect(isValidGeofence({ ...offices[0], latitude: Number.NaN })).toBe(false);
  });

  it("accepts only finite GPS accuracy within the configured maximum", () => {
    expect(isGpsAccuracyAllowed(99.9)).toBe(true);
    expect(isGpsAccuracyAllowed(0)).toBe(false);
    expect(isGpsAccuracyAllowed(-1)).toBe(false);
    expect(isGpsAccuracyAllowed(101)).toBe(false);
    expect(isGpsAccuracyAllowed(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
