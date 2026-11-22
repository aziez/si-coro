"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CircleMarker,
  LayerGroup,
  MapContainer,
  Pane,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet"
import { createLayerComponent } from "@react-leaflet/core"
import type { LayerProps } from "@react-leaflet/core"
import { dynamicMapLayer } from "esri-leaflet"
import { Drop, Mountains, Train, MapPin } from "@phosphor-icons/react"
import type { Perumahan } from "@/components/HouseCard"
import {
  KRL_LINES_NETWORK,
  KRL_STATIONS,
  type Station,
} from "@/lib/geoUtils"
import {
  parsePropertyCoordinate,
  type Coordinate,
  type MapSearchMeta,
} from "@/lib/mapSearch"
import { cn } from "@/lib/utils"

interface PropertyMapProps {
  properties: Perumahan[]
  selectedProperty?: Perumahan | null
  onSelectProperty: (property: Perumahan) => void
  onViewportChange?: (
    center: Coordinate,
    options?: { immediate?: boolean }
  ) => void
  loading?: boolean
  error?: string
  regionLabel?: string
  meta?: MapSearchMeta
}

const JABODETABEK_CENTER: Coordinate = [-6.35, 106.82]
const FLOOD_HAZARD_SERVICE =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir_30/MapServer"

function findStation(name: string): Station | undefined {
  return KRL_STATIONS.find((station) => station.name === name)
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n)

type FloodHazardLayerInstance = ReturnType<typeof dynamicMapLayer>

const FloodHazardLayer = createLayerComponent<
  FloodHazardLayerInstance,
  LayerProps
>((_props, context) => ({
  instance: dynamicMapLayer({
    url: FLOOD_HAZARD_SERVICE,
    layers: [0],
    format: "png32",
    transparent: true,
    opacity: 0.48,
    pane: "flood-hazard",
    useCors: true,
    attribution: "InaRISK BNPB",
  }),
  context,
}))

function MapController({
  selectedProperty,
  onViewportChange,
}: Pick<PropertyMapProps, "selectedProperty" | "onViewportChange">) {
  const map = useMap()
  const skipNextMoveRef = useRef(false)
  const lastSelectedIdRef = useRef("")

  const reportViewport = useCallback(() => {
    if (skipNextMoveRef.current) {
      skipNextMoveRef.current = false
      return
    }
    const center = map.getCenter()
    onViewportChange?.([center.lat, center.lng])
  }, [map, onViewportChange])

  useMapEvents({ moveend: reportViewport })

  useEffect(() => {
    const timer = window.setTimeout(reportViewport, 180)
    return () => window.clearTimeout(timer)
  }, [reportViewport])

  useEffect(() => {
    const point = parsePropertyCoordinate(selectedProperty?.koordinatPerumahan)
    if (
      !point ||
      !selectedProperty ||
      lastSelectedIdRef.current === selectedProperty.idLokasi
    ) {
      return
    }
    lastSelectedIdRef.current = selectedProperty.idLokasi
    skipNextMoveRef.current = true
    map.flyTo(point, Math.max(map.getZoom(), 14), { duration: 0.45 })
  }, [map, selectedProperty])

  useEffect(() => {
    const container = map.getContainer()
    const refresh = () => map.invalidateSize({ animate: false, pan: false })
    const timer = window.setTimeout(refresh, 100)
    const observer = new ResizeObserver(refresh)
    observer.observe(container)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [map])

  return null
}

function KrlStationMarker({
  station,
  onViewportChange,
}: {
  station: Station
  onViewportChange?: PropertyMapProps["onViewportChange"]
}) {
  const map = useMap()

  return (
    <CircleMarker
      center={[station.lat, station.lon]}
      radius={5}
      pathOptions={{
        color: "#0f172a",
        fillColor: "#ffffff",
        fillOpacity: 1,
        weight: 2,
      }}
      eventHandlers={{
        click: () => {
          onViewportChange?.([station.lat, station.lon], { immediate: true })
          map.flyTo([station.lat, station.lon], 13, { duration: 0.45 })
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -4]}>
        {station.name} · Klik untuk memuat perumahan di sekitar stasiun
      </Tooltip>
    </CircleMarker>
  )
}

export function PropertyMap({
  properties,
  selectedProperty,
  onSelectProperty,
  onViewportChange,
  loading = false,
  error = "",
  regionLabel = "",
  meta,
}: PropertyMapProps) {
  const [krlEnabled, setKrlEnabled] = useState(true)
  const [terrainEnabled, setTerrainEnabled] = useState(false)
  const [floodLayerEnabled, setFloodLayerEnabled] = useState(false)
  const [floodLayerLoading, setFloodLayerLoading] = useState(false)

  useEffect(() => {
    if (!floodLayerLoading) return
    const timeout = window.setTimeout(() => setFloodLayerLoading(false), 18_000)
    return () => window.clearTimeout(timeout)
  }, [floodLayerLoading])

  const mappedProperties = useMemo(() => {
    const markers = new Map<
      string,
      { property: Perumahan; coordinate: Coordinate; markerId: string }
    >()

    for (const property of properties) {
      const coordinate = parsePropertyCoordinate(property.koordinatPerumahan)
      if (!coordinate) continue
      const markerId = property.idLokasi || `${coordinate[0]},${coordinate[1]}`
      markers.set(markerId, { property, coordinate, markerId })
    }
    return [...markers.values()]
  }, [properties])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-md">
      {/* Top Touch-Friendly Layer Controls Strip */}
      <div className="no-scrollbar pointer-events-none absolute top-3 right-3 left-14 z-[1000] flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setKrlEnabled((v) => !v)}
          className={cn(
            "pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all",
            krlEnabled
              ? "border-orange-500/50 bg-orange-600 text-white"
              : "border-border bg-background/95 text-foreground hover:bg-muted"
          )}
        >
          <Train weight="fill" className="h-3.5 w-3.5" />
          Jalur KRL
        </button>

        <button
          type="button"
          onClick={() => {
            setFloodLayerEnabled((v) => {
              const next = !v
              if (next) setFloodLayerLoading(true)
              else setFloodLayerLoading(false)
              return next
            })
          }}
          className={cn(
            "pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all",
            floodLayerEnabled
              ? "border-red-500/50 bg-red-600 text-white"
              : "border-border bg-background/95 text-foreground hover:bg-muted"
          )}
        >
          <Drop weight="fill" className="h-3.5 w-3.5" />
          Peta Banjir BNPB
        </button>

        <button
          type="button"
          onClick={() => setTerrainEnabled((v) => !v)}
          className={cn(
            "pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all",
            terrainEnabled
              ? "border-blue-500/50 bg-blue-600 text-white"
              : "border-border bg-background/95 text-foreground hover:bg-muted"
          )}
        >
          <Mountains weight="fill" className="h-3.5 w-3.5" />
          Kontur Medan
        </button>
      </div>

      <MapContainer
        center={JABODETABEK_CENTER}
        zoom={10}
        scrollWheelZoom
        preferCanvas
        className="h-[min(66dvh,640px)] min-h-[420px] w-full"
        aria-label="Peta perumahan dan akses KRL"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {terrainEnabled && (
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a>'
            opacity={0.62}
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        )}

        <Pane name="flood-hazard" style={{ zIndex: 420 }} />
        {floodLayerEnabled && (
          <FloodHazardLayer
            eventHandlers={{
              loading: () => setFloodLayerLoading(true),
              load: () => setFloodLayerLoading(false),
            }}
          />
        )}

        <Pane name="property-points" style={{ zIndex: 650 }}>
          <LayerGroup>
            {mappedProperties.map(({ property, coordinate, markerId }) => {
              const selected =
                property.idLokasi === selectedProperty?.idLokasi
              const hargaMulai = property.tipeRumah?.length
                ? Math.min(...property.tipeRumah.map((t) => t.harga))
                : 0
              const hasSubsidi = property.tipeRumah?.some(
                (t) => t.status === "subsidi"
              )

              return (
                <CircleMarker
                  key={markerId}
                  center={coordinate}
                  radius={selected ? 12 : 9}
                  pathOptions={{
                    color: selected ? "#0f172a" : "#ffffff",
                    fillColor: selected
                      ? "#f97316"
                      : hasSubsidi
                        ? "#059669"
                        : "#2563eb",
                    fillOpacity: 1,
                    opacity: 1,
                    weight: selected ? 4 : 2.5,
                  }}
                  eventHandlers={{
                    click: () => onSelectProperty(property),
                  }}
                >
                  <Popup className="property-map-popup" autoPan>
                    <div className="min-w-52 space-y-1.5 py-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-bold text-white",
                            hasSubsidi ? "bg-emerald-600" : "bg-blue-600"
                          )}
                        >
                          {hasSubsidi ? "Subsidi" : "Komersil"}
                        </span>
                        {property.jumlahUnit > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-700">
                            Sisa {property.jumlahUnit} unit
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-extrabold leading-snug text-slate-900">
                        {property.namaPerumahan}
                      </p>
                      <p className="text-xs text-slate-600">
                        {[
                          property.wilayah?.kecamatan,
                          property.wilayah?.kabupaten,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Lokasi tersedia"}
                      </p>
                      {hargaMulai > 0 && (
                        <p className="text-xs font-extrabold text-emerald-700">
                          Mulai {formatRupiah(hargaMulai)}
                        </p>
                      )}
                      <button
                        type="button"
                        className="mt-1 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-center text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                        onClick={() => onSelectProperty(property)}
                      >
                        Cek Isi Rumah &amp; Risiko
                      </button>
                    </div>
                  </Popup>
                  <Tooltip direction="top" offset={[0, -7]}>
                    {property.namaPerumahan}
                  </Tooltip>
                </CircleMarker>
              )
            })}
          </LayerGroup>
        </Pane>

        {krlEnabled && (
          <LayerGroup>
            <Pane name="krl-lines" style={{ zIndex: 430 }}>
              {KRL_LINES_NETWORK.map((line) => {
                const points = line.stations.flatMap((name) => {
                  const station = findStation(name)
                  return station
                    ? [[station.lat, station.lon] as Coordinate]
                    : []
                })
                return (
                  <Polyline
                    key={line.id}
                    positions={points}
                    pathOptions={{
                      color: line.color,
                      weight: 4,
                      opacity: 0.85,
                    }}
                  >
                    <Tooltip sticky>{`KRL ${line.name}`}</Tooltip>
                  </Polyline>
                )
              })}
            </Pane>
            <Pane name="krl-stations" style={{ zIndex: 610 }}>
              {KRL_STATIONS.map((station) => (
                <KrlStationMarker
                  key={station.name}
                  station={station}
                  onViewportChange={onViewportChange}
                />
              ))}
            </Pane>
          </LayerGroup>
        )}

        <MapController
          selectedProperty={selectedProperty}
          onViewportChange={onViewportChange}
        />
      </MapContainer>

      {/* Flood Legend Card */}
      {floodLayerEnabled && (
        <div className="absolute top-14 left-3 z-[1000] w-48 rounded-xl border bg-background/95 p-3 text-[11px] shadow-lg backdrop-blur-md sm:left-14 sm:w-56">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-foreground">Indeks Bahaya Banjir</p>
            {floodLayerLoading && (
              <span className="animate-pulse text-[10px] font-semibold text-primary">
                Memuat…
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" /> Rendah
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-xs bg-amber-400" /> Sedang
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-xs bg-red-500" /> Tinggi
            </span>
          </div>
          <p className="mt-1.5 border-t pt-1.5 text-[10px] leading-snug text-muted-foreground">
            Sumber: InaRISK BNPB. Klik titik rumah untuk audit 5-titik radius
            250m.
          </p>
        </div>
      )}

      {/* Bottom Consolidated Status Strip */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1000] flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-background/95 px-3 py-1.5 text-[11px] shadow-md backdrop-blur-md">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            Subsidi
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            Komersil
          </span>
          <span className="hidden items-center gap-1.5 font-semibold sm:flex">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-white" />
            Stasiun KRL
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border bg-background/95 px-3 py-1.5 text-[11px] shadow-md backdrop-blur-md">
          <MapPin weight="fill" className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold text-foreground">
            {loading
              ? "Memuat area peta…"
              : `${mappedProperties.length} titik perumahan`}
          </span>
          {regionLabel && (
            <span className="hidden text-muted-foreground sm:inline">
              · {regionLabel}
            </span>
          )}
          {error && <span className="text-destructive">· {error}</span>}
        </div>
      </div>
    </div>
  )
}
