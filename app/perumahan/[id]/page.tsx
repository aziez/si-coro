"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Buildings, Bed, Bathtub, ArrowsOut, 
  Phone, EnvelopeSimple, MapTrifold, CaretLeft, CaretRight, ShieldCheck, Heart
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';

interface DetailData {
  namaPerumahan: string;
  namaPengembang: string;
  npwpPengembang: string;
  jenisPerumahan: number;
  alamat: string;
  idLokasi: string;
  siteplan: string;
  foto: string[];
  koordinat: {
    lat: number;
    lon: number;
  };
  kantorPemasaran: {
    alamat: string;
    nomor: string;
    kodeWilayah: string;
    noTelp: string;
    email: string;
    website: string;
    fax: string;
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

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const getImageUrl = (url: string | undefined | null) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `https://sikumbang.tapera.go.id${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function DetailPerumahanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const propertyId = resolvedParams.id;
  const [data, setData] = useState<{ detail: DetailData, bangunan: BangunanItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`https://sikumbang.tapera.go.id/lokasi-perumahan/${propertyId}/json`);
        const json = await res.json();
        
        if (json.error) {
          setError(json.message || 'Data tidak ditemukan');
        } else {
          setData(json);
        }
      } catch (err) {
        setError('Gagal mengambil data perumahan.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-12 animate-pulse flex flex-col gap-8 items-center justify-center">
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <div className="w-32 h-10 bg-muted rounded-full"></div>
          <div className="w-full h-[50vh] bg-muted rounded-3xl"></div>
          <div className="space-y-4">
            <div className="w-2/3 h-12 bg-muted rounded-lg"></div>
            <div className="w-1/2 h-6 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Buildings className="w-24 h-24 text-muted-foreground/30 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
        <p className="text-muted-foreground mb-8">{error || 'Data perumahan tidak ditemukan.'}</p>
        <Button onClick={() => router.back()} className="rounded-xl px-8">
          <ArrowLeft className="mr-2 w-5 h-5" /> Kembali
        </Button>
      </div>
    );
  }

  const { detail, bangunan } = data;

  // Extract unique house types from bangunan array
  const uniqueTipe = Array.from(new Map(bangunan.map(b => [b.tipe.id, b.tipe])).values());
  const allImages = detail.foto && detail.foto.length > 0 ? detail.foto : [''];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" className="rounded-full hover:bg-muted" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Kembali
          </Button>
          <div className="font-semibold truncate max-w-[200px] md:max-w-md">{detail.namaPerumahan}</div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Gallery */}
        <section className="relative w-full h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden group bg-muted flex items-center justify-center shadow-2xl">
          {allImages[0] ? (
            <Image
              src={getImageUrl(allImages[currentHeroImage])}
              alt={`${detail.namaPerumahan} - Foto ${currentHeroImage + 1}`}
              fill
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                if (e.target && (e.target as any).nextElementSibling) {
                  (e.target as any).nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div className="absolute inset-0 flex-col items-center justify-center text-muted-foreground/50 bg-muted" style={{ display: allImages[0] ? 'none' : 'flex' }}>
            <Buildings weight="duotone" className="w-20 h-20 mb-4" />
            <span className="text-lg font-medium">Foto Utama Tidak Tersedia</span>
          </div>

          {allImages.length > 1 && (
            <>
              <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setCurrentHeroImage(prev => prev === 0 ? allImages.length - 1 : prev - 1)} 
                  className="bg-background/80 hover:bg-background text-foreground p-3 rounded-full shadow-lg backdrop-blur-sm transition-all"
                >
                  <CaretLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setCurrentHeroImage(prev => prev === allImages.length - 1 ? 0 : prev + 1)} 
                  className="bg-background/80 hover:bg-background text-foreground p-3 rounded-full shadow-lg backdrop-blur-sm transition-all"
                >
                  <CaretRight className="w-6 h-6" />
                </button>
              </div>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHeroImage(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all shadow-md ${idx === currentHeroImage ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Header Information */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
                  {detail.jenisPerumahan === 0 ? 'Rumah Tapak' : 'Rumah Susun'}
                </span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-full">
                  ID: {detail.idLokasi}
                </span>

                {detail.koordinat && detail.koordinat.lat && detail.koordinat.lon && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${detail.koordinat.lat},${detail.koordinat.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold tracking-wider flex items-center gap-1.5 hover:bg-blue-500/20 transition-colors"
                  >
                    <MapPin weight="bold" /> Cek Lokasi Maps
                  </a>
                )}

                <button
                  onClick={() => {
                    // Map to Perumahan interface approximation
                    const mappedData: any = {
                      idLokasi: detail.idLokasi,
                      namaPerumahan: detail.namaPerumahan,
                      pengembang: { nama: detail.namaPengembang },
                      jenisPerumahan: detail.jenisPerumahan === 0 ? "Rumah Tapak" : "Rumah Susun",
                      wilayah: { kecamatan: detail.alamat },
                      foto: detail.foto,
                      koordinatPerumahan: `${detail.koordinat?.lat},${detail.koordinat?.lon}`,
                      jumlahUnit: 0,
                      jumlahUnitKomersil: 0,
                      tipeRumah: []
                    };
                    toggleFavorite(mappedData);
                  }}
                  className={`px-4 py-1 rounded-full text-sm font-semibold tracking-wider flex items-center gap-1.5 transition-colors ${
                    isFavorite(detail.idLokasi) 
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <Heart weight={isFavorite(detail.idLokasi) ? "fill" : "regular"} /> 
                  {isFavorite(detail.idLokasi) ? "Tersimpan di Favorit" : "Simpan ke Favorit"}
                </button>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
                {detail.namaPerumahan}
              </h1>
              <p className="text-lg text-muted-foreground flex items-start gap-2">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                <span>{detail.alamat}</span>
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Dikembangkan Oleh</h3>
                <p className="text-foreground font-medium text-lg">{detail.namaPengembang}</p>
                {detail.npwpPengembang && <p className="text-sm text-muted-foreground">NPWP: {detail.npwpPengembang}</p>}
              </div>
            </div>
          </div>

          {/* Sidebar: Kantor Pemasaran */}
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 shadow-lg shadow-primary/5">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapTrifold className="w-6 h-6 text-primary" weight="duotone" />
                Kantor Pemasaran
              </h3>
              
              {detail.kantorPemasaran && detail.kantorPemasaran.length > 0 ? (
                <div className="space-y-6">
                  {detail.kantorPemasaran.map((kantor, idx) => (
                    <div key={idx} className="space-y-4">
                      <p className="text-sm font-medium leading-relaxed">
                        {kantor.alamat} {kantor.nomor ? `No. ${kantor.nomor}` : ''}
                      </p>
                      
                      <div className="space-y-3">
                        {kantor.noTelp && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-background shadow flex items-center justify-center text-primary">
                              <Phone className="w-4 h-4" weight="fill" />
                            </div>
                            <a href={`tel:${kantor.noTelp.split(' ')[0]}`} className="text-sm font-semibold hover:text-primary transition-colors">
                              {kantor.noTelp}
                            </a>
                          </div>
                        )}
                        {kantor.email && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-background shadow flex items-center justify-center text-primary">
                              <EnvelopeSimple className="w-4 h-4" weight="fill" />
                            </div>
                            <a href={`mailto:${kantor.email}`} className="text-sm font-medium truncate hover:text-primary transition-colors">
                              {kantor.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {kantor.noTelp && (
                        <a 
                          href={`https://wa.me/62${kantor.noTelp.split(' ')[0].replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block mt-4"
                        >
                          <Button className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold py-6 shadow-lg shadow-green-600/20">
                            Hubungi via WhatsApp
                          </Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Informasi kantor pemasaran tidak tersedia.</p>
              )}
            </div>
          </div>
        </section>

        {/* Maps & Siteplan Section */}
        <section className="space-y-6 pt-8 border-t border-border/50">
          <h2 className="text-3xl font-bold">Lokasi & Siteplan</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Google Maps Iframe */}
            <div className="rounded-3xl overflow-hidden border border-border/50 shadow-sm h-[300px] md:h-[400px] bg-muted relative flex items-center justify-center">
              {detail.koordinat && detail.koordinat.lat && detail.koordinat.lon ? (
                <iframe 
                  src={`https://maps.google.com/maps?q=${detail.koordinat.lat},${detail.koordinat.lon}&hl=id&z=15&output=embed`}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50">
                  <MapPin weight="duotone" className="w-12 h-12 mb-2" />
                  <span className="text-sm font-medium">Peta Lokasi Tidak Tersedia</span>
                </div>
              )}
            </div>
            
            {/* Siteplan */}
            <div className="rounded-3xl overflow-hidden border border-border/50 shadow-sm h-[300px] md:h-[400px] bg-muted relative flex items-center justify-center p-4">
              {detail.siteplan ? (
                <Image 
                  src={getImageUrl(detail.siteplan)} 
                  alt={`Siteplan ${detail.namaPerumahan}`}
                  fill 
                  className="object-contain p-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    if (e.target && (e.target as any).nextElementSibling) {
                      (e.target as any).nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className="absolute inset-0 flex-col items-center justify-center text-muted-foreground/50" style={{ display: detail.siteplan ? 'none' : 'flex' }}>
                <MapTrifold weight="duotone" className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">Siteplan Tidak Tersedia</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tipe Rumah Section (List View) */}
        <section className="space-y-8 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold">Pilihan Tipe Rumah</h2>
            <span className="bg-muted px-4 py-2 rounded-full text-sm font-medium text-muted-foreground self-start md:self-auto">
              {uniqueTipe.length} Tipe Tersedia
            </span>
          </div>

          {uniqueTipe.length > 0 ? (
            <div className="space-y-12">
              {uniqueTipe.map((tipe) => (
                <div key={tipe.id} className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col">
                  
                  {/* Header: Title & Info */}
                  <div className="p-6 md:p-10 border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent flex flex-col xl:flex-row justify-between gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tipe {tipe.nama}</h3>
                        <span className={cn(
                          "px-4 py-1 text-sm font-bold rounded-full shadow-sm",
                          tipe.status === 'subsidi' ? "bg-green-100 text-green-700 border border-green-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                        )}>
                          {tipe.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-4xl md:text-5xl font-black text-primary">{formatRupiah(tipe.harga)}</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap items-center gap-4 md:gap-8 bg-background p-5 md:p-6 rounded-3xl border border-border/50 shadow-sm self-start">
                      <div className="flex flex-col items-center justify-center px-2">
                        <span className="text-sm font-semibold text-muted-foreground mb-2">Luas B/T</span>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <ArrowsOut className="w-5 h-5" weight="bold" />
                          </div>
                          <span className="font-extrabold text-xl">{tipe.luasBangunan} / {tipe.luasTanah} <span className="text-sm font-medium text-muted-foreground">m²</span></span>
                        </div>
                      </div>
                      <div className="hidden md:block w-px h-12 bg-border"></div>
                      <div className="flex flex-col items-center justify-center px-2">
                        <span className="text-sm font-semibold text-muted-foreground mb-2">K. Tidur</span>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Bed className="w-5 h-5" weight="fill" />
                          </div>
                          <span className="font-extrabold text-xl">{tipe.kamarTidur}</span>
                        </div>
                      </div>
                      <div className="hidden md:block w-px h-12 bg-border"></div>
                      <div className="flex flex-col items-center justify-center px-2">
                        <span className="text-sm font-semibold text-muted-foreground mb-2">K. Mandi</span>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Bathtub className="w-5 h-5" weight="fill" />
                          </div>
                          <span className="font-extrabold text-xl">{tipe.kamarMandi}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Images Section (Dominant) */}
                  <div className="flex flex-col md:flex-row border-b border-border/50">
                    {/* Foto Tampak */}
                    <div className="w-full h-[350px] md:w-1/2 md:h-[500px] relative bg-muted border-b md:border-b-0 md:border-r border-border/50 group overflow-hidden">
                      {tipe.fotoTampak ? (
                        <Image 
                          src={getImageUrl(tipe.fotoTampak)}
                          alt={`Tampak Depan ${tipe.nama}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            if (e.target && (e.target as any).nextElementSibling) {
                              (e.target as any).nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex-col items-center justify-center text-muted-foreground/50 bg-muted" style={{ display: tipe.fotoTampak ? 'none' : 'flex' }}>
                        <Buildings weight="duotone" className="w-12 h-12 mb-3" />
                        <span className="text-sm font-medium">Tampak Depan Tidak Tersedia</span>
                      </div>
                      <div className="absolute top-4 left-4 bg-background/90 text-foreground text-sm font-bold px-4 py-2 rounded-xl backdrop-blur-md shadow-lg border border-border/50">
                        Foto Tampak Depan
                      </div>
                    </div>

                    {/* Foto Denah */}
                    <div className="w-full h-[350px] md:w-1/2 md:h-[500px] relative bg-background group p-6 overflow-hidden">
                      {tipe.fotoDenah ? (
                        <Image 
                          src={getImageUrl(tipe.fotoDenah)}
                          alt={`Denah ${tipe.nama}`}
                          fill
                          className="object-contain p-6 group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            if (e.target && (e.target as any).nextElementSibling) {
                              (e.target as any).nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 flex-col items-center justify-center text-muted-foreground/50" style={{ display: tipe.fotoDenah ? 'none' : 'flex' }}>
                        <ArrowsOut weight="duotone" className="w-12 h-12 mb-3" />
                        <span className="text-sm font-medium">Denah Tidak Tersedia</span>
                      </div>
                      <div className="absolute top-4 left-4 bg-muted/90 text-foreground text-sm font-bold px-4 py-2 rounded-xl backdrop-blur-md shadow-lg border border-border/50 z-10">
                        Denah Ruangan
                      </div>
                    </div>
                  </div>

                  {/* Spesifikasi Detail (No Truncation) */}
                  <div className="p-6 md:p-10 bg-background">
                    <h4 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-primary" weight="duotone" />
                      Spesifikasi Bangunan Lengkap
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      <div className="space-y-2">
                        <span className="text-primary font-bold tracking-widest text-sm uppercase flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div> Atap
                        </span>
                        <p className="font-medium text-foreground text-lg leading-relaxed">{tipe.spesifikasiAtap || 'Spesifikasi tidak tersedia'}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-primary font-bold tracking-widest text-sm uppercase flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div> Dinding
                        </span>
                        <p className="font-medium text-foreground text-lg leading-relaxed">{tipe.spesifikasiDinding || 'Spesifikasi tidak tersedia'}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-primary font-bold tracking-widest text-sm uppercase flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div> Lantai
                        </span>
                        <p className="font-medium text-foreground text-lg leading-relaxed">{tipe.spesifikasiLantai || 'Spesifikasi tidak tersedia'}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-primary font-bold tracking-widest text-sm uppercase flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div> Pondasi
                        </span>
                        <p className="font-medium text-foreground text-lg leading-relaxed">{tipe.spesifikasiPondasi || 'Spesifikasi tidak tersedia'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted/30 border border-border/50 border-dashed rounded-3xl p-12 text-center">
              <Buildings className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Tipe Rumah</h3>
              <p className="text-muted-foreground">Informasi tipe rumah untuk perumahan ini belum tersedia.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
