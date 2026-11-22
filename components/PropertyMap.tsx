"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import L from "leaflet"
import {
  Circle,
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
import { dynamicMapLayer } from "esri-leaflet"
import { useTheme } from "next-themes"
import {
  Drop,
  Mountains,
  Train,
  MapPin,
  ArrowSquareOut,
  ShieldCheck,
  Compass,
  X,
} from "@phosphor-icons/react"
import type { Perumahan } from "@/components/HouseCard"
import {
  KRL_LINES_NETWORK,
  KRL_STATIONS,
  getNearestStation,
  isWithinKrlService,
  type KrlLineDefinition,
  type KrlLineId,
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
  hoveredProperty?: Perumahan | null
  onSelectProperty: (property: Perumahan) => void
  onViewportChange?: (
    center: Coordinate,
    options?: { immediate?: boolean }
  ) => void
  loading?: boolean
  error?: string
  regionLabel?: string
  meta?: MapSearchMeta
  floodEnabled?: boolean
  onFloodEnabledChange?: (enabled: boolean) => void
  initialActiveLine?: KrlLineId | "all"
}

const JABODETABEK_CENTER: Coordinate = [-6.35, 106.82]
const FLOOD_HAZARD_SERVICE =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir_30/MapServer"

const TERMINUS_CODES = new Set([
  "BOO",
  "NMO",
  "CKR",
  "RK",
  "TNG",
  "TPK",
  "JAKK",
])

const LINE_COLOR_MAP = new Map<KrlLineId, string>(
  KRL_LINES_NETWORK.map((line) => [line.id, line.color])
)

const LINE_META_MAP = new Map<KrlLineId, KrlLineDefinition>(
  KRL_LINES_NETWORK.map((line) => [line.id, line])
)

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n)

function FloodHazardLayer({
  onLoading,
  onLoad,
}: {
  onLoading?: () => void
  onLoad?: () => void
}) {
  const map = useMap()

  useEffect(() => {
    const layer = dynamicMapLayer({
      url: FLOOD_HAZARD_SERVICE,
      layers: [0],
      format: "png32",
      transparent: true,
      opacity: 0.48,
      pane: "flood-hazard",
      useCors: true,
      attribution: "InaRISK BNPB",
    })

    if (onLoading) layer.on("loading", onLoading)
    if (onLoad) layer.on("load", onLoad)
    layer.addTo(map)

    return () => {
      if (onLoading) layer.off("loading", onLoading)
      if (onLoad) layer.off("load", onLoad)
      map.removeLayer(layer)
    }
  }, [map, onLoading, onLoad])

  return null
}

function MapController({
  selectedProperty,
  activeLine,
  onViewportChange,
  onZoomChange,
}: Pick<PropertyMapProps, "selectedProperty" | "onViewportChange"> & {
  activeLine: KrlLineId | "all"
  onZoomChange: (zoom: number) => void
}) {
  const map = useMap()
  const skipNextMoveRef = useRef(false)
  const lastSelectedIdRef = useRef("")
  const lastActiveLineRef = useRef<KrlLineId | "all">("all")

  const reportViewport = useCallback(() => {
    if (skipNextMoveRef.current) {
      skipNextMoveRef.current = false
      return
    }
    const center = map.getCenter()
    onViewportChange?.([center.lat, center.lng])
  }, [map, onViewportChange])

  useMapEvents({
    moveend: reportViewport,
    zoomend: () => onZoomChange(map.getZoom()),
  })

  useEffect(() => {
    onZoomChange(map.getZoom())
  }, [map, onZoomChange])

  useEffect(() => {
    const timer = window.setTimeout(reportViewport, 180)
    return () => window.clearTimeout(timer)
  }, [reportViewport])

  // Close open Leaflet popups whenever the detail modal opens so nothing lingers
  useEffect(() => {
    if (selectedProperty) {
      map.closePopup()
    }
  }, [map, selectedProperty])

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
    map.flyTo(point, Math.max(map.getZoom(), 14), { duration: 0.5 })
  }, [map, selectedProperty])

  // Smoothly fit bounds when user picks a specific KRL line pill
  useEffect(() => {
    if (activeLine === lastActiveLineRef.current) return
    lastActiveLineRef.current = activeLine
    if (activeLine === "all") {
      skipNextMoveRef.current = true
      map.flyTo(JABODETABEK_CENTER, 10, { duration: 0.55 })
      return
    }
    const line = LINE_META_MAP.get(activeLine)
    if (line && line.trackCoordinates.length > 1) {
      skipNextMoveRef.current = true
      map.flyToBounds(line.trackCoordinates, {
        padding: [48, 48],
        maxZoom: 13,
        duration: 0.55,
      })
    }
  }, [map, activeLine])

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

function PropertyMarkerItem({
  property,
  coordinate,
  isSelected,
  isPreviewed,
  onPreview,
  onOpenDetail,
}: {
  property: Perumahan
  coordinate: Coordinate
  isSelected: boolean
  isPreviewed: boolean
  onPreview: (property: Perumahan | null) => void
  onOpenDetail: (property: Perumahan) => void
}) {
  const map = useMap()
  const hargaMulai = property.tipeRumah?.length
    ? Math.min(...property.tipeRumah.map((t) => t.harga))
    : 0
  const hasSubsidi = property.tipeRumah?.some((t) => t.status === "subsidi")

  const nearestInfo = useMemo(() => {
    const nearest = getNearestStation(coordinate[0], coordinate[1])
    return isWithinKrlService(nearest.distance) ? nearest : null
  }, [coordinate])

  const active = isSelected || isPreviewed

  return (
    <CircleMarker
      center={coordinate}
      radius={active ? 11.5 : 8}
      pathOptions={{
        color: active ? "#0f172a" : "#ffffff",
        fillColor: active ? "#f97316" : hasSubsidi ? "#059669" : "#2563eb",
        fillOpacity: 1,
        opacity: 1,
        weight: active ? 3.5 : 2.5,
      }}
      eventHandlers={{
        click: () => {
          onPreview(property)
        },
        popupclose: () => {
          if (isPreviewed) onPreview(null)
        },
      }}
    >
      <Popup className="property-map-popup" autoPan maxWidth={280}>
        <div className="min-w-56 space-y-2 py-0.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white",
                  hasSubsidi ? "bg-emerald-600" : "bg-blue-600"
                )}
              >
                {hasSubsidi ? "SUBSIDI" : "KOMERSIL"}
              </span>
              {property.jumlahUnit > 0 && (
                <span className="text-[10.5px] font-bold text-emerald-700">
                  Sisa {property.jumlahUnit} unit
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm leading-snug font-extrabold text-slate-900">
              {property.namaPerumahan}
            </p>
            <p className="mt-0.5 text-[11.5px] text-slate-600">
              {[property.wilayah?.kecamatan, property.wilayah?.kabupaten]
                .filter(Boolean)
                .join(", ") || "Lokasi tersedia"}
            </p>
          </div>

          {nearestInfo && (
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
              <Train
                weight="fill"
                className="h-3.5 w-3.5 shrink-0 text-emerald-600"
              />
              <span className="truncate">
                {nearestInfo.distance.toFixed(1)} km ke{" "}
                {nearestInfo.station.name.replace("Stasiun ", "St. ")}
              </span>
            </div>
          )}

          {hargaMulai > 0 && (
            <p className="text-sm font-black text-emerald-700">
              Mulai {formatRupiah(hargaMulai)}
            </p>
          )}

          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-center text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-[0.98]"
              onClick={(e) => {
                e.stopPropagation()
                map.closePopup()
                onPreview(null)
                onOpenDetail(property)
              }}
            >
              <ShieldCheck weight="fill" className="h-3.5 w-3.5" />
              Cek Isi Rumah &amp; Risiko
            </button>
            <Link
              href={`/perumahan/${property.idLokasi}`}
              onClick={() => map.closePopup()}
              title="Buka halaman detail penuh"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </Popup>
      <Tooltip direction="top" offset={[0, -8]}>
        <span className="font-bold">{property.namaPerumahan}</span>
      </Tooltip>
    </CircleMarker>
  )
}

function KrlStationMarker({
  station,
  isSelectedStation,
  activeLine,
  onSelectStation,
  onViewportChange,
}: {
  station: Station
  isSelectedStation: boolean
  activeLine: KrlLineId | "all"
  onSelectStation: (station: Station) => void
  onViewportChange?: PropertyMapProps["onViewportChange"]
}) {
  const map = useMap()
  const primaryColor = LINE_COLOR_MAP.get(station.lines[0]) ?? "#0f172a"
  const isInterchange = Boolean(station.isInterchange)
  const isTerminus = TERMINUS_CODES.has(station.code)
  const isDimmed =
    activeLine !== "all" && !station.lines.includes(activeLine)

  const lineNames = station.lines
    .map((id) => LINE_META_MAP.get(id)?.shortName)
    .filter(Boolean)
    .join(" · ")

  return (
    <CircleMarker
      center={[station.lat, station.lon]}
      radius={
        isSelectedStation
          ? 8.5
          : isInterchange
            ? 7
            : isTerminus
              ? 6
              : 4.5
      }
      pathOptions={{
        color: isInterchange ? "#0f172a" : primaryColor,
        fillColor: isSelectedStation
          ? primaryColor
          : isInterchange
            ? "#ffffff"
            : "#ffffff",
        fillOpacity: isDimmed ? 0.25 : 1,
        opacity: isDimmed ? 0.25 : 1,
        weight: isSelectedStation ? 3.5 : isInterchange ? 3 : 2.2,
      }}
      eventHandlers={{
        click: () => {
          onSelectStation(station)
          onViewportChange?.([station.lat, station.lon], { immediate: true })
          map.flyTo([station.lat, station.lon], Math.max(map.getZoom(), 13), {
            duration: 0.5,
          })
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -6]}>
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block rounded px-1 py-0.2 text-[9px] font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {station.code}
            </span>
            <span className="font-extrabold text-slate-900">
              {station.name}
            </span>
            {isInterchange && (
              <span className="rounded bg-amber-100 px-1 text-[9px] font-bold text-amber-800">
                Transit
              </span>
            )}
          </div>
          <p className="text-[10.5px] text-slate-500">
            Lin {lineNames} · Klik untuk cari rumah di sekitar
          </p>
        </div>
      </Tooltip>
    </CircleMarker>
  )
}

function KrlTrackLayers({
  activeLine,
  hoveredLine,
  onSelectLine,
  onHoverLine,
  isDark,
}: {
  activeLine: KrlLineId | "all"
  hoveredLine: KrlLineId | null
  onSelectLine: (id: KrlLineId) => void
  onHoverLine: (id: KrlLineId | null) => void
  isDark: boolean
}) {
  // Dedicated SVG renderer so smooth CSS dash-flow animations work cleanly on KRL lines
  const svgRenderer = useMemo(() => L.svg({ padding: 0.5 }), [])

  return (
    <Pane name="krl-lines" style={{ zIndex: 430 }}>
      {KRL_LINES_NETWORK.map((line) => {
        const isFocused =
          activeLine === "all"
            ? hoveredLine === null || hoveredLine === line.id
            : activeLine === line.id
        const isHighlighted =
          activeLine === line.id || hoveredLine === line.id

        return (
          <LayerGroup key={line.id}>
            {/* Crisp map-style outer casing halo */}
            <Polyline
              positions={line.trackCoordinates}
              renderer={svgRenderer}
              interactive={false}
              pathOptions={{
                color: isDark ? "#0f172a" : "#ffffff",
                weight: isHighlighted ? 8.5 : 6.5,
                opacity: isFocused ? 0.92 : 0.25,
                lineCap: "round",
                lineJoin: "round",
              }}
            />

            {/* Main official KAI Commuter colored rail line */}
            <Polyline
              positions={line.trackCoordinates}
              renderer={svgRenderer}
              pathOptions={{
                color: line.color,
                weight: isHighlighted ? 5 : 3.6,
                opacity: isFocused ? 0.96 : 0.24,
                lineCap: "round",
                lineJoin: "round",
              }}
              eventHandlers={{
                click: () => onSelectLine(line.id),
                mouseover: () => onHoverLine(line.id),
                mouseout: () => onHoverLine(null),
              }}
            >
              <Tooltip sticky>
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: line.color }}
                  />
                  <span className="font-extrabold text-slate-900">
                    {line.name}
                  </span>
                  <span className="text-slate-500">· {line.corridor}</span>
                </div>
              </Tooltip>
            </Polyline>

            {/* Subtle animated commuter pulse along focused line */}
            {isHighlighted && (
              <Polyline
                positions={line.trackCoordinates}
                renderer={svgRenderer}
                interactive={false}
                pathOptions={{
                  color: "#ffffff",
                  weight: 2,
                  opacity: 0.85,
                  dashArray: "8 18",
                  className: "krl-track-flow",
                }}
              />
            )}
          </LayerGroup>
        )
      })}
    </Pane>
  )
}

function ActiveConnectorOverlay({
  property,
  coordinate,
}: {
  property: Perumahan
  coordinate: Coordinate
}) {
  const svgRenderer = useMemo(() => L.svg({ padding: 0.5 }), [])
  const nearest = useMemo(() => {
    const res = getNearestStation(coordinate[0], coordinate[1])
    return isWithinKrlService(res.distance) ? res : null
  }, [coordinate])

  return (
    <Pane name="active-preview-overlay" style={{ zIndex: 620 }}>
      {/* 250m InaRISK Flood Audit Preview Ring */}
      <Circle
        center={coordinate}
        radius={250}
        renderer={svgRenderer}
        interactive={false}
        pathOptions={{
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.16,
          weight: 2,
          dashArray: "5 5",
          className: "krl-track-flow",
        }}
      />

      {/* Animated line connecting property to nearest KRL station */}
      {nearest && (
        <Polyline
          positions={[
            coordinate,
            [nearest.station.lat, nearest.station.lon],
          ]}
          renderer={svgRenderer}
          interactive={false}
          pathOptions={{
            color: "#f97316",
            weight: 3,
            opacity: 0.9,
            dashArray: "7 7",
            className: "krl-track-flow",
          }}
        >
          <Tooltip permanent direction="center">
            <span className="text-[10.5px] font-bold text-slate-900">
              {property.namaPerumahan} →{" "}
              {nearest.station.name.replace("Stasiun ", "St. ")} (
              {nearest.distance.toFixed(1)} km)
            </span>
          </Tooltip>
        </Polyline>
      )}
    </Pane>
  )
}

export function PropertyMap({
  properties,
  selectedProperty,
  hoveredProperty,
  onSelectProperty,
  onViewportChange,
  loading = false,
  error = "",
  regionLabel = "",
  floodEnabled: controlledFloodEnabled,
  onFloodEnabledChange,
  initialActiveLine = "all",
}: PropertyMapProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [krlEnabled, setKrlEnabled] = useState(true)
  const [activeLine, setActiveLine] = useState<KrlLineId | "all">(
    initialActiveLine
  )
  const [hoveredLine, setHoveredLine] = useState<KrlLineId | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [previewProperty, setPreviewProperty] = useState<Perumahan | null>(null)
  const [mapZoom, setMapZoom] = useState(10)
  const [basemap, setBasemap] = useState<"modern" | "osm">("modern")
  const [terrainEnabled, setTerrainEnabled] = useState(false)
  const [internalFloodEnabled, setInternalFloodEnabled] = useState(false)
  const [floodLayerLoading, setFloodLayerLoading] = useState(false)

  const floodLayerEnabled = controlledFloodEnabled ?? internalFloodEnabled
  const toggleFloodLayer = () => {
    const next = !floodLayerEnabled
    if (onFloodEnabledChange) {
      onFloodEnabledChange(next)
    } else {
      setInternalFloodEnabled(next)
    }
    setFloodLayerLoading(next)
  }

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

  // Show interchange + terminus hubs at city-wide zoom, reveal all 84 stations when zoomed in or line focused
  const visibleStations = useMemo(() => {
    return KRL_STATIONS.filter((st) => {
      if (activeLine !== "all") return st.lines.includes(activeLine)
      if (mapZoom >= 11) return true
      return Boolean(st.isInterchange) || TERMINUS_CODES.has(st.code)
    })
  }, [activeLine, mapZoom])

  const activeFocusProperty = hoveredProperty ?? previewProperty
  const activeFocusCoord = useMemo(
    () => parsePropertyCoordinate(activeFocusProperty?.koordinatPerumahan),
    [activeFocusProperty]
  )

  const handleFloodLoading = useCallback(() => setFloodLayerLoading(true), [])
  const handleFloodLoad = useCallback(() => setFloodLayerLoading(false), [])

  const activeLineMeta =
    activeLine === "all" ? null : LINE_META_MAP.get(activeLine) ?? null

  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  return (
    /* isolate + z-0 traps ALL Leaflet internal panes (z-index 400..1301) inside this card so modals & header ALWAYS stay on top! */
    <div
      className={cn(
        "isolate relative z-0 overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-lg",
        basemap === "modern" &&
          (isDark ? "si-coro-map-dark" : "si-coro-map-clean")
      )}
    >
      {/* Top Touch-Friendly Layer Controls Strip */}
      <div className="pointer-events-none absolute top-3 right-3 left-14 z-[1000] flex flex-col gap-2">
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setKrlEnabled((v) => !v)}
            className={cn(
              "pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all active:scale-95",
              krlEnabled
                ? "border-emerald-500/50 bg-emerald-600 text-white"
                : "border-border bg-background/95 text-foreground hover:bg-muted"
            )}
          >
            <Train weight="fill" className="h-3.5 w-3.5" />
            Jalur KRL Asli
          </button>

          <button
            type="button"
            onClick={toggleFloodLayer}
            className={cn(
              "pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all active:scale-95",
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
              "pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md transition-all active:scale-95",
              terrainEnabled
                ? "border-blue-500/50 bg-blue-600 text-white"
                : "border-border bg-background/95 text-foreground hover:bg-muted"
            )}
          >
            <Mountains weight="fill" className="h-3.5 w-3.5" />
            Kontur Medan
          </button>

          <button
            type="button"
            onClick={() =>
              setBasemap((b) => (b === "modern" ? "osm" : "modern"))
            }
            className="pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-md backdrop-blur-md transition-all hover:bg-muted active:scale-95"
            title="Ganti gaya peta dasar"
          >
            <Compass weight="duotone" className="h-3.5 w-3.5 text-primary" />
            {basemap === "modern" ? "Peta Modern" : "Peta OSM"}
          </button>
        </div>

        {/* Interactive KRL Corridor Filter Bar */}
        {krlEnabled && (
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => {
                setActiveLine("all")
                setSelectedStation(null)
              }}
              className={cn(
                "pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-md transition-all active:scale-95",
                activeLine === "all"
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-border/80 bg-background/90 text-foreground hover:bg-background"
              )}
            >
              Semua Lin
            </button>

            {KRL_LINES_NETWORK.map((line) => {
              const isActive = activeLine === line.id
              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => {
                    setActiveLine((prev) =>
                      prev === line.id ? "all" : line.id
                    )
                    setSelectedStation(null)
                  }}
                  onMouseEnter={() => setHoveredLine(line.id)}
                  onMouseLeave={() => setHoveredLine(null)}
                  className={cn(
                    "pointer-events-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur-md transition-all active:scale-95",
                    isActive
                      ? "border-transparent text-white shadow-md"
                      : "border-border/80 bg-background/90 text-foreground hover:bg-background"
                  )}
                  style={
                    isActive
                      ? { backgroundColor: line.color }
                      : undefined
                  }
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isActive && "ring-2 ring-white/80"
                    )}
                    style={{
                      backgroundColor: isActive ? "#ffffff" : line.color,
                    }}
                  />
                  {line.shortName}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <MapContainer
        center={JABODETABEK_CENTER}
        zoom={10}
        scrollWheelZoom
        preferCanvas
        className="h-[min(68dvh,660px)] min-h-[440px] w-full"
        aria-label="Peta perumahan dan jaringan KRL Commuter Line akurat"
      >
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        {terrainEnabled && (
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a>'
            opacity={0.55}
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        )}

        <Pane name="flood-hazard" style={{ zIndex: 420 }} />
        {floodLayerEnabled && (
          <FloodHazardLayer
            onLoading={handleFloodLoading}
            onLoad={handleFloodLoad}
          />
        )}

        {krlEnabled && (
          <LayerGroup>
            <KrlTrackLayers
              activeLine={activeLine}
              hoveredLine={hoveredLine}
              onSelectLine={(id) =>
                setActiveLine((prev) => (prev === id ? "all" : id))
              }
              onHoverLine={setHoveredLine}
              isDark={isDark}
            />

            <Pane name="krl-stations" style={{ zIndex: 610 }}>
              {visibleStations.map((station) => (
                <KrlStationMarker
                  key={station.name}
                  station={station}
                  isSelectedStation={selectedStation?.name === station.name}
                  activeLine={activeLine}
                  onSelectStation={setSelectedStation}
                  onViewportChange={onViewportChange}
                />
              ))}
            </Pane>
          </LayerGroup>
        )}

        {activeFocusProperty && activeFocusCoord && (
          <ActiveConnectorOverlay
            property={activeFocusProperty}
            coordinate={activeFocusCoord}
          />
        )}

        <Pane name="property-points" style={{ zIndex: 650 }}>
          <LayerGroup>
            {mappedProperties.map(({ property, coordinate, markerId }) => (
              <PropertyMarkerItem
                key={markerId}
                property={property}
                coordinate={coordinate}
                isSelected={property.idLokasi === selectedProperty?.idLokasi}
                isPreviewed={
                  property.idLokasi === activeFocusProperty?.idLokasi
                }
                onPreview={setPreviewProperty}
                onOpenDetail={onSelectProperty}
              />
            ))}
          </LayerGroup>
        </Pane>

        <MapController
          selectedProperty={selectedProperty}
          activeLine={activeLine}
          onViewportChange={onViewportChange}
          onZoomChange={setMapZoom}
        />
      </MapContainer>

      {/* Active KRL Corridor Info Pill */}
      {krlEnabled && (activeLineMeta || selectedStation) && (
        <div className="absolute right-3 bottom-14 z-[1000] max-w-xs rounded-xl border border-border/80 bg-background/95 p-2.5 text-[11px] shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              {selectedStation ? (
                <>
                  <p className="font-extrabold text-foreground">
                    {selectedStation.name} ({selectedStation.code})
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">
                    Memuat perumahan di radius sekitar stasiun ini.
                  </p>
                </>
              ) : activeLineMeta ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: activeLineMeta.color }}
                    />
                    <p className="font-extrabold text-foreground">
                      {activeLineMeta.name}
                    </p>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground">
                    {activeLineMeta.corridor} ·{" "}
                    {activeLineMeta.stations.length} stasiun aktif
                  </p>
                </>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Reset pilihan jalur KRL"
              onClick={() => {
                setActiveLine("all")
                setSelectedStation(null)
              }}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X weight="bold" className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Flood Legend Card */}
      {floodLayerEnabled && (
        <div className="absolute top-24 left-3 z-[1000] w-48 rounded-xl border bg-background/95 p-3 text-[11px] shadow-lg backdrop-blur-md sm:left-14 sm:w-56">
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
            Sumber: InaRISK BNPB. Klik titik rumah lalu &quot;Cek Isi Rumah
            &amp; Risiko&quot; untuk audit 5-titik radius 250m.
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
            <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-white dark:border-slate-200" />
            Transit KRL
          </span>
          {krlEnabled && mapZoom < 11 && activeLine === "all" && (
            <span className="hidden text-[10px] text-muted-foreground md:inline">
              · Zoom in untuk lihat semua 84 stasiun
            </span>
          )}
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
