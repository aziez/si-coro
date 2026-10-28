import { NextRequest } from "next/server"

const FLOOD_HAZARD_IDENTIFY =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir_30/MapServer/identify"
const OPEN_METEO_ELEVATION = "https://api.open-meteo.com/v1/elevation"

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

function classifyFloodRisk(pixelValue: number) {
  if (pixelValue <= 0) return "Aman"
  if (pixelValue < 0.3) return "Rendah"
  if (pixelValue < 0.6) return "Sedang"
  return "Tinggi"
}

async function identifyInaRiskPoint(
  lat: number,
  lon: number,
  signal: AbortSignal
): Promise<number> {
  const extentPadding = 0.04
  const params = new URLSearchParams({
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    sr: "4326",
    tolerance: "3",
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

  const response = await fetch(`${FLOOD_HAZARD_IDENTIFY}?${params}`, {
    signal,
    next: { revalidate: 86_400 },
  })
  if (!response.ok) throw new Error(`InaRISK returned ${response.status}`)

  const payload = (await response.json()) as IdentifyPayload
  if (payload.error) {
    throw new Error(payload.error.message || "InaRISK identify failed")
  }
  return parsePixelValue(payload)
}

interface ElevationAnalysis {
  elevationMeters: number | null
  surroundingAvgMeters: number | null
  relativeToSurroundingMeters: number | null
  topographyLabel: string
  isLowlandBasin: boolean
}

async function fetchElevationProfile(
  points: { lat: number; lon: number }[],
  signal: AbortSignal
): Promise<ElevationAnalysis> {
  try {
    const lats = points.map((p) => p.lat.toFixed(5)).join(",")
    const lons = points.map((p) => p.lon.toFixed(5)).join(",")
    const res = await fetch(
      `${OPEN_METEO_ELEVATION}?latitude=${lats}&longitude=${lons}`,
      {
        signal,
        next: { revalidate: 86_400 },
      }
    )
    if (!res.ok) throw new Error(`Open-Meteo elevation ${res.status}`)
    const data = (await res.json()) as { elevation?: number[] }
    const elevations = data.elevation
    if (!Array.isArray(elevations) || elevations.length === 0) {
      throw new Error("Empty elevation array")
    }

    const centerElev = elevations[0]
    const surrounding = elevations.slice(1).filter((n) => Number.isFinite(n))
    const surroundingAvg =
      surrounding.length > 0
        ? surrounding.reduce((a, b) => a + b, 0) / surrounding.length
        : centerElev

    const relativeDiff = Number((centerElev - surroundingAvg).toFixed(1))
    const isLowlandBasin = relativeDiff <= -2.0 || centerElev < 8

    let topographyLabel = " Kontur Stabil / Normal"
    if (centerElev >= 80 && relativeDiff >= -1) {
      topographyLabel = "Dataran Tinggi (Bebas Genangan)"
    } else if (relativeDiff >= 1.5) {
      topographyLabel = "Lebih Tinggi dari Area Sekitar"
    } else if (relativeDiff <= -2.0) {
      topographyLabel = "Cekungan Lokal (Waspada Drainase)"
    } else if (centerElev < 10) {
      topographyLabel = "Dataran Rendah Pesisir"
    }

    return {
      elevationMeters: Math.round(centerElev),
      surroundingAvgMeters: Math.round(surroundingAvg),
      relativeToSurroundingMeters: relativeDiff,
      topographyLabel: topographyLabel.trim(),
      isLowlandBasin,
    }
  } catch {
    return {
      elevationMeters: null,
      surroundingAvgMeters: null,
      relativeToSurroundingMeters: null,
      topographyLabel: "Data kontur standar",
      isLowlandBasin: false,
    }
  }
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

  // Multi-point buffer (~250m around the property: Center, North, South, East, West)
  const delta = 0.00225 // ~250 meters
  const samplePoints = [
    { label: "Pusat Perumahan", lat, lon },
    { label: "Radius 250m Utara", lat: lat + delta, lon },
    { label: "Radius 250m Selatan", lat: lat - delta, lon },
    { label: "Radius 250m Timur", lat, lon: lon + delta },
    { label: "Radius 250m Barat", lat, lon: lon - delta },
  ]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const [elevationProfile, ...pixelValues] = await Promise.all([
      fetchElevationProfile(samplePoints, controller.signal),
      ...samplePoints.map((pt) =>
        identifyInaRiskPoint(pt.lat, pt.lon, controller.signal).catch(() => null)
      ),
    ])

    const validPixels = pixelValues.filter((v): v is number => v !== null)
    if (validPixels.length === 0 && elevationProfile.elevationMeters === null) {
      throw new Error("InaRISK & DEM unavailable")
    }

    const centerPixel = pixelValues[0] ?? 0
    const surroundingPixels = pixelValues
      .slice(1)
      .filter((v): v is number => v !== null)
    const maxSurroundingPixel =
      surroundingPixels.length > 0 ? Math.max(...surroundingPixels) : 0
    const affectedSurroundingCount = surroundingPixels.filter(
      (v) => v >= 0.3
    ).length

    // Weighted effective flood index: considers both exact point & 250m buffer access road risk
    const effectivePixel = Number(
      Math.max(centerPixel, maxSurroundingPixel * 0.85).toFixed(3)
    )

    let riskLevel = classifyFloodRisk(effectivePixel)
    if (
      riskLevel === "Aman" &&
      maxSurroundingPixel > 0 &&
      maxSurroundingPixel < 0.3
    ) {
      riskLevel = "Rendah"
    }

    const centerRiskLevel = classifyFloodRisk(centerPixel)
    const bufferWarning =
      centerPixel < 0.3 && maxSurroundingPixel >= 0.3
        ? `Titik utama aman, namun terdeteksi zona risiko banjir (${classifyFloodRisk(maxSurroundingPixel)}) dalam radius 250m (akses jalan sekitar).`
        : null

    return Response.json(
      {
        success: true,
        riskLevel,
        centerRiskLevel,
        pixelValue: effectivePixel,
        centerPixelValue: centerPixel,
        maxSurroundingPixelValue: maxSurroundingPixel,
        affectedSurroundingCount,
        sampleCount: validPixels.length,
        bufferWarning,
        isFloodFree: riskLevel === "Aman" || riskLevel === "Rendah",
        elevation: elevationProfile,
      },
      {
        headers: {
          "Cache-Control":
            "private, max-age=3600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (error) {
    console.error("InaRISK Multi-Point API Error:", error)
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
