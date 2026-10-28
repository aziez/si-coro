"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Buildings, Bed, Bathtub, ArrowsOut,
  Phone, EnvelopeSimple, MapTrifold, CaretLeft, CaretRight,
  ShieldCheck, Heart, Train, Eye, Compass, ArrowSquareOut,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import {
  calculateKrlRoute,
  getDistanceToJakarta,
  getNearestStation,
} from "@/lib/geoUtils";
import type { StationRouteCandidate } from "@/app/api/route-krl/route";
import {
  ClimateAgunanScoreCard,
  type FloodElevationData,
} from "@/components/ClimateAgunanScoreCard";
import KprCalculator from "@/components/KprCalculator";
import ShareButton from "@/components/ShareButton";

const DetailRouteMap = dynamic(
  () =>
    import("@/components/DetailRouteMap").then(
      (module) => module.DetailRouteMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-2xl bg-muted" />
    ),
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface DetailData {
  namaPerumahan: string;
  namaPengembang: string;
  npwpPengembang: string;
  jenisPerumahan: number;
  alamat: string;
  idLokasi: string;
  siteplan: string;
  foto: string[];
  koordinat: { lat: number; lon: number };
  koordinatPerumahan?: string | null;
  kantorPemasaran: {
    alamat: string;
    nomor: string;
    noTelp: string;
    email: string;
    website: string;
  }[];
}

interface TipeRumah {
  id: number;
  idLokasi: number;
  status: string;
  nama: string;
  harga: number;
  kamarTidur: number;
  kamarMandi: number;
  fotoTampak: string;
  fotoDenah: string;
  jumlahLantai: number;
  luasTanah: number;
  luasBangunan: number;
  spesifikasiAtap: string;
  spesifikasiDinding: string;
  spesifikasiLantai: string;
  spesifikasiPondasi: string;
}

interface BangunanItem {
  id: number;
  tipeBangunan: string;
  status: string;
  nomor: string;
  tipe: TipeRumah;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://sikumbang.tapera.go.id${url.startsWith("/") ? "" : "/"}${url}`;
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 glass-header border-b border-border/50 h-14" />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-[50vh] w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DetailPerumahanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: propertyId } = React.use(params);

  const [data, setData] = useState<{ detail: DetailData; bangunan: BangunanItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [floodData, setFloodData] = useState<FloodElevationData | null>(null);
  const [geoData, setGeoData] = useState<{
    distanceToJakarta: number;
    nearestStation: { station: { name: string; lat: number; lon: number }; distance: number };
  } | null>(null);
  const [stationRoutes, setStationRoutes] = useState<{
    bestStation: StationRouteCandidate | null;
    alternatives: StationRouteCandidate[];
  }>({ bestStation: null, alternatives: [] });
  const [workStation, setWorkStation] = useState("Stasiun Sudirman");
  const [showcaseTab, setShowcaseTab] = useState<string>("live-siteplan");
  const [chellData, setChellData] = useState<{
    isDemoFallback: boolean;
    chellTourBaseUrl: string;
    project: {
      id: string;
      slug: string;
      name: string;
      description?: string | null;
      hubUrl: string;
      primarySiteplan?: {
        id: string;
        slug: string;
        name: string;
        embedUrl: string;
        fullUrl: string;
      } | null;
      primaryTour?: {
        id: string;
        slug: string;
        name: string;
        url: string;
      } | null;
      unitTypes?: {
        id: string;
        name: string;
        price: number | null;
        landArea: number | null;
        buildingArea: number | null;
      }[];
    };
  } | null>(null);

  const { toggleFavorite, isFavorite } = useFavorites();

  // ─── Data fetch ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`https://sikumbang.tapera.go.id/lokasi-perumahan/${propertyId}/json`);
        const json = await res.json();
        if (json.error) { setError(json.message || "Data tidak ditemukan"); return; }
        setData(json);

        // Fetch Chell-Tour Integration for Interactive Siteplan & 360 Tour
        fetch(`/api/chell-tour/${propertyId}`)
          .then(r => r.json())
          .then(d => {
            if (d.success && d.project) {
              setChellData({
                isDemoFallback: Boolean(d.isDemoFallback),
                chellTourBaseUrl: d.chellTourBaseUrl || "http://localhost:3001",
                project: d.project,
              });
            }
          })
          .catch(console.error);

        // Resolve coordinates
        let lat: number | undefined, lon: number | undefined;
        if (json.detail?.koordinat?.lat !== undefined) {
          lat = parseFloat(json.detail.koordinat.lat);
          lon = parseFloat(json.detail.koordinat.lon);
        } else if (json.detail?.koordinatPerumahan) {
          const [a, b] = String(json.detail.koordinatPerumahan).split(",");
          lat = parseFloat(a?.trim());
          lon = parseFloat(b?.trim());
        }

        if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
          const nearestFallback = getNearestStation(lat, lon);
          setGeoData({
            distanceToJakarta: getDistanceToJakarta(lat, lon),
            nearestStation: nearestFallback,
          });

          // Provide immediate fallback before OSRM resolves
          const immediateCandidate: StationRouteCandidate = {
            station: nearestFallback.station,
            straightDistanceKm: Number(nearestFallback.distance.toFixed(2)),
            roadDistanceKm: Number((nearestFallback.distance * 1.32).toFixed(2)),
            roadDurationMinutes: Math.max(3, Math.round(((nearestFallback.distance * 1.32) / 26) * 60)),
            routeCoordinates: [
              [lat, lon],
              [nearestFallback.station.lat, nearestFallback.station.lon],
            ],
            source: "estimated",
          };
          setStationRoutes({
            bestStation: immediateCandidate,
            alternatives: [immediateCandidate],
          });

          // 1. Fetch actual OSRM road route to top 3 nearest KRL stations
          fetch(`/api/route-krl?lat=${lat}&lon=${lon}`)
            .then(r => r.json())
            .then(d => {
              if (d.success && d.bestStation) {
                setStationRoutes({
                  bestStation: d.bestStation,
                  alternatives: d.alternatives ?? [d.bestStation],
                });
              }
            })
            .catch(console.error);

          // 2. Fetch 5-point InaRISK flood buffer + Open-Meteo DEM elevation
          fetch(`/api/inarisk?lat=${lat}&lon=${lon}`)
            .then(r => r.json())
            .then(d => {
              if (d.success) {
                setFloodData({
                  riskLevel: d.riskLevel,
                  centerRiskLevel: d.centerRiskLevel,
                  pixelValue: d.pixelValue,
                  maxSurroundingPixelValue: d.maxSurroundingPixelValue,
                  affectedSurroundingCount: d.affectedSurroundingCount,
                  sampleCount: d.sampleCount,
                  bufferWarning: d.bufferWarning,
                  isFloodFree: d.isFloodFree,
                  elevation: d.elevation,
                });
              }
            })
            .catch(console.error);
        }
      } catch {
        setError("Gagal mengambil data perumahan.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propertyId]);

  const activeKrlRoute = useMemo(() => {
    const fromSt = stationRoutes.bestStation?.station.name;
    if (!fromSt) return null;
    return calculateKrlRoute(fromSt, workStation);
  }, [stationRoutes.bestStation, workStation]);

  // ─── States ──────────────────────────────────────────────────────────────

  if (loading) return <DetailPageSkeleton />;

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <Buildings className="w-20 h-20 text-muted-foreground/25" />
        <div>
          <h1 className="text-2xl font-bold mb-1">Properti Tidak Ditemukan</h1>
          <p className="text-muted-foreground">{error || "Data perumahan tidak ditemukan."}</p>
        </div>
        <Button onClick={() => router.back()} variant="outline" className="rounded-full">
          <ArrowLeft className="mr-2 w-4 h-4" /> Kembali
        </Button>
      </div>
    );
  }

  const { detail, bangunan } = data;
  const uniqueTipe = Array.from(new Map(bangunan.map(b => [b.tipe.id, b.tipe])).values());
  const allImages = detail.foto?.length > 0 ? detail.foto : [];

  let mapLat = "", mapLon = "";
  if (detail.koordinat?.lat) {
    mapLat = String(detail.koordinat.lat);
    mapLon = String(detail.koordinat.lon);
  } else if (detail.koordinatPerumahan) {
    const [a, b] = detail.koordinatPerumahan.split(",");
    mapLat = a?.trim() ?? "";
    mapLon = b?.trim() ?? "";
  }
  const hasCoordinates = Boolean(mapLat && mapLon);

  const mappedForFavorite: any = {
    idLokasi: detail.idLokasi,
    namaPerumahan: detail.namaPerumahan,
    pengembang: { nama: detail.namaPengembang },
    jenisPerumahan: detail.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun",
    wilayah: { kecamatan: detail.alamat, provinsi: "", kabupaten: "", kelurahan: "" },
    foto: detail.foto,
    koordinatPerumahan: `${detail.koordinat?.lat},${detail.koordinat?.lon}`,
    jumlahUnit: 0, jumlahUnitKomersil: 0, tipeRumah: [],
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky nav */}
      <div className="sticky top-0 z-50 glass-header border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" className="rounded-full shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali
          </Button>
          <p className="font-semibold text-sm truncate text-center">{detail.namaPerumahan}</p>
          <div className="w-20 flex justify-end">
            <button
              onClick={() => toggleFavorite(mappedForFavorite)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors",
                isFavorite(detail.idLokasi)
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Heart weight={isFavorite(detail.idLokasi) ? "fill" : "regular"} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isFavorite(detail.idLokasi) ? "Tersimpan" : "Simpan"}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">

        {/* ── Hero Gallery ──────────────────────────────────────── */}
        <section className="relative w-full h-[40vh] md:h-[58vh] rounded-2xl overflow-hidden bg-muted flex items-center justify-center group shadow-xl">
          {allImages[0] ? (
            <Image
              src={getImageUrl(allImages[currentHeroImage])}
              alt={`${detail.namaPerumahan} foto ${currentHeroImage + 1}`}
              fill className="object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : null}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40"
            style={{ display: allImages[0] ? "none" : "flex" }}>
            <Buildings weight="duotone" className="w-16 h-16 mb-2" />
            <span className="font-medium">Foto tidak tersedia</span>
          </div>

          {allImages.length > 1 && (
            <>
              <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setCurrentHeroImage(p => p === 0 ? allImages.length - 1 : p - 1)}
                  className="bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all">
                  <CaretLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentHeroImage(p => (p + 1) % allImages.length)}
                  className="bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all">
                  <CaretRight className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {allImages.map((_, i) => (
                  <button key={i} onClick={() => setCurrentHeroImage(i)}
                    className={cn("h-1.5 rounded-full transition-all shadow-md", i === currentHeroImage ? "bg-white w-6" : "bg-white/50 w-1.5 hover:bg-white/80")} />
                ))}
              </div>
            </>
          )}

          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {currentHeroImage + 1} / {allImages.length}
            </div>
          )}
        </section>

        {/* ── Header Info + Sidebar ─────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Badges & actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs font-semibold">
                {detail.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun"}
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                ID: {detail.idLokasi}
              </Badge>
              {hasCoordinates && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${mapLat},${mapLon}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  <MapPin weight="bold" className="w-3 h-3" /> Cek di Maps
                </a>
              )}
              <ShareButton
                title={`Perumahan ${detail.namaPerumahan}`}
                text={`Lihat rumah impian di perumahan ${detail.namaPerumahan}.`}
              />
            </div>

            {/* Title & address */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 leading-tight">
                {detail.namaPerumahan}
              </h1>
              <p className="text-muted-foreground flex items-start gap-1.5">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                <span>{detail.alamat}</span>
              </p>
            </div>

            {/* Developer card */}
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" weight="duotone" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Dikembangkan Oleh</p>
                  <p className="font-bold">{detail.namaPengembang}</p>
                  {detail.npwpPengembang && (
                    <p className="text-xs text-muted-foreground">NPWP: {detail.npwpPengembang}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Smart Insights: Climate, Flood Buffer, Elevation & OSRM KRL Route */}
            {(geoData || floodData) && (
              <ClimateAgunanScoreCard
                distanceToJakartaKm={geoData?.distanceToJakarta}
                bestStationRoute={stationRoutes.bestStation}
                alternatives={stationRoutes.alternatives}
                floodData={floodData}
                sampleSpec={uniqueTipe[0] ?? null}
              />
            )}
          </div>

          {/* Sidebar: Kantor Pemasaran */}
          <div>
            <Card className="bg-primary/5 border-primary/15 shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <MapTrifold className="w-5 h-5 text-primary" weight="duotone" />
                  Kantor Pemasaran
                </h3>

                {detail.kantorPemasaran?.length > 0 ? (
                  <div className="space-y-5">
                    {detail.kantorPemasaran.map((kantor, i) => (
                      <div key={i} className="space-y-3">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {kantor.alamat} {kantor.nomor ? `No. ${kantor.nomor}` : ""}
                        </p>
                        <div className="space-y-2">
                          {kantor.noTelp && (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-background shadow-sm flex items-center justify-center text-primary">
                                <Phone className="w-3.5 h-3.5" weight="fill" />
                              </div>
                              <a href={`tel:${kantor.noTelp.split(" ")[0]}`}
                                className="text-sm font-medium hover:text-primary transition-colors">
                                {kantor.noTelp}
                              </a>
                            </div>
                          )}
                          {kantor.email && (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-background shadow-sm flex items-center justify-center text-primary">
                                <EnvelopeSimple className="w-3.5 h-3.5" weight="fill" />
                              </div>
                              <a href={`mailto:${kantor.email}`}
                                className="text-sm font-medium truncate hover:text-primary transition-colors">
                                {kantor.email}
                              </a>
                            </div>
                          )}
                        </div>
                        {kantor.noTelp && (
                          <a href={`https://wa.me/62${kantor.noTelp.split(" ")[0].replace(/^0/, "")}`}
                            target="_blank" rel="noreferrer">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-sm font-semibold shadow-md shadow-emerald-600/20">
                              Hubungi via WhatsApp
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Informasi tidak tersedia.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ── Lokasi, Rute KRL, Siteplan & Tur 360 (Interactive Showcase Tabs) ── */}
        <section id="showcase-tabs" className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">
                  Eksplorasi Imersif, Rute KRL &amp; Siteplan
                </h2>
                {chellData && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
                  >
                    {chellData.isDemoFallback
                      ? "Demo Chell-Tour Terintegrasi"
                      : "Live Chell-Tour"}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Pilih kavling langsung di Siteplan Interaktif 3D, jelajahi rumah
                contoh 360°, atau cek rute jalan raya OSRM ke stasiun KRL.
              </p>
            </div>
            {chellData?.project?.primarySiteplan && (
              <a
                href={`${chellData.chellTourBaseUrl}${chellData.project.primarySiteplan.fullUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-primary hover:underline sm:self-auto"
              >
                Buka Layar Penuh <ArrowSquareOut className="h-4 w-4" />
              </a>
            )}
          </div>

          <Tabs
            value={showcaseTab}
            onValueChange={setShowcaseTab}
            className="space-y-4"
          >
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border bg-muted/50 p-1 sm:w-fit">
              {chellData?.project?.primarySiteplan && (
                <TabsTrigger
                  value="live-siteplan"
                  className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  <MapTrifold className="h-4 w-4" weight="duotone" />
                  Siteplan Kavling Live (Pilih Unit)
                </TabsTrigger>
              )}
              {chellData?.project?.primaryTour && (
                <TabsTrigger
                  value="tour-360"
                  className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                >
                  <Compass className="h-4 w-4" weight="duotone" />
                  Tur 360° Rumah Contoh
                </TabsTrigger>
              )}
              <TabsTrigger
                value="route-map"
                className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
              >
                <Train className="h-4 w-4 text-orange-500" weight="duotone" />
                Rute KRL (OSRM) &amp; Audit Banjir
              </TabsTrigger>
              <TabsTrigger
                value="siteplan"
                className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
              >
                <MapTrifold className="h-4 w-4 text-primary" weight="duotone" />
                Siteplan Asli SiKumbang
              </TabsTrigger>
              <TabsTrigger
                value="gmaps"
                className="gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold"
              >
                <MapPin className="h-4 w-4 text-blue-500" weight="duotone" />
                Google Maps
              </TabsTrigger>
            </TabsList>

            {/* Chell-Tour Live Siteplan Embed */}
            {chellData?.project?.primarySiteplan && (
              <TabsContent value="live-siteplan" className="mt-0">
                <div className="relative h-[480px] overflow-hidden rounded-2xl border border-border/50 bg-slate-900 shadow-md md:h-[580px]">
                  <iframe
                    src={`${chellData.chellTourBaseUrl}${chellData.project.primarySiteplan.embedUrl}`}
                    className="h-full w-full border-0"
                    allow="accelerometer; gyroscope; magnetometer"
                    loading="lazy"
                  />
                </div>
              </TabsContent>
            )}

            {/* Chell-Tour 360 Virtual Tour Embed */}
            {chellData?.project?.primaryTour && (
              <TabsContent value="tour-360" className="mt-0">
                <div className="relative h-[480px] overflow-hidden rounded-2xl border border-border/50 bg-slate-900 shadow-md md:h-[580px]">
                  <iframe
                    src={`${chellData.chellTourBaseUrl}${chellData.project.primaryTour.url}`}
                    className="h-full w-full border-0"
                    allow="accelerometer; gyroscope; magnetometer; fullscreen"
                    loading="lazy"
                  />
                </div>
              </TabsContent>
            )}

            <TabsContent value="route-map" className="mt-0">
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="relative h-80 overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm md:h-[420px] lg:col-span-2">
                  {hasCoordinates ? (
                    <DetailRouteMap
                      propertyName={detail.namaPerumahan}
                      lat={Number(mapLat)}
                      lon={Number(mapLon)}
                      bestStationRoute={stationRoutes.bestStation}
                      alternatives={stationRoutes.alternatives}
                      krlRoute={activeKrlRoute}
                      isFloodFree={floodData?.isFloodFree ?? true}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
                      <MapPin weight="duotone" className="mb-2 h-10 w-10" />
                      <span className="text-sm font-medium">
                        Koordinat peta tidak tersedia
                      </span>
                    </div>
                  )}
                </div>

                {/* Side summary of 3 candidate KRL stations */}
                <div className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                      <Train
                        className="h-4 w-4 text-orange-500"
                        weight="duotone"
                      />
                      Perbandingan 3 Stasiun KRL Terdekat
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Diurutkan berdasarkan{" "}
                      <strong>jarak tempuh jalan raya aktual (OSRM)</strong>,
                      bukan sekadar garis lurus udara.
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {stationRoutes.alternatives.length > 0 ? (
                        stationRoutes.alternatives.map((cand, idx) => (
                          <div
                            key={cand.station.name}
                            className={cn(
                              "rounded-xl border p-3 text-xs transition-colors",
                              idx === 0
                                ? "border-orange-500/40 bg-orange-500/10"
                                : "border-border/50 bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-foreground">
                                {idx + 1}. {cand.station.name}
                              </span>
                              {idx === 0 && (
                                <Badge className="bg-orange-600 text-[10px] text-white">
                                  Tercepat
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between text-muted-foreground">
                              <span>
                                Jalan raya:{" "}
                                <strong className="text-foreground">
                                  {cand.roadDistanceKm} km
                                </strong>{" "}
                                (~{cand.roadDurationMinutes} mnt)
                              </span>
                              <span className="text-[11px]">
                                Udara: {cand.straightDistanceKm} km
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          Data stasiun belum tersedia.
                        </p>
                      )}
                    </div>
                  </div>

                  {activeKrlRoute && (
                    <div className="mt-4 rounded-xl border bg-muted/40 p-3 text-xs">
                      <p className="font-bold text-foreground">
                        Simulasi Rute KRL ke {activeKrlRoute.toStation}:
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Jarak rel{" "}
                        <strong className="text-foreground">
                          {activeKrlRoute.railDistanceKm} km
                        </strong>{" "}
                        ({activeKrlRoute.stationCount} stasiun) · ~
                        {activeKrlRoute.railDurationMinutes} menit di kereta ·
                        Tarif{" "}
                        <strong className="text-orange-600 dark:text-orange-400">
                          Rp
                          {activeKrlRoute.fareOneWay.toLocaleString("id-ID")}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="siteplan" className="mt-0">
              <div className="relative h-80 overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm md:h-[420px]">
                {detail.siteplan ? (
                  <Image
                    src={getImageUrl(detail.siteplan)}
                    alt={`Siteplan ${detail.namaPerumahan}`}
                    fill
                    className="object-contain p-4"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40"
                  style={{ display: detail.siteplan ? "none" : "flex" }}
                >
                  <MapTrifold weight="duotone" className="mb-2 h-10 w-10" />
                  <span className="text-sm font-medium">
                    Siteplan tidak tersedia
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gmaps" className="mt-0">
              <div className="relative h-80 overflow-hidden rounded-2xl border border-border/50 bg-muted shadow-sm md:h-[420px]">
                {hasCoordinates ? (
                  <iframe
                    src={`https://maps.google.com/maps?q=${mapLat},${mapLon}&hl=id&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
                    <MapPin weight="duotone" className="mb-2 h-10 w-10" />
                    <span className="text-sm font-medium">
                      Peta tidak tersedia
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* ── Tipe Rumah ────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Pilihan Tipe Rumah</h2>
            <Badge variant="secondary">{uniqueTipe.length} Tipe</Badge>
          </div>

          {uniqueTipe.length > 0 ? (
            <div className="space-y-8">
              {uniqueTipe.map(tipe => (
                <Card key={tipe.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Tipe header */}
                  <div className="p-6 border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
                    <div className="flex flex-col xl:flex-row justify-between gap-6">
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <h3 className="text-2xl font-extrabold tracking-tight">Tipe {tipe.nama}</h3>
                          <Badge className={cn("text-xs font-bold uppercase shadow-sm",
                            tipe.status === "subsidi"
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                          )}>
                            {tipe.status}
                          </Badge>
                        </div>
                        <p className="text-3xl font-black text-primary">{formatRupiah(tipe.harga)}</p>
                      </div>

                      {/* Quick stats */}
                      <div className="flex flex-wrap items-center gap-6 bg-background px-5 py-4 rounded-2xl border border-border/50 shadow-sm self-start">
                        {[
                          { icon: <ArrowsOut className="w-4 h-4" weight="bold" />, label: "Luas B/T", value: `${tipe.luasBangunan}/${tipe.luasTanah} m²` },
                          { icon: <Bed className="w-4 h-4" weight="fill" />, label: "K. Tidur", value: tipe.kamarTidur },
                          { icon: <Bathtub className="w-4 h-4" weight="fill" />, label: "K. Mandi", value: tipe.kamarMandi },
                        ].map(({ icon, label, value }, i, arr) => (
                          <React.Fragment key={label}>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
                                <span className="font-extrabold text-lg">{value}</span>
                              </div>
                            </div>
                            {i < arr.length - 1 && <div className="hidden md:block w-px h-10 bg-border" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="flex flex-col md:flex-row border-b border-border/50">
                    {/* Tampak */}
                    <div className="w-full md:w-1/2 h-72 md:h-96 relative bg-muted border-b md:border-b-0 md:border-r border-border/50 group overflow-hidden">
                      {tipe.fotoTampak ? (
                        <Image src={getImageUrl(tipe.fotoTampak)} alt={`Tampak ${tipe.nama}`} fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted"
                        style={{ display: tipe.fotoTampak ? "none" : "flex" }}>
                        <Buildings weight="duotone" className="w-10 h-10 mb-2" />
                        <span className="text-sm">Tampak Depan Tidak Tersedia</span>
                      </div>
                      <div className="absolute top-3 left-3 bg-background/90 text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md shadow-sm border border-border/50">
                        Foto Tampak Depan
                      </div>
                    </div>

                    {/* Denah */}
                    <div className="w-full md:w-1/2 h-72 md:h-96 relative bg-background/50 group p-4 overflow-hidden">
                      {tipe.fotoDenah ? (
                        <Image src={getImageUrl(tipe.fotoDenah)} alt={`Denah ${tipe.nama}`} fill
                          className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40"
                        style={{ display: tipe.fotoDenah ? "none" : "flex" }}>
                        <ArrowsOut weight="duotone" className="w-10 h-10 mb-2" />
                        <span className="text-sm">Denah Tidak Tersedia</span>
                      </div>
                      <div className="absolute top-3 left-3 bg-muted/90 text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md shadow-sm border border-border/50 z-10">
                        Denah Ruangan
                      </div>
                    </div>
                  </div>

                  {/* Spesifikasi */}
                  <div className="p-6 bg-background">
                    <h4 className="text-lg font-bold mb-5 flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-primary" weight="duotone" />
                      Spesifikasi Bangunan
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      {[
                        { label: "Atap", value: tipe.spesifikasiAtap },
                        { label: "Dinding", value: tipe.spesifikasiDinding },
                        { label: "Lantai", value: tipe.spesifikasiLantai },
                        { label: "Pondasi", value: tipe.spesifikasiPondasi },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {label}
                          </span>
                          <p className="font-medium text-foreground leading-relaxed">
                            {value || "Spesifikasi tidak tersedia"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Action Bar (Siteplan 3D & 360 Tour) */}
                  {(chellData?.project?.primarySiteplan || chellData?.project?.primaryTour) && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-muted/30 px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium">
                          Eksplorasi digital tersedia untuk Tipe {tipe.nama}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {chellData?.project?.primarySiteplan && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs font-semibold hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                            onClick={() => {
                              setShowcaseTab("live-siteplan");
                              const el = document.getElementById("showcase-tabs");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            <MapTrifold className="h-3.5 w-3.5 text-emerald-600" weight="bold" />
                            Pilih Unit di Siteplan Interaktif
                          </Button>
                        )}
                        {chellData?.project?.primaryTour && (
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                            onClick={() => {
                              setShowcaseTab("tour-360");
                              const el = document.getElementById("showcase-tabs");
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" weight="bold" />
                            Tur Virtual 360° Interior
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-muted/30 border border-border/50 border-dashed rounded-2xl p-12 text-center">
              <Buildings className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-1.5">Belum Ada Tipe Rumah</h3>
              <p className="text-sm text-muted-foreground">Informasi tipe rumah belum tersedia.</p>
            </div>
          )}
        </section>

        {/* ── KPR Calculator ────────────────────────────────────── */}
        {uniqueTipe.length > 0 && (
          <>
            <Separator />
            <section>
              <KprCalculator
                tipeRumahList={uniqueTipe}
                bestStationRoute={stationRoutes.bestStation}
                workStation={workStation}
                onWorkStationChange={setWorkStation}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
