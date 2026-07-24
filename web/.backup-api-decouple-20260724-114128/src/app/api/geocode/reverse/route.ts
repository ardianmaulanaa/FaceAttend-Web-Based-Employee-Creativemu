import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type NominatimAddress = Record<string, string | undefined>;

type NominatimResponse = {
  error?: string;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
};

function clean(value?: string | null) {
  return String(value || "").trim();
}

function pickAddress(address: NominatimAddress, keys: string[]) {
  for (const key of keys) {
    const value = clean(address[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function buildPlaceName(data: NominatimResponse) {
  const address = data.address || {};

  return (
    clean(data.name) ||
    pickAddress(address, [
      "office",
      "company",
      "building",
      "amenity",
      "shop",
      "tourism",
      "attraction",
      "road",
      "pedestrian",
      "neighbourhood",
      "suburb",
      "village",
      "town",
      "city",
    ])
  );
}

function buildShortName(data: NominatimResponse) {
  const address = data.address || {};

  const houseNumber = clean(address.house_number);

  const road = pickAddress(address, [
    "road",
    "pedestrian",
    "footway",
    "path",
    "residential",
  ]);

  const neighbourhood = pickAddress(address, [
    "neighbourhood",
    "suburb",
    "hamlet",
    "village",
    "city_district",
  ]);

  const city = pickAddress(address, [
    "city",
    "town",
    "county",
    "municipality",
    "state_district",
  ]);

  const state = clean(address.state);
  const postcode = clean(address.postcode);

  const street = [road, houseNumber].filter(Boolean).join(" ");

  return [street, neighbourhood, city, state, postcode]
    .filter(Boolean)
    .join(", ");
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const { searchParams } = new URL(req.url);

    const latRaw = searchParams.get("lat");
    const lonRaw = searchParams.get("lon") || searchParams.get("lng");

    const latitude = Number(latRaw);
    const longitude = Number(lonRaw);

    if (
      !latRaw ||
      !lonRaw ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude dan longitude wajib berupa angka.",
        },
        { status: 400 },
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude tidak valid.",
        },
        { status: 400 },
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          success: false,
          message: "Longitude tidak valid.",
        },
        { status: 400 },
      );
    }

    const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");

    reverseUrl.searchParams.set("format", "jsonv2");
    reverseUrl.searchParams.set("lat", String(latitude));
    reverseUrl.searchParams.set("lon", String(longitude));
    reverseUrl.searchParams.set("zoom", "18");
    reverseUrl.searchParams.set("addressdetails", "1");

    const response = await fetch(reverseUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Language": "id,en;q=0.8",
        "User-Agent": "Presensi/1.0 Development",
      },
      cache: "no-store",
    });

    const data = (await response.json()) as NominatimResponse;

    if (!response.ok || data.error) {
      return NextResponse.json(
        {
          success: false,
          message: data.error || "Gagal mengambil alamat lokasi.",
        },
        { status: response.status || 500 },
      );
    }

    const placeName = buildPlaceName(data);
    const shortName = buildShortName(data);
    const displayName = clean(data.display_name) || shortName || placeName;

    return NextResponse.json(
      {
        success: true,
        source: "openstreetmap_nominatim",

        display_name: displayName,
        displayName,

        name: placeName,
        placeName,

        shortName,

        lat: data.lat,
        lon: data.lon,

        address: data.address || {},
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("REVERSE_GEOCODE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal mengambil alamat lokasi."),
      },
      { status: getApiErrorStatus(error) },
    );
  }
}
