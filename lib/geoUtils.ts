// lib/geoUtils.ts

import {
  KRL_LINES_DATA,
  KRL_STATIONS_DATA,
  type KrlLineDefinition,
  type KrlLineId,
  type Station,
} from "./krlNetworkData"

export type { KrlLineDefinition, KrlLineId, Station }

// Coordinate of Monas as Jakarta Center
export const JAKARTA_CENTER = { lat: -6.17511, lon: 106.827153 }

// Verified OpenStreetMap KRL Stations in Jabodetabek (84 active stations)
export const KRL_STATIONS: Station[] = KRL_STATIONS_DATA

// Verified OpenStreetMap KRL Line Definitions with real curved track geometry
export const KRL_LINES_NETWORK: KrlLineDefinition[] = KRL_LINES_DATA

/**
 * Calculates straight-line distance between two coordinates in kilometers
 * Using the Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Finds the nearest KRL station from a given coordinate
 */
export function getNearestStation(
  lat: number,
  lon: number
): { station: Station; distance: number } {
  let nearest = KRL_STATIONS[0]
  let minDistance = calculateDistance(lat, lon, nearest.lat, nearest.lon)

  for (let i = 1; i < KRL_STATIONS.length; i++) {
    const dist = calculateDistance(
      lat,
      lon,
      KRL_STATIONS[i].lat,
      KRL_STATIONS[i].lon
    )
    if (dist < minDistance) {
      minDistance = dist
      nearest = KRL_STATIONS[i]
    }
  }

  return { station: nearest, distance: minDistance }
}

/**
 * KRL Commuter Line only serves Jabodetabek (+ Rangkasbitung/Cikarang ends).
 * Beyond this straight-line distance from the nearest station, a "nearest KRL
 * station" is meaningless (e.g. Jombang → Cikarang 584 km), so transit access
 * is treated as not applicable instead of being shown or scored.
 */
export const KRL_SERVICE_RADIUS_KM = 25

export function isWithinKrlService(straightDistanceKm: number): boolean {
  return straightDistanceKm <= KRL_SERVICE_RADIUS_KM
}

/**
 * Gets distance to Jakarta Center
 */
export function getDistanceToJakarta(lat: number, lon: number): number {
  return calculateDistance(lat, lon, JAKARTA_CENTER.lat, JAKARTA_CENTER.lon)
}

/**
 * Returns the top N nearest KRL stations by straight-line distance
 * Used as candidates for actual road routing (OSRM)
 */
export function getNearestStations(
  lat: number,
  lon: number,
  limit = 3
): { station: Station; straightDistanceKm: number }[] {
  return KRL_STATIONS.map((station) => ({
    station,
    straightDistanceKm: calculateDistance(lat, lon, station.lat, station.lon),
  }))
    .sort((a, b) => a.straightDistanceKm - b.straightDistanceKm)
    .slice(0, limit)
}

/**
 * Slices the real OSM track polyline between two stations on the same KRL line.
 */
function sliceTrackBetweenStations(
  line: KrlLineDefinition,
  fromStation: Station,
  toStation: Station
): [number, number][] {
  const coords = line.trackCoordinates
  if (coords.length < 2) {
    return [
      [fromStation.lat, fromStation.lon],
      [toStation.lat, toStation.lon],
    ]
  }

  const findClosestIdx = (lat: number, lon: number) => {
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < coords.length; i++) {
      const d = Math.hypot(coords[i][0] - lat, coords[i][1] - lon)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    return bestIdx
  }

  const iA = findClosestIdx(fromStation.lat, fromStation.lon)
  const iB = findClosestIdx(toStation.lat, toStation.lon)

  const sub =
    iA <= iB
      ? coords.slice(iA, iB + 1)
      : coords.slice(iB, iA + 1).reverse()

  return [
    [fromStation.lat, fromStation.lon],
    ...sub,
    [toStation.lat, toStation.lon],
  ]
}

function polylineLengthKm(points: [number, number][]): number {
  let km = 0
  for (let i = 0; i < points.length - 1; i++) {
    km += calculateDistance(
      points[i][0],
      points[i][1],
      points[i + 1][0],
      points[i + 1][1]
    )
  }
  return km
}

export const POPULAR_WORK_STATIONS = [
  "Stasiun Sudirman",
  "Stasiun Tanah Abang",
  "Stasiun Manggarai",
  "Stasiun Gondangdia",
  "Stasiun Juanda",
  "Stasiun Jakarta Kota",
  "Stasiun Tebet",
  "Stasiun Cawang",
  "Stasiun Palmerah",
  "Stasiun Kebayoran",
  "Stasiun Duri",
  "Stasiun Pasar Senen",
  "Stasiun Jatinegara",
]

export interface KrlRouteSummary {
  fromStation: string
  toStation: string
  railDistanceKm: number
  railDurationMinutes: number
  fareOneWay: number
  transits: string[]
  linesUsed: string[]
  stationCount: number
  pathCoordinates: [number, number][]
}

/**
 * Official KAI Commuter Jabodetabek Tariff Formula:
 * Rp 3.000 for the first 1-25 km, plus Rp 1.000 for every subsequent 10 km (or fraction thereof).
 */
export function calculateKrlFare(railDistanceKm: number): number {
  if (railDistanceKm <= 0) return 3000
  if (railDistanceKm <= 25) return 3000
  const extraKm = railDistanceKm - 25
  return 3000 + Math.ceil(extraKm / 10) * 1000
}

/**
 * Finds shortest rail path & transit stations between two KRL stations
 * using Dijkstra over the KRL Jabodetabek station network, returning real curved OSM track geometry.
 */
export function calculateKrlRoute(
  fromStationName: string,
  toStationName: string
): KrlRouteSummary | null {
  const stationMap = new Map<string, Station>(
    KRL_STATIONS.map((s) => [s.name, s])
  )
  const lineMap = new Map<string, KrlLineDefinition>(
    KRL_LINES_NETWORK.map((l) => [l.name, l])
  )

  if (!stationMap.has(fromStationName) || !stationMap.has(toStationName)) {
    return null
  }

  if (fromStationName === toStationName) {
    const st = stationMap.get(fromStationName)!
    return {
      fromStation: fromStationName,
      toStation: toStationName,
      railDistanceKm: 0,
      railDurationMinutes: 0,
      fareOneWay: 3000,
      transits: [],
      linesUsed: [],
      stationCount: 0,
      pathCoordinates: [[st.lat, st.lon]],
    }
  }

  interface Edge {
    to: string
    lineName: string
    distanceKm: number
  }

  const adjacency = new Map<string, Edge[]>()
  const addEdge = (a: string, b: string, line: KrlLineDefinition) => {
    const stA = stationMap.get(a)
    const stB = stationMap.get(b)
    if (!stA || !stB) return
    const sliced = sliceTrackBetweenStations(line, stA, stB)
    const dist = Math.max(
      calculateDistance(stA.lat, stA.lon, stB.lat, stB.lon),
      polylineLengthKm(sliced)
    )
    if (!adjacency.has(a)) adjacency.set(a, [])
    if (!adjacency.has(b)) adjacency.set(b, [])
    adjacency.get(a)!.push({ to: b, lineName: line.name, distanceKm: dist })
    adjacency.get(b)!.push({ to: a, lineName: line.name, distanceKm: dist })
  }

  for (const line of KRL_LINES_NETWORK) {
    for (let i = 0; i < line.stations.length - 1; i++) {
      addEdge(line.stations[i], line.stations[i + 1], line)
    }
  }

  const distMap = new Map<string, number>()
  const prevMap = new Map<
    string,
    { prevStation: string; lineName: string; segmentKm: number }
  >()
  const visited = new Set<string>()

  distMap.set(fromStationName, 0)

  while (true) {
    let current: string | null = null
    let bestDist = Infinity
    for (const [st, d] of distMap.entries()) {
      if (!visited.has(st) && d < bestDist) {
        bestDist = d
        current = st
      }
    }

    if (!current || current === toStationName) break
    visited.add(current)

    const currentPrev = prevMap.get(current)
    const edges = adjacency.get(current) ?? []
    for (const edge of edges) {
      if (visited.has(edge.to)) continue
      const lineChangePenalty =
        currentPrev && currentPrev.lineName !== edge.lineName ? 1.5 : 0
      const candidateCost = bestDist + edge.distanceKm + lineChangePenalty
      if (candidateCost < (distMap.get(edge.to) ?? Infinity)) {
        distMap.set(edge.to, candidateCost)
        prevMap.set(edge.to, {
          prevStation: current,
          lineName: edge.lineName,
          segmentKm: edge.distanceKm,
        })
      }
    }
  }

  if (!prevMap.has(toStationName)) return null

  const pathStations: string[] = [toStationName]
  const segmentLines: string[] = []
  let totalRailKm = 0
  let cursor = toStationName

  while (cursor !== fromStationName) {
    const step = prevMap.get(cursor)
    if (!step) break
    totalRailKm += step.segmentKm
    segmentLines.unshift(step.lineName)
    pathStations.unshift(step.prevStation)
    cursor = step.prevStation
  }

  const transits: string[] = []
  const linesUsed: string[] = []
  for (let i = 0; i < segmentLines.length; i++) {
    const ln = segmentLines[i]
    if (linesUsed[linesUsed.length - 1] !== ln) {
      linesUsed.push(ln)
      if (i > 0) {
        transits.push(pathStations[i])
      }
    }
  }

  const stationCount = Math.max(0, pathStations.length - 1)
  // Average KRL speed ~38 km/h + 1.1 min dwell per station + 6 min per transit
  const railDurationMinutes = Math.round(
    (totalRailKm / 38) * 60 + stationCount * 1.1 + transits.length * 6
  )

  // Stitch actual curved OSM railway geometry across all segments
  const pathCoordinates: [number, number][] = []
  for (let i = 0; i < segmentLines.length; i++) {
    const stA = stationMap.get(pathStations[i])
    const stB = stationMap.get(pathStations[i + 1])
    const line = lineMap.get(segmentLines[i])
    if (!stA || !stB) continue
    const segCoords = line
      ? sliceTrackBetweenStations(line, stA, stB)
      : [
          [stA.lat, stA.lon] as [number, number],
          [stB.lat, stB.lon] as [number, number],
        ]
    if (pathCoordinates.length === 0) {
      pathCoordinates.push(...segCoords)
    } else {
      pathCoordinates.push(...segCoords.slice(1))
    }
  }

  return {
    fromStation: fromStationName,
    toStation: toStationName,
    railDistanceKm: Number(totalRailKm.toFixed(1)),
    railDurationMinutes,
    fareOneWay: calculateKrlFare(totalRailKm),
    transits,
    linesUsed,
    stationCount,
    pathCoordinates,
  }
}

export type FirstMileMode = "motor" | "ojol" | "angkot"

export interface FirstMileEstimate {
  mode: FirstMileMode
  label: string
  dailyRoundTripCost: number
  oneWayDurationMinutes: number
  note: string
}

/**
 * Estimates daily round-trip first-mile cost from property to nearest KRL station
 * using actual road distance (km) and driving duration.
 */
export function calculateFirstMileCost(
  roadDistanceKm: number,
  roadDurationMinutes?: number
): Record<FirstMileMode, FirstMileEstimate> {
  const d = Math.max(0.5, roadDistanceKm)
  const baseDriveMin =
    roadDurationMinutes ?? Math.max(3, Math.round((d / 28) * 60))

  // 1. Motor Pribadi: BBM ~Rp 350/km x 2 (PP) + Parkir Inap Stasiun Rp 6.000/hari
  const motorFuelPP = Math.round((d * 2 * 350) / 500) * 500
  const motorParking = 6000
  const motorDaily = motorFuelPP + motorParking

  // 2. Ojek Online (GoRide/GrabBike): Rp 11.000 untuk 4 km pertama + Rp 2.500/km selanjutnya (sekali jalan)
  const ojolOneWay = d <= 4 ? 11000 : 11000 + Math.ceil(d - 4) * 2500
  const ojolDaily = ojolOneWay * 2

  // 3. Angkot / Mikrotrans / Feeder: Rp 5.000 untuk <=5 km, Rp 7.000 untuk >5 km (sekali jalan)
  const angkotOneWay = d <= 5 ? 5000 : d <= 10 ? 7000 : 10000
  const angkotDaily = angkotOneWay * 2

  return {
    motor: {
      mode: "motor",
      label: "Motor Pribadi + Parkir Stasiun",
      dailyRoundTripCost: motorDaily,
      oneWayDurationMinutes: baseDriveMin,
      note: `BBM PP ~Rp${motorFuelPP.toLocaleString("id-ID")} + Parkir Inap Rp6.000/hr`,
    },
    ojol: {
      mode: "ojol",
      label: "Ojek Online (PP)",
      dailyRoundTripCost: ojolDaily,
      oneWayDurationMinutes: baseDriveMin + 3,
      note: `~Rp${ojolOneWay.toLocaleString("id-ID")} sekali jalan (${d.toFixed(1)} km)`,
    },
    angkot: {
      mode: "angkot",
      label: "Angkot / Feeder Umum (PP)",
      dailyRoundTripCost: angkotDaily,
      oneWayDurationMinutes: Math.round(baseDriveMin * 1.45) + 5,
      note: `~Rp${angkotOneWay.toLocaleString("id-ID")} sekali jalan`,
    },
  }
}
