"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Buildings, Bed, Bathtub, ArrowsOut,
  Phone, EnvelopeSimple, MapTrifold, CaretLeft, CaretRight,
  ShieldCheck, Heart, Train, WarningCircle, Drop,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { getDistanceToJakarta, getNearestStation } from "@/lib/geoUtils";
import KprCalculator from "@/components/KprCalculator";
import ShareButton from "@/components/ShareButton";

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
  const [floodData, setFloodData] = useState<{ riskLevel: string; isFloodFree: boolean } | null>(null);
  const [geoData, setGeoData] = useState<{
    distanceToJakarta: number;
    nearestStation: { station: { name: string }; distance: number };
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
          setGeoData({ distanceToJakarta: getDistanceToJakarta(lat, lon), nearestStation: getNearestStation(lat, lon) });
          fetch(`/api/inarisk?lat=${lat}&lon=${lon}`)
            .then(r => r.json())
            .then(d => { if (d.success) setFloodData({ riskLevel: d.riskLevel, isFloodFree: d.isFloodFree }); })
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

            {/* Smart Insights */}
            {(geoData || floodData) && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" weight="fill" /> Analisis Lokasi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {geoData && (
                      <>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/15 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                          <Buildings className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" weight="duotone" />
                          <div>
                            <p className="text-xs font-semibold">Jarak ke Jakarta</p>
                            <p className="text-xs text-muted-foreground">{geoData.distanceToJakarta.toFixed(1)} km dari Monas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/15 rounded-xl border border-orange-200/50 dark:border-orange-800/30">
                          <Train className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" weight="duotone" />
                          <div>
                            <p className="text-xs font-semibold">Stasiun KRL Terdekat</p>
                            <p className="text-xs text-muted-foreground">{geoData.nearestStation.distance.toFixed(1)} km ke {geoData.nearestStation.station.name}</p>
                          </div>
                        </div>
                      </>
                    )}
                    {floodData && (
                      <div className={cn("flex items-center gap-3 p-3 rounded-xl border md:col-span-2",
                        floodData.isFloodFree
                          ? "bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200/50 dark:border-emerald-800/30"
                          : "bg-red-50 dark:bg-red-900/15 border-red-200/50 dark:border-red-800/30"
                      )}>
                        {floodData.isFloodFree
                          ? <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" weight="duotone" />
                          : <WarningCircle className="w-5 h-5 text-red-600 shrink-0" weight="duotone" />
                        }
                        <div>
                          <p className={cn("text-xs font-bold", floodData.isFloodFree ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                            {floodData.isFloodFree ? "Relatif Aman dari Banjir" : "Kawasan Rawan Banjir"}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Drop className="w-3 h-3" /> Tingkat risiko: {floodData.riskLevel} (inaRISK BNPB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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

        {/* ── Lokasi & Siteplan ─────────────────────────────────── */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold">Lokasi &amp; Siteplan</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm h-72 md:h-96 bg-muted relative">
              {hasCoordinates ? (
                <iframe
                  src={`https://maps.google.com/maps?q=${mapLat},${mapLon}&hl=id&z=15&output=embed`}
                  width="100%" height="100%" style={{ border: 0 }} allowFullScreen
                  loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
                  <MapPin weight="duotone" className="w-10 h-10 mb-2" />
                  <span className="text-sm font-medium">Peta tidak tersedia</span>
                </div>
              )}
            </div>
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-sm h-72 md:h-96 bg-muted relative">
              {detail.siteplan ? (
                <Image src={getImageUrl(detail.siteplan)} alt={`Siteplan ${detail.namaPerumahan}`}
                  fill className="object-contain p-4"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40"
                style={{ display: detail.siteplan ? "none" : "flex" }}>
                <MapTrifold weight="duotone" className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium">Siteplan tidak tersedia</span>
              </div>
            </div>
          </div>
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
              <KprCalculator tipeRumahList={uniqueTipe} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
