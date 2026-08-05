"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Coordinate, MapRegionResponse } from "@/lib/mapSearch"

type MapSearchStatus = "idle" | "loading" | "success" | "error"

interface MapAreaSearchState extends MapRegionResponse {
  status: MapSearchStatus
  error: string
}

const INITIAL_STATE: MapAreaSearchState = {
  region: null,
  properties: [],
  meta: {
    total: 0,
    fetched: 0,
    unique: 0,
    withCoordinates: 0,
    withoutCoordinates: 0,
    pagesFetched: 0,
    complete: true,
  },
  status: "idle",
  error: "",
}

export function useMapAreaSearch({
  keyword,
  asosiasi,
}: {
  keyword: string
  asosiasi: string
}) {
  const [area, setArea] = useState<MapAreaSearchState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sequenceRef = useRef(0)
  const lastRequestKeyRef = useRef("")
  const cacheRef = useRef(new Map<string, MapRegionResponse>())

  const searchAt = useCallback(
    (coordinate: Coordinate, options?: { immediate?: boolean }) => {
      const [lat, lon] = coordinate
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return

      const requestKey = `${lat.toFixed(4)}|${lon.toFixed(4)}|${keyword}|${asosiasi}`
      if (requestKey === lastRequestKeyRef.current) return
      lastRequestKeyRef.current = requestKey

      if (debounceRef.current) clearTimeout(debounceRef.current)

      const run = async () => {
        const cached = cacheRef.current.get(requestKey)
        if (cached) {
          setArea({ ...cached, status: "success", error: "" })
          return
        }

        const sequence = ++sequenceRef.current
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setArea((current) => ({ ...current, status: "loading", error: "" }))

        try {
          const query = new URLSearchParams({
            lat: lat.toFixed(6),
            lon: lon.toFixed(6),
          })
          if (keyword) query.set("keyword", keyword)
          if (asosiasi) query.set("asosiasi", asosiasi)

          const response = await fetch(`/api/map-region?${query}`, {
            signal: controller.signal,
            cache: "no-store",
          })
          const payload = (await response.json()) as MapRegionResponse
          if (!response.ok)
            throw new Error(payload.error || "Data area peta gagal dimuat.")
          if (sequence !== sequenceRef.current) return

          cacheRef.current.set(requestKey, payload)
          if (cacheRef.current.size > 40) {
            const oldestKey = cacheRef.current.keys().next().value
            if (oldestKey) cacheRef.current.delete(oldestKey)
          }
          setArea({ ...payload, status: "success", error: "" })
        } catch (error) {
          if (
            (error as Error).name === "AbortError" ||
            sequence !== sequenceRef.current
          )
            return
          lastRequestKeyRef.current = ""
          setArea((current) => ({
            ...current,
            status: "error",
            error: (error as Error).message,
          }))
        }
      }

      if (options?.immediate) void run()
      else debounceRef.current = setTimeout(run, 450)
    },
    [asosiasi, keyword]
  )

  useEffect(() => {
    lastRequestKeyRef.current = ""
  }, [asosiasi, keyword])

  useEffect(
    () => () => {
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    []
  )

  return { area, searchAt }
}
