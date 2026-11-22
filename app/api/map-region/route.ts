import { NextRequest } from "next/server"
import { emptyMapResponse } from "@/lib/mapSearch"
import {
  findWilayah,
  getAllSikumbangProperties,
  getSikumbangCities,
  getSikumbangProvinces,
} from "@/lib/sikumbangMap.server"

const BIG_REGION_QUERY =
  "https://geoservices.big.go.id/rbi/rest/services/Hosted/Wilayah_Administrasi_Kabupaten__Kota/FeatureServer/0/query"

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"

interface AdministrativeArea {
  wadmkk?: string
  wadmpr?: string
  kdpkab?: string | number
  kdppum?: string | number
}

interface BigRegionPayload {
  features?: Array<{
    attributes?: AdministrativeArea
  }>
  error?: { message?: string }
}

interface NominatimReversePayload {
  address?: {
    city?: string
    county?: string
    municipality?: string
    town?: string
    state_district?: string
    city_district?: string
    state?: string
    region?: string
  }
}

/**
 * Tier 3 offline-safe fallback centroids for Jabodetabek & KRL corridor regencies/cities
 * using official BPS / SiKumbang kodeWilayah codes.
 */
const JABODETABEK_FALLBACK_REGIONS: Array<{
  lat: number
  lon: number
  wadmkk: string
  wadmpr: string
  kdpkab: string
  kdppum: string
}> = [
  { lat: -6.1865, lon: 106.8341, wadmkk: "Kota Adm. Jakarta Pusat", wadmpr: "DKI Jakarta", kdpkab: "3171", kdppum: "31" },
  { lat: -6.1384, lon: 106.8639, wadmkk: "Kota Adm. Jakarta Utara", wadmpr: "DKI Jakarta", kdpkab: "3172", kdppum: "31" },
  { lat: -6.1674, lon: 106.7637, wadmkk: "Kota Adm. Jakarta Barat", wadmpr: "DKI Jakarta", kdpkab: "3173", kdppum: "31" },
  { lat: -6.2615, lon: 106.8106, wadmkk: "Kota Adm. Jakarta Selatan", wadmpr: "DKI Jakarta", kdpkab: "3174", kdppum: "31" },
  { lat: -6.225, lon: 106.9004, wadmkk: "Kota Adm. Jakarta Timur", wadmpr: "DKI Jakarta", kdpkab: "3175", kdppum: "31" },
  { lat: -6.4025, lon: 106.7942, wadmkk: "Kota Depok", wadmpr: "Jawa Barat", kdpkab: "3276", kdppum: "32" },
  { lat: -6.5971, lon: 106.806, wadmkk: "Kota Bogor", wadmpr: "Jawa Barat", kdpkab: "3271", kdppum: "32" },
  { lat: -6.4797, lon: 106.8249, wadmkk: "Kabupaten Bogor", wadmpr: "Jawa Barat", kdpkab: "3201", kdppum: "32" },
  { lat: -6.2383, lon: 106.9756, wadmkk: "Kota Bekasi", wadmpr: "Jawa Barat", kdpkab: "3275", kdppum: "32" },
  { lat: -6.265, lon: 107.11, wadmkk: "Kabupaten Bekasi", wadmpr: "Jawa Barat", kdpkab: "3216", kdppum: "32" },
  { lat: -6.3227, lon: 107.3376, wadmkk: "Kabupaten Karawang", wadmpr: "Jawa Barat", kdpkab: "3215", kdppum: "32" },
  { lat: -6.2886, lon: 106.7179, wadmkk: "Kota Tangerang Selatan", wadmpr: "Banten", kdpkab: "3674", kdppum: "36" },
  { lat: -6.1783, lon: 106.6319, wadmkk: "Kota Tangerang", wadmpr: "Banten", kdpkab: "3671", kdppum: "36" },
  { lat: -6.26, lon: 106.52, wadmkk: "Kabupaten Tangerang", wadmpr: "Banten", kdpkab: "3603", kdppum: "36" },
  { lat: -6.3531, lon: 106.2531, wadmkk: "Kabupaten Lebak", wadmpr: "Banten", kdpkab: "3602", kdppum: "36" },
  { lat: -6.12, lon: 106.1503, wadmkk: "Kota Serang", wadmpr: "Banten", kdpkab: "3673", kdppum: "36" },
]

async function resolveFromBigGis(
  lat: number,
  lon: number
): Promise<AdministrativeArea | null> {
  const params = new URLSearchParams({
    f: "json",
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    returnGeometry: "false",
    outFields: "wadmkk,wadmpr,kdpkab,kdppum",
  })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)

  try {
    const response = await fetch(`${BIG_REGION_QUERY}?${params}`, {
      signal: controller.signal,
      next: { revalidate: 86_400 },
    })
    if (!response.ok) return null

    const payload = (await response.json()) as BigRegionPayload
    if (payload.error) return null
    const attr = payload.features?.[0]?.attributes
    if (!attr?.wadmkk || !attr.wadmpr) return null
    return attr
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function resolveFromNominatim(
  lat: number,
  lon: number
): Promise<AdministrativeArea | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lon),
    zoom: "10",
    "accept-language": "id",
  })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6_000)

  try {
    const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Si-Coro-PropTech/1.0 (https://si-coro.local)",
      },
      next: { revalidate: 86_400 },
    })
    if (!response.ok) return null

    const payload = (await response.json()) as NominatimReversePayload
    const addr = payload.address
    if (!addr) return null

    const rawState = addr.state || addr.region || ""
    // DKI Jakarta often has state="Daerah Khusus Ibukota Jakarta" & city/city_district="Jakarta Selatan"
    const rawCity =
      addr.county ||
      addr.city ||
      addr.municipality ||
      addr.state_district ||
      addr.town ||
      ""

    if (!rawCity && !rawState) return null

    const normalizedState = /jakarta/i.test(rawState || rawCity)
      ? "DKI Jakarta"
      : rawState

    return {
      wadmkk: rawCity || normalizedState,
      wadmpr: normalizedState,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function resolveFromFallbackCentroids(
  lat: number,
  lon: number
): AdministrativeArea | null {
  let best = JABODETABEK_FALLBACK_REGIONS[0]
  let bestDistSq = Infinity

  for (const reg of JABODETABEK_FALLBACK_REGIONS) {
    const dSq = (lat - reg.lat) ** 2 + (lon - reg.lon) ** 2
    if (dSq < bestDistSq) {
      bestDistSq = dSq
      best = reg
    }
  }

  // Only match within ~0.55 deg (~60km) of Jabodetabek/Banten/Jabar coverage
  if (Math.sqrt(bestDistSq) > 0.55) return null
  return {
    wadmkk: best.wadmkk,
    wadmpr: best.wadmpr,
    kdpkab: best.kdpkab,
    kdppum: best.kdppum,
  }
}

async function resolveAdministrativeArea(
  lat: number,
  lon: number
): Promise<AdministrativeArea | null> {
  // Tier 1: BIG GIS (authoritative Indonesian boundary server)
  const fromBig = await resolveFromBigGis(lat, lon)
  if (fromBig) return fromBig

  // Tier 2: OpenStreetMap Nominatim reverse geocoding
  const fromNominatim = await resolveFromNominatim(lat, lon)
  if (fromNominatim?.wadmkk && fromNominatim?.wadmpr) return fromNominatim

  // Tier 3: Instant built-in Jabodetabek & KRL corridor centroid fallback
  return resolveFromFallbackCentroids(lat, lon)
}

function normalizeRegionCode(value?: string | number) {
  return value === undefined ? "" : String(value).replace(/[^0-9]/g, "")
}

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"))
  const lon = Number(request.nextUrl.searchParams.get("lon"))
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? ""
  const asosiasi = request.nextUrl.searchParams.get("asosiasi")?.trim() ?? ""

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return Response.json(
      { ...emptyMapResponse(), error: "Koordinat peta tidak valid." },
      { status: 400 }
    )
  }

  try {
    const administrativeArea = await resolveAdministrativeArea(lat, lon)
    if (!administrativeArea?.wadmkk || !administrativeArea.wadmpr) {
      return Response.json(emptyMapResponse())
    }

    const provinces = await getSikumbangProvinces()
    const provinceCode = normalizeRegionCode(administrativeArea.kdppum)
    const province =
      provinces.find((item) => item.kodeWilayah === provinceCode) ??
      findWilayah(provinces, administrativeArea.wadmpr)
    if (!province) {
      return Response.json({
        ...emptyMapResponse(),
        error: `Provinsi ${administrativeArea.wadmpr} tidak ditemukan di master Sikumbang.`,
      })
    }

    const cities = await getSikumbangCities(province.kodeWilayah)
    const cityCode = normalizeRegionCode(administrativeArea.kdpkab)
    let city =
      cities.find((item) => item.kodeWilayah === cityCode) ??
      findWilayah(cities, administrativeArea.wadmkk)

    // If Nominatim returned generic "Jakarta", match via Jabodetabek centroid fallback for exact borough
    if (!city && province.kodeWilayah === "31") {
      const fb = resolveFromFallbackCentroids(lat, lon)
      if (fb?.kdpkab) {
        city = cities.find((item) => item.kodeWilayah === fb.kdpkab)
      }
      city = city ?? cities[0]
    }

    if (!city) {
      return Response.json({
        ...emptyMapResponse(),
        error: `Kabupaten/kota ${administrativeArea.wadmkk} tidak ditemukan di master Sikumbang.`,
      })
    }

    const { properties, meta } = await getAllSikumbangProperties({
      kodeWilayah: city.kodeWilayah,
      namaKabupaten: city.namaWilayah,
      keyword,
      asosiasi,
    })

    return Response.json(
      {
        region: {
          kodeWilayah: city.kodeWilayah,
          namaKabupaten: city.namaWilayah,
          namaProvinsi: province.namaWilayah,
        },
        properties,
        meta,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
        },
      }
    )
  } catch (error) {
    console.error("Map region lookup failed", error)
    return Response.json(
      {
        ...emptyMapResponse(),
        error: "Data wilayah atau perumahan Sikumbang belum dapat dimuat.",
        diagnostic:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 502 }
    )
  }
}
