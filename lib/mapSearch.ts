import type { Perumahan } from "@/components/HouseCard"

export type Coordinate = [number, number]

export interface MapRegion {
  kodeWilayah: string
  namaKabupaten: string
  namaProvinsi: string
}

export interface MapSearchMeta {
  total: number
  fetched: number
  unique: number
  withCoordinates: number
  withoutCoordinates: number
  pagesFetched: number
  complete: boolean
}

export interface MapRegionResponse {
  region: MapRegion | null
  properties: Perumahan[]
  meta: MapSearchMeta
  error?: string
}

const EMPTY_META: MapSearchMeta = {
  total: 0,
  fetched: 0,
  unique: 0,
  withCoordinates: 0,
  withoutCoordinates: 0,
  pagesFetched: 0,
  complete: true,
}

export function emptyMapResponse(): MapRegionResponse {
  return { region: null, properties: [], meta: { ...EMPTY_META } }
}

export function parsePropertyCoordinate(
  value?: string | null
): Coordinate | null {
  if (!value) return null

  const parts = value.split(",").map((part) => Number(part.trim()))
  if (parts.length < 2 || !parts.every(Number.isFinite)) return null

  let [lat, lon] = parts
  if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
    ;[lat, lon] = [lon, lat]
  }

  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return [lat, lon]
}

export function normalizePropertyCoordinate(value?: string | null) {
  const coordinate = parsePropertyCoordinate(value)
  return coordinate ? `${coordinate[0]},${coordinate[1]}` : undefined
}
