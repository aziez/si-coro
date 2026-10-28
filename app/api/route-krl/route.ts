import { NextRequest } from "next/server"
import { getNearestStations, type Station } from "@/lib/geoUtils"

export interface StationRouteCandidate {
  station: Station
  straightDistanceKm: number
  roadDistanceKm: number
  roadDurationMinutes: number
  /** Array of [lat, lon] points representing the actual road path */
  routeCoordinates: [number, number][]
  source: "osrm" | "estimated"
}

interface OsrmRouteResponse {
  code?: string
  routes?: {
    distance?: number // meters
    duration?: number // seconds
    geometry?: {
      coordinates?: [number, number][] // [lon, lat][]
    }
  }[]
}

async function fetchOsrmRoadRoute(
  fromLat: number,
  fromLon: number,
  station: Station,
  straightDistanceKm: number
): Promise<StationRouteCandidate> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${station.lon},${station.lat}?overview=full&geometries=geojson`
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    })

    if (!res.ok) throw new Error(`OSRM status ${res.status}`)

    const json = (await res.json()) as OsrmRouteResponse
    const route = json.routes?.[0]
    if (!route || typeof route.distance !== "number") {
      throw new Error("No OSRM route found")
    }

    const roadDistanceKm = Number((route.distance / 1000).toFixed(2))
    // OSRM free driving profile assumes ideal traffic; apply realistic urban Jabodetabek factor (~1.25x)
    const rawMinutes = (route.duration ?? 0) / 60
    const roadDurationMinutes = Math.max(
      2,
      Math.round(rawMinutes * 1.25)
    )

    const routeCoordinates: [number, number][] =
      route.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) ?? [
        [fromLat, fromLon],
        [station.lat, station.lon],
      ]

    return {
      station,
      straightDistanceKm: Number(straightDistanceKm.toFixed(2)),
      roadDistanceKm,
      roadDurationMinutes,
      routeCoordinates,
      source: "osrm",
    }
  } catch {
    // Graceful fallback with realistic Jabodetabek road tortuosity factor (1.32x straight line)
    const estimatedRoadKm = Number((straightDistanceKm * 1.32).toFixed(2))
    const estimatedMinutes = Math.max(
      3,
      Math.round((estimatedRoadKm / 26) * 60)
    )
    return {
      station,
      straightDistanceKm: Number(straightDistanceKm.toFixed(2)),
      roadDistanceKm: estimatedRoadKm,
      roadDurationMinutes: estimatedMinutes,
      routeCoordinates: [
        [fromLat, fromLon],
        [station.lat, station.lon],
      ],
      source: "estimated",
    }
  } finally {
    clearTimeout(timeout)
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
    return Response.json(
      { success: false, error: "Koordinat tidak valid." },
      { status: 400 }
    )
  }

  const candidates = getNearestStations(lat, lon, 3)
  const routedCandidates = await Promise.all(
    candidates.map((c) =>
      fetchOsrmRoadRoute(lat, lon, c.station, c.straightDistanceKm)
    )
  )

  // Sort by actual road driving distance (not straight-line Haversine!)
  routedCandidates.sort((a, b) => a.roadDistanceKm - b.roadDistanceKm)

  const bestStation = routedCandidates[0]

  return Response.json(
    {
      success: true,
      bestStation,
      alternatives: routedCandidates,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  )
}
