'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Perumahan } from './HouseCard';
import {
  X, MapPin, Users, Phone, EnvelopeSimple, Buildings,
  CaretLeft, CaretRight, Bed, Bathtub, ArrowsOut, Heart,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Credenza, CredenzaContent, CredenzaTitle,
} from '@/components/ui/credenza';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HouseDetailModalProps {
  data: Perumahan;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const resolveImageUrl = (url: string) =>
  url.startsWith('http') ? url : `https://sikumbang.tapera.go.id${url.startsWith('/') ? '' : '/'}${url}`;

// ─── Component ──────────────────────────────────────────────────────────────

export function HouseDetailModal({
  data,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}: HouseDetailModalProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const hasImages = data.foto?.length > 0;

  const nextImage = () => setCurrentImageIdx(p => (p + 1) % data.foto.length);
  const prevImage = () => setCurrentImageIdx(p => (p === 0 ? data.foto.length - 1 : p - 1));

  const hasSubsidi = data.tipeRumah?.some(t => t.status === 'subsidi');
  const hasKomersil = data.tipeRumah?.some(t => t.status === 'komersil');

  return (
    <Credenza open onOpenChange={(open) => !open && onClose()}>
      <CredenzaContent className="w-full max-w-5xl sm:max-w-5xl md:max-w-6xl lg:max-w-7xl xl:max-w-7xl p-0 overflow-hidden flex flex-col max-h-[92dvh] gap-0 border">
        <CredenzaTitle className="sr-only">{data.namaPerumahan}</CredenzaTitle>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* ── Left: Image Gallery ──────────────────────────── */}
          <div className="relative w-full md:w-3/5 bg-muted shrink-0 group flex-shrink-0 min-h-56 md:min-h-0">
            {hasImages ? (
              <>
                <Image
                  src={resolveImageUrl(data.foto[currentImageIdx])}
                  alt={`${data.namaPerumahan} – foto ${currentImageIdx + 1}`}
                  fill
                  className="object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {data.foto.length > 1 && (
                  <>
                    {/* Nav arrows */}
                    <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={prevImage} className="bg-background/80 hover:bg-background p-2 rounded-full shadow-lg backdrop-blur-sm transition-all">
                        <CaretLeft className="w-5 h-5" />
                      </button>
                      <button onClick={nextImage} className="bg-background/80 hover:bg-background p-2 rounded-full shadow-lg backdrop-blur-sm transition-all">
                        <CaretRight className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {data.foto.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIdx(i)}
                          className={cn('h-1.5 rounded-full transition-all', i === currentImageIdx ? 'bg-white w-5' : 'bg-white/50 w-1.5 hover:bg-white/80')}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
                <Buildings weight="duotone" className="w-14 h-14 mb-2" />
                <span className="text-sm font-medium">Foto tidak tersedia</span>
              </div>
            )}

            {/* Status badges overlay */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              {hasSubsidi && <Badge className="bg-emerald-500 text-white text-[10px] shadow-sm">Subsidi</Badge>}
              {hasKomersil && <Badge className="bg-blue-500 text-white text-[10px] shadow-sm">Komersil</Badge>}
            </div>

            {/* Favorite button overlay */}
            <button
              onClick={onToggleFavorite}
              className={cn(
                'absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm shadow-md transition-all',
                isFavorite ? 'bg-red-500 text-white' : 'bg-background/80 text-muted-foreground hover:text-red-500'
              )}
              title={isFavorite ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
            >
              <Heart weight={isFavorite ? 'fill' : 'regular'} className="w-4 h-4" />
            </button>
          </div>

          {/* ── Right: Detail Content ────────────────────────── */}
          <div className="flex flex-col flex-1 min-h-0 min-w-0">
            <div className="flex-1 overflow-y-auto">
              {/* Header info */}
              <div className="p-5 pb-3">
                <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider mb-2">
                  {data.jenisPerumahan}
                </Badge>
                <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug pr-2">
                  {data.namaPerumahan}
                </h2>
                <div className="flex items-start gap-1.5 text-sm text-muted-foreground mt-1.5">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {[data.wilayah?.kelurahan, data.wilayah?.kecamatan, data.wilayah?.kabupaten, data.wilayah?.provinsi].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Tabs: Info / Tipe Rumah */}
              <Tabs defaultValue="info" className="flex flex-col flex-1">
                <TabsList className="w-full rounded-none bg-transparent border-b h-auto p-0 justify-start gap-0">
                  <TabsTrigger
                    value="info"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-2.5 text-sm font-medium"
                  >
                    Informasi
                  </TabsTrigger>
                  <TabsTrigger
                    value="tipe"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-2.5 text-sm font-medium"
                  >
                    Tipe Rumah ({data.tipeRumah?.length ?? 0})
                  </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="mt-0 p-5 space-y-4">
                  {/* Developer */}
                  <div className="bg-muted/40 rounded-xl p-4 border space-y-2 text-sm">
                    <h3 className="font-semibold flex items-center gap-1.5 text-sm">
                      <Buildings className="w-4 h-4 text-primary" /> Pengembang
                    </h3>
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-muted-foreground">Nama</span>
                      <span className="font-medium text-right">{data.pengembang?.nama || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted-foreground">Asosiasi</span>
                      <span className="font-medium text-right">{data.pengembang?.asosiasi || '—'}</span>
                    </div>
                  </div>

                  {/* Kantor Pemasaran */}
                  {data.kantorPemasaran && data.kantorPemasaran.length > 0 && (
                    <div className="bg-muted/40 rounded-xl p-4 border space-y-3 text-sm">
                      <h3 className="font-semibold flex items-center gap-1.5 text-sm">
                        <Users className="w-4 h-4 text-primary" /> Kantor Pemasaran
                      </h3>
                      {data.kantorPemasaran.map((k, i) => (
                        <div key={i} className="space-y-1.5">
                          <p className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {k.alamat} {k.nomor ? `No. ${k.nomor}` : ''}
                          </p>
                          {k.noTelp && (
                            <p className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              {k.noTelp}
                            </p>
                          )}
                          {k.email && (
                            <p className="flex items-center gap-2">
                              <EnvelopeSimple className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                              {k.email}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unit count */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border rounded-xl p-3 text-center">
                      <span className="text-2xl font-bold text-primary">{data.jumlahUnit}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">Unit Tersedia</p>
                    </div>
                    <div className="bg-card border rounded-xl p-3 text-center">
                      <span className="text-2xl font-bold text-blue-500">{data.jumlahUnitKomersil}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">Unit Komersil</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Tipe Tab */}
                <TabsContent value="tipe" className="mt-0 p-5 space-y-3">
                  {data.tipeRumah?.length > 0 ? data.tipeRumah.map((tipe, i) => (
                    <div key={i} className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold">{tipe.nama}</h4>
                          <Badge
                            variant={tipe.status === 'subsidi' ? 'default' : 'secondary'}
                            className={cn('mt-1 text-[10px] font-bold uppercase',
                              tipe.status === 'subsidi'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            )}
                          >
                            {tipe.status}
                          </Badge>
                        </div>
                        <span className="text-primary font-bold text-base">{formatRupiah(tipe.harga)}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><ArrowsOut className="w-3.5 h-3.5" />{tipe.luasBangunan}/{tipe.luasTanah} m²</span>
                        <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{tipe.kamarTidur} Kamar</span>
                        <span className="flex items-center gap-1"><Bathtub className="w-3.5 h-3.5" />{tipe.kamarMandi} KM</span>
                      </div>
                      {(tipe.spesifikasiAtap || tipe.spesifikasiDinding || tipe.spesifikasiLantai || tipe.spesifikasiPondasi) && (
                        <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                          {tipe.spesifikasiAtap && <p><span className="font-medium text-foreground">Atap:</span> {tipe.spesifikasiAtap}</p>}
                          {tipe.spesifikasiDinding && <p><span className="font-medium text-foreground">Dinding:</span> {tipe.spesifikasiDinding}</p>}
                          {tipe.spesifikasiLantai && <p><span className="font-medium text-foreground">Lantai:</span> {tipe.spesifikasiLantai}</p>}
                          {tipe.spesifikasiPondasi && <p><span className="font-medium text-foreground">Pondasi:</span> {tipe.spesifikasiPondasi}</p>}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-10 text-muted-foreground text-sm">Tidak ada detail tipe rumah.</div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer actions */}
            <Separator />
            <div className="p-4 flex gap-2 shrink-0 bg-muted/20">
              <Button variant="outline" onClick={onClose} className="flex-1 h-10">
                Tutup
              </Button>
              <Link href={`/perumahan/${data.idLokasi}`} className="flex-1" onClick={onClose}>
                <Button className="w-full h-10 font-semibold">
                  Lihat Detail Lengkap
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  );
}
