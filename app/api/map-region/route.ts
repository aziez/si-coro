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

interface BigRegionPayload {
  features?: Array<{
    attributes?: {
      wadmkk?: string
      wadmpr?: string
      kdpkab?: string | number
      kdppum?: string | number
    }
  }>
  error?: { message?: string }
}

async function resolveAdministrativeArea(lat: number, lon: number) {
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
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const response = await fetch(`${BIG_REGION_QUERY}?${params}`, {
      signal: controller.signal,
      next: { revalidate: 86_400 },
    })
    if (!response.ok) throw new Error(`BIG returned ${response.status}`)

    const payload = (await response.json()) as BigRegionPayload
    if (payload.error)
      throw new Error(payload.error.message || "BIG query failed")
    return payload.features?.[0]?.attributes ?? null
  } finally {
    clearTimeout(timeout)
  }
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
    const city =
      cities.find((item) => item.kodeWilayah === cityCode) ??
      findWilayah(cities, administrativeArea.wadmkk)
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
