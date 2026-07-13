'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCompare } from '@/hooks/useCompare';
import { ArrowLeft, MapPin, Scales, Buildings, Train, Drop, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { getDistanceToJakarta, getNearestStation } from '@/lib/geoUtils';

interface TipeRumahItem {
  harga: number;
  luasTanah?: number;
  luasBangunan?: number;
  spesifikasiAtap?: string;
  spesifikasiDinding?: string;
  spesifikasiLantai?: string;
  spesifikasiPondasi?: string;
}

interface DetailData {
  namaPerumahan: string;
  namaPengembang: string;
  jenisPerumahan: number;
  alamat: string;
  idLokasi: string;
  foto: string[];
  koordinat: { lat: number; lon: number; };
  koordinatPerumahan?: string | null;
  tipeRumah?: TipeRumahItem[];
  tipeRusun?: TipeRumahItem[];
}

interface CompareData {
  detail: DetailData;
  tipeList: TipeRumahItem[];
  distanceToJakarta: number | null;
  nearestStation: string | null;
  floodRisk: string | null;
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `https://sikumbang.tapera.go.id${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ComparePage() {
  const router = useRouter();
  const { compareList, toggleCompare } = useCompare();
  const [dataList, setDataList] = useState<CompareData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareList.length === 0) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const promises = compareList.map(async (house) => {
          const res = await fetch(`https://sikumbang.tapera.go.id/lokasi-perumahan/${house.idLokasi}/json`);
          const json = await res.json();
          const detail = json.detail as DetailData;
          const tipeList = [...(detail.tipeRumah || []), ...(detail.tipeRusun || [])];

          let lat: number | undefined;
          let lon: number | undefined;

          if (detail?.koordinat && typeof detail.koordinat.lat !== 'undefined') {
            lat = parseFloat(String(detail.koordinat.lat));
            lon = parseFloat(String(detail.koordinat.lon));
          } else if (detail?.koordinatPerumahan) {
            const parts = typeof detail.koordinatPerumahan === 'string' ? detail.koordinatPerumahan.split(',') : [];
            lat = parts.length > 0 ? parseFloat(parts[0].trim()) : undefined;
            lon = parts.length > 1 ? parseFloat(parts[1].trim()) : undefined;
          }

          let distanceToJakarta = null;
          let nearestStation = null;
          let floodRisk = null;

          if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
            distanceToJakarta = getDistanceToJakarta(lat, lon);
            const stationData = getNearestStation(lat, lon);
            nearestStation = `${stationData.station.name} (${stationData.distance.toFixed(1)} km)`;

            try {
              const floodRes = await fetch(`/api/inarisk?lat=${lat}&lon=${lon}`);
              const floodJson = await floodRes.json();
              if (floodJson.success) {
                floodRisk = floodJson.riskLevel;
              }
            } catch (e) {
              console.error("Flood fetch error", e);
            }
          }

          return { detail, tipeList, distanceToJakarta, nearestStation, floodRisk };
        });

        const results = await Promise.all(promises);
        setDataList(results);
      } catch (e) {
        console.error("Failed to fetch compare data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [compareList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Menyiapkan Tabel Perbandingan...</p>
        </div>
      </div>
    );
  }

  if (compareList.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center">
          <Scales className="w-12 h-12 text-muted-foreground" weight="duotone" />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Belum ada properti yang dipilih</h2>
          <p className="text-muted-foreground max-w-md">Pilih minimal 2 properti dari halaman utama untuk melihat perbandingannya secara mendetail.</p>
        </div>
        <Button onClick={() => router.push('/')} size="lg" className="rounded-full">
          Cari Properti Sekarang
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" className="rounded-full hover:bg-muted" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
          </Button>
          <div className="font-bold flex items-center gap-2">
            <Scales weight="fill" className="text-primary" />
            Bandingkan {dataList.length} Properti
          </div>
          <div className="w-20"></div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-4 min-w-max">
            {/* Feature Column */}
            <div className="w-48 shrink-0 py-8 hidden md:block">
              <div className="h-64 mb-6" /> {/* Spacer for image card */}
              <div className="space-y-4 text-sm font-semibold text-muted-foreground">
                <div className="h-16 flex items-center">Rentang Harga</div>
                <div className="h-12 flex items-center">Luas Tanah (Min)</div>
                <div className="h-12 flex items-center">Luas Bangunan (Min)</div>
                <div className="h-16 flex items-center">Jarak ke Jakarta</div>
                <div className="h-16 flex items-center">Stasiun KRL Terdekat</div>
                <div className="h-16 flex items-center">Risiko Banjir</div>
                <div className="h-16 flex items-center">Spesifikasi Atap</div>
                <div className="h-16 flex items-center">Spesifikasi Dinding</div>
              </div>
            </div>

            {/* Data Columns */}
            {dataList.map((data, idx) => {
              const cheapest = [...data.tipeList].sort((a, b) => a.harga - b.harga)[0];
              const highest = [...data.tipeList].sort((a, b) => b.harga - a.harga)[0];
              const priceRange = cheapest && highest && cheapest.harga !== highest.harga 
                ? `${formatRupiah(cheapest.harga)} - ${formatRupiah(highest.harga)}`
                : (cheapest ? formatRupiah(cheapest.harga) : 'Hubungi Pengembang');

              return (
                <div key={data.detail?.idLokasi || idx} className="w-72 md:w-80 shrink-0 flex flex-col">
                  {/* Card Header */}
                  <div className="h-64 mb-6 flex flex-col relative group">
                    <button 
                      onClick={() => toggleCompare({ idLokasi: data.detail.idLokasi, namaPerumahan: data.detail.namaPerumahan, foto: data.detail.foto } as any)}
                      className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Hapus
                    </button>
                    <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-3 bg-muted">
                      {data.detail?.foto && data.detail.foto[0] ? (
                        <Image 
                          src={getImageUrl(data.detail.foto[0])} 
                          alt={data.detail.namaPerumahan} 
                          fill 
                          className="object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Buildings className="w-8 h-8 text-muted-foreground/50" /></div>
                      )}
                    </div>
                    <Link href={`/perumahan/${data.detail?.idLokasi}`} className="hover:underline">
                      <h3 className="font-bold text-lg leading-tight line-clamp-2">{data.detail?.namaPerumahan}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{data.detail?.namaPengembang}</p>
                    <div className="mt-2 text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-full self-start">
                      {data.detail?.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun"}
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-4 text-sm divide-y divide-border/50">
                    <div className="h-16 flex flex-col justify-center pt-2">
                      <span className="md:hidden text-xs text-muted-foreground font-semibold mb-1">Harga</span>
                      <span className="font-bold text-primary">{priceRange}</span>
                    </div>
                    <div className="h-12 flex flex-col justify-center pt-2">
                      <span className="md:hidden text-xs text-muted-foreground font-semibold mb-1">Luas Tanah</span>
                      <span>{cheapest?.luasTanah || '-'} m²</span>
                    </div>
                    <div className="h-12 flex flex-col justify-center pt-2">
                      <span className="md:hidden text-xs text-muted-foreground font-semibold mb-1">Luas Bangunan</span>
                      <span>{cheapest?.luasBangunan || '-'} m²</span>
                    </div>
                    <div className="h-16 flex flex-col justify-center pt-2">
                      <span className="md:hidden text-xs text-muted-foreground font-semibold mb-1">Jarak ke Jakarta</span>
                      <div className="flex items-center gap-1.5">
                        <MapPin weight="duotone" className="text-blue-500" />
                        {data.distanceToJakarta ? `${data.distanceToJakarta.toFixed(1)} km` : '-'}
                      </div>
                    </div>
                    <div className="h-16 flex flex-col justify-center pt-2">
                      <span className="md:hidden text-xs text-muted-foreground font-semibold mb-1">Stasiun KRL</span>
                      <div className="flex items-start gap-1.5">
                        <Train weight="duotone" className="text-emerald-500 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">{data.nearestStation || '-'}</span>
                      </div>
                    </div>
                    <div className="h-16 flex flex-col justify-center pt-2">
                      <span className="md:hidden text-xs text-muted-foreground font-semibold mb-1">Risiko Banjir</span>
                      <div className="flex items-center gap-1.5">
                        <Drop weight="duotone" className={data.floodRisk === 'Rendah' ? 'text-blue-500' : 'text-amber-500'} />
                        {data.floodRisk || 'Tidak Tersedia'}
                      </div>
                    </div>
                    <div className="h-16 flex flex-col justify-center pt-2">
                      <span className="md:hidden text-xs text-muted-foreground font-semibold mb-1">Spesifikasi Atap</span>
                      <span className="line-clamp-2 leading-tight">{cheapest?.spesifikasiAtap || '-'}</span>
                    </div>
                    <div className="h-16 flex flex-col justify-center pt-2">
                      <span className="md:hidden text-xs text-muted-foreground font-semibold mb-1">Spesifikasi Dinding</span>
                      <span className="line-clamp-2 leading-tight">{cheapest?.spesifikasiDinding || '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
