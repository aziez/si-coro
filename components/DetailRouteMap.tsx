"use client"

import { useEffect } from "react"
import {
  Circle,
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
} from "react-leaflet"
import { createLayerComponent } from "@react-leaflet/core"
import type { LayerProps } from "@react-leaflet/core"
import { dynamicMapLayer } from "esri-leaflet"
import type { StationRouteCandidate } from "@/app/api/route-krl/route"
import type { KrlRouteSummary } from "@/lib/geoUtils"

const FLOOD_HAZARD_SERVICE =
  "https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir_30/MapServer"

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
    opacity: 0.5,
    pane: "detail-flood-hazard",
    useCors: true,
    attribution: "InaRISK BNPB",
  }),
  context,
}))

interface DetailRouteMapProps {
  propertyName: string
  lat: number
  lon: number
  bestStationRoute?: StationRouteCandidate | null
  alternatives?: StationRouteCandidate[]
  krlRoute?: KrlRouteSummary | null
  isFloodFree?: boolean
}

function FitRouteBounds({
  lat,
  lon,
  bestStationRoute,
}: {
  lat: number
  lon: number
  bestStationRoute?: StationRouteCandidate | null
}) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const refresh = () => map.invalidateSize({ animate: false, pan: false })
    const timer = window.setTimeout(refresh, 120)
    const observer = new ResizeObserver(refresh)
    observer.observe(container)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [map])

  useEffect(() => {
    if (
      bestStationRoute &&
      bestStationRoute.routeCoordinates &&
      bestStationRoute.routeCoordinates.length > 1
    ) {
      map.fitBounds(bestStationRoute.routeCoordinates, {
        padding: [42, 42],
        maxZoom: 14,
      })
    } else {
      map.setView([lat, lon], 14)
    }
  }, [map, lat, lon, bestStationRoute])

  return null
}

export function DetailRouteMap({
  propertyName,
  lat,
  lon,
  bestStationRoute,
  alternatives = [],
  krlRoute,
  isFloodFree = true,
}: DetailRouteMapProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <MapContainer
        center={[lat, lon]}
        zoom={13}
        scrollWheelZoom
        preferCanvas
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Pane name="detail-flood-hazard" style={{ zIndex: 410 }} />
        <Pane name="detail-routes" style={{ zIndex: 460 }} />
        <Pane name="detail-markers" style={{ zIndex: 620 }} />

        <LayersControl position="topright">
          <LayersControl.Overlay checked name="Rute Jalan ke Stasiun (OSRM)">
            <LayerGroup>
              {/* Alternative stations in subtle dashed line */}
              {alternatives.slice(1).map((alt) => (
                <Polyline
                  key={alt.station.name}
                  positions={alt.routeCoordinates}
                  pane="detail-routes"
                  pathOptions={{
                    color: "#64748b",
                    weight: 3,
                    opacity: 0.55,
                    dashArray: "6 6",
                  }}
                >
                  <Tooltip sticky>
                    {`Alternatif ke ${alt.station.name}: ${alt.roadDistanceKm} km (~${alt.roadDurationMinutes} mnt)`}
                  </Tooltip>
                </Polyline>
              ))}

              {/* Primary OSRM driving route */}
              {bestStationRoute && (
                <Polyline
                  positions={bestStationRoute.routeCoordinates}
                  pane="detail-routes"
                  pathOptions={{
                    color: "#2563eb",
                    weight: 5,
                    opacity: 0.9,
                  }}
                >
                  <Tooltip sticky>
                    {`Rute Jalan Raya (${bestStationRoute.source.toUpperCase()}): ${bestStationRoute.roadDistanceKm} km · ~${bestStationRoute.roadDurationMinutes} menit`}
                  </Tooltip>
                </Polyline>
              )}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Jalur Rel KRL ke Kantor">
            <LayerGroup>
              {krlRoute && krlRoute.pathCoordinates.length > 1 && (
                <Polyline
                  positions={krlRoute.pathCoordinates}
                  pane="detail-routes"
                  pathOptions={{
                    color: "#ea580c",
                    weight: 4,
                    opacity: 0.85,
                    dashArray: "10 6",
                  }}
                >
                  <Tooltip sticky>
                    {`Rute KRL (${krlRoute.fromStation} → ${krlRoute.toStation}): ${krlRoute.railDistanceKm} km · Rp${krlRoute.fareOneWay.toLocaleString("id-ID")}`}
                  </Tooltip>
                </Polyline>
              )}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Radius Audit Banjir 250m">
            <LayerGroup>
              <Circle
                center={[lat, lon]}
                radius={250}
                pathOptions={{
                  color: isFloodFree ? "#10b981" : "#ef4444",
                  fillColor: isFloodFree ? "#10b981" : "#ef4444",
                  fillOpacity: 0.14,
                  weight: 2,
                  dashArray: "4 4",
                }}
              >
                <Tooltip direction="bottom">
                  Zona Audit Multi-Point Banjir & Elevasi (Radius 250m)
                </Tooltip>
              </Circle>
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay name="Layer Bahaya Banjir BNPB">
            <FloodHazardLayer />
          </LayersControl.Overlay>
        </LayersControl>

        {/* Candidate KRL Station Markers */}
        {alternatives.map((cand, idx) => {
          const isBest = idx === 0
          return (
            <CircleMarker
              key={cand.station.name}
              center={[cand.station.lat, cand.station.lon]}
              radius={isBest ? 9 : 6}
              pane="detail-markers"
              pathOptions={{
                color: "#0f172a",
                fillColor: isBest ? "#f97316" : "#94a3b8",
                fillOpacity: 1,
                weight: isBest ? 3 : 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} permanent={isBest}>
                {`${cand.station.name} (${cand.roadDistanceKm} km)`}
              </Tooltip>
              <Popup>
                <div className="space-y-1 text-xs">
                  <p className="font-bold">{cand.station.name}</p>
                  <p>
                    Jarak jalan raya:{" "}
                    <strong>{cand.roadDistanceKm} km</strong> (~
                    {cand.roadDurationMinutes} mnt)
                  </p>
                  <p className="text-slate-500">
                    Jarak garis lurus (Haversine): {cand.straightDistanceKm} km
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}

        {/* Property Marker */}
        <CircleMarker
          center={[lat, lon]}
          radius={10}
          pane="detail-markers"
          pathOptions={{
            color: "#ffffff",
            fillColor: "#059669",
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} permanent>
            {propertyName}
          </Tooltip>
        </CircleMarker>

        <FitRouteBounds
          lat={lat}
          lon={lon}
          bestStationRoute={bestStationRoute}
        />
      </MapContainer>

      {/* Bottom Legend Overlay */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-3 rounded-xl border bg-background/95 px-3 py-2 text-[11px] shadow-md backdrop-blur">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Lokasi Perumahan
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="h-1 w-4 rounded bg-blue-600" />
          Rute Jalan OSRM
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          Stasiun KRL Terdekat
        </span>
      </div>
    </div>
  )
}
