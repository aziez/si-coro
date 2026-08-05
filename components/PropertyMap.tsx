"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CircleMarker,
  LayerGroup,
  LayersControl,
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
import type { Perumahan } from "@/components/HouseCard"
import { KRL_STATIONS, type Station } from "@/lib/geoUtils"
import {
  parsePropertyCoordinate,
  type Coordinate,
  type MapSearchMeta,
} from "@/lib/mapSearch"

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

const KRL_LINES = [
  {
    name: "Bogor",
    color: "#e74c3c",
    stations: [
      "Stasiun Jakarta Kota",
      "Stasiun Jayakarta",
      "Stasiun Mangga Besar",
      "Stasiun Sawah Besar",
      "Stasiun Juanda",
      "Stasiun Gondangdia",
      "Stasiun Cikini",
      "Stasiun Manggarai",
      "Stasiun Tebet",
      "Stasiun Cawang",
      "Stasiun Duren Kalibata",
      "Stasiun Pasar Minggu Baru",
      "Stasiun Pasar Minggu",
      "Stasiun Tanjung Barat",
      "Stasiun Lenteng Agung",
      "Stasiun Universitas Pancasila",
      "Stasiun Universitas Indonesia",
      "Stasiun Pondok Cina",
      "Stasiun Depok Baru",
      "Stasiun Depok",
      "Stasiun Citayam",
      "Stasiun Bojong Gede",
      "Stasiun Cilebut",
      "Stasiun Bogor",
    ],
  },
  {
    name: "Nambo",
    color: "#f1c40f",
    stations: [
      "Stasiun Citayam",
      "Stasiun Pondok Rajeg",
      "Stasiun Cibinong",
      "Stasiun Gunung Putri",
      "Stasiun Nambo",
    ],
  },
  {
    name: "Cikarang",
    color: "#3498db",
    stations: [
      "Stasiun Manggarai",
      "Stasiun Jatinegara",
      "Stasiun Klender",
      "Stasiun Buaran",
      "Stasiun Klender Baru",
      "Stasiun Cakung",
      "Stasiun Kranji",
      "Stasiun Bekasi",
      "Stasiun Bekasi Timur",
      "Stasiun Tambun",
      "Stasiun Cibitung",
      "Stasiun Metland Telagamurni",
      "Stasiun Cikarang",
    ],
  },
  {
    name: "Rangkasbitung",
    color: "#2ecc71",
    stations: [
      "Stasiun Tanah Abang",
      "Stasiun Palmerah",
      "Stasiun Kebayoran",
      "Stasiun Pondok Ranji",
      "Stasiun Jurang Mangu",
      "Stasiun Sudimara",
      "Stasiun Rawa Buntu",
      "Stasiun Serpong",
      "Stasiun Cisauk",
      "Stasiun Cicayur",
      "Stasiun Jatake",
      "Stasiun Parung Panjang",
      "Stasiun Cilejit",
      "Stasiun Daru",
      "Stasiun Tenjo",
      "Stasiun Tigaraksa",
      "Stasiun Cikoya",
      "Stasiun Maja",
      "Stasiun Citeras",
      "Stasiun Rangkasbitung",
    ],
  },
  {
    name: "Tangerang",
    color: "#9b59b6",
    stations: [
      "Stasiun Duri",
      "Stasiun Grogol",
      "Stasiun Pesing",
      "Stasiun Taman Kota",
      "Stasiun Bojong Indah",
      "Stasiun Rawa Buaya",
      "Stasiun Kalideres",
      "Stasiun Poris",
      "Stasiun Batu Ceper",
      "Stasiun Tanah Tinggi",
      "Stasiun Tangerang",
    ],
  },
  {
    name: "Tanjung Priok",
    color: "#e67e22",
    stations: [
      "Stasiun Jakarta Kota",
      "Stasiun Ancol",
      "Stasiun Tanjung Priok",
    ],
  },
] as const

function findStation(name: string): Station | undefined {
  return KRL_STATIONS.find((station) => station.name === name)
}

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
        {station.name} · Klik untuk memuat perumahan di wilayah ini
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
  const [terrainEnabled, setTerrainEnabled] = useState(false)
  const [floodLayerEnabled, setFloodLayerEnabled] = useState(false)
  const [floodLayerLoading, setFloodLayerLoading] = useState(false)

  useEffect(() => {
    if (!floodLayerLoading) return
    const timeout = window.setTimeout(() => setFloodLayerLoading(false), 20_000)
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
    <div className="relative overflow-hidden rounded-2xl border bg-muted shadow-sm">
      <MapContainer
        center={JABODETABEK_CENTER}
        zoom={10}
        scrollWheelZoom
        preferCanvas
        className="h-[min(68dvh,680px)] min-h-[430px] w-full"
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
        <LayersControl position="topright">
          <LayersControl.Overlay name="Bahaya Banjir · InaRISK BNPB">
            <FloodHazardLayer
              eventHandlers={{
                add: () => setFloodLayerEnabled(true),
                remove: () => {
                  setFloodLayerEnabled(false)
                  setFloodLayerLoading(false)
                },
                loading: () => setFloodLayerLoading(true),
                load: () => setFloodLayerLoading(false),
              }}
            />
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Perumahan">
            <Pane name="property-points" style={{ zIndex: 650 }}>
              <LayerGroup>
                {mappedProperties.map(({ property, coordinate, markerId }) => {
                  const selected =
                    property.idLokasi === selectedProperty?.idLokasi
                  return (
                    <CircleMarker
                      key={markerId}
                      center={coordinate}
                      radius={selected ? 12 : 9}
                      pathOptions={{
                        color: selected ? "#0f172a" : "#ffffff",
                        fillColor: selected ? "#f97316" : "#059669",
                        fillOpacity: 1,
                        opacity: 1,
                        weight: selected ? 4 : 3,
                      }}
                      eventHandlers={{
                        click: () => onSelectProperty(property),
                      }}
                    >
                      <Popup className="property-map-popup" autoPan>
                        <div className="min-w-48 space-y-1 py-1">
                          <p className="leading-snug font-semibold">
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
                          <button
                            type="button"
                            className="pt-1 text-xs font-semibold text-emerald-700"
                            onClick={() => onSelectProperty(property)}
                          >
                            Lihat detail
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
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Jalur & Stasiun KRL">
            <LayerGroup>
              <Pane name="krl-lines" style={{ zIndex: 430 }}>
                {KRL_LINES.map((line) => {
                  const points = line.stations.flatMap((name) => {
                    const station = findStation(name)
                    return station
                      ? [[station.lat, station.lon] as Coordinate]
                      : []
                  })
                  return (
                    <Polyline
                      key={line.name}
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
          </LayersControl.Overlay>
        </LayersControl>

        <MapController
          selectedProperty={selectedProperty}
          onViewportChange={onViewportChange}
        />
      </MapContainer>

      <button
        type="button"
        onClick={() => setTerrainEnabled((enabled) => !enabled)}
        className="absolute bottom-4 left-4 z-[1000] rounded-lg border bg-background/95 px-3 py-2 text-xs font-semibold shadow-md backdrop-blur hover:bg-muted"
      >
        {terrainEnabled ? "Sembunyikan medan" : "Lihat medan"}
      </button>

      {floodLayerEnabled && (
        <div className="absolute top-28 left-4 z-[1000] w-44 rounded-lg border bg-background/95 p-3 text-[11px] shadow-md backdrop-blur sm:top-4 sm:left-14 sm:w-52">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground">Bahaya banjir</p>
            {floodLayerLoading && (
              <span className="text-muted-foreground">Memuat…</span>
            )}
          </div>
          <div className="mt-2 grid grid-cols-[12px_1fr] items-center gap-x-2 gap-y-1 text-muted-foreground">
            <span className="h-3 w-3 rounded-sm bg-emerald-500/80" />
            <span>Indeks rendah</span>
            <span className="h-3 w-3 rounded-sm bg-amber-400/85" />
            <span>Indeks sedang</span>
            <span className="h-3 w-3 rounded-sm bg-red-500/80" />
            <span>Indeks tinggi</span>
          </div>
          <p className="mt-2 border-t pt-2 leading-relaxed text-muted-foreground">
            Area transparan berarti tidak terpetakan sebagai bahaya, bukan
            jaminan bebas banjir.
          </p>
        </div>
      )}

      <div className="absolute right-4 bottom-4 z-[1000] max-w-64 rounded-lg border bg-background/95 px-3 py-2 text-[11px] shadow-md backdrop-blur">
        <p className="font-semibold text-foreground">
          {loading
            ? "Memuat titik perumahan…"
            : `${mappedProperties.length} titik perumahan`}
        </p>
        {regionLabel && <p className="text-muted-foreground">{regionLabel}</p>}
        {!loading && meta && meta.withoutCoordinates > 0 && (
          <p className="text-muted-foreground">
            {meta.withoutCoordinates} data tanpa koordinat dari Sikumbang
          </p>
        )}
        {error && <p className="text-destructive">{error}</p>}
      </div>
    </div>
  )
}
