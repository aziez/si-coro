import { NextRequest } from "next/server"

const FLOOD_HAZARD_IDENTIFY =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir_30/MapServer/identify"

interface IdentifyResult {
  attributes?: Record<string, unknown>
}

interface IdentifyPayload {
  results?: IdentifyResult[]
  error?: { message?: string }
}

function parsePixelValue(payload: IdentifyPayload) {
  const attributes = payload.results?.[0]?.attributes
  const rawValue =
    attributes?.["Stretch.Pixel Value"] ?? attributes?.["Pixel Value"]
  if (rawValue === undefined || rawValue === null || rawValue === "NoData") {
    return 0
  }

  const value = Number(rawValue)
  return Number.isFinite(value) ? value : 0
}

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"))
  const lon = Number(request.nextUrl.searchParams.get("lon"))

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    return Response.json({ error: "Koordinat tidak valid." }, { status: 400 })
  }

  const extentPadding = 0.05
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    sr: "4326",
    tolerance: "2",
    mapExtent: [
      lon - extentPadding,
      lat - extentPadding,
      lon + extentPadding,
      lat + extentPadding,
    ].join(","),
    imageDisplay: "800,600,96",
    returnGeometry: "false",
    f: "json",
  })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const response = await fetch(`${FLOOD_HAZARD_IDENTIFY}?${params}`, {
      signal: controller.signal,
      next: { revalidate: 86_400 },
    })
    if (!response.ok) throw new Error(`InaRISK returned ${response.status}`)

    const payload = (await response.json()) as IdentifyPayload
    if (payload.error) {
      throw new Error(payload.error.message || "InaRISK identify failed")
    }

    const pixelValue = parsePixelValue(payload)
    let riskLevel = "Aman"
    if (pixelValue > 0) {
      if (pixelValue < 0.3) riskLevel = "Rendah"
      else if (pixelValue < 0.6) riskLevel = "Sedang"
      else riskLevel = "Tinggi"
    }

    return Response.json(
      {
        success: true,
        riskLevel,
        pixelValue,
        isFloodFree: riskLevel === "Aman" || riskLevel === "Rendah",
      },
      {
        headers: {
          "Cache-Control":
            "private, max-age=3600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (error) {
    console.error("InaRISK API Error:", error)
    return Response.json(
      {
        success: false,
        error: "Data risiko banjir belum dapat dimuat.",
      },
      { status: 502 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
