import React from 'react';
import Image from 'next/image';
import { MapPin, Heart, Users, Buildings } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface TipeRumah {
  id: number;
  status: string;
  nama: string;
  harga: number;
  kamarTidur: number;
  kamarMandi: number;
  luasTanah: number;
  luasBangunan: number;
  spesifikasiAtap?: string;
  spesifikasiDinding?: string;
  spesifikasiLantai?: string;
  spesifikasiPondasi?: string;
}

export interface KantorPemasaran {
  alamat: string;
  nomor?: string;
  noTelp?: string;
  email?: string;
}

export interface Perumahan {
  idLokasi: string;
  namaPerumahan: string;
  jenisPerumahan: string;
  jumlahUnit: number;
  jumlahUnitKomersil: number;
  foto: string[];
  koordinatPerumahan?: string;
  tipeRumah: TipeRumah[];
  kantorPemasaran?: KantorPemasaran[];
  wilayah: {
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    kelurahan: string;
  };
  pengembang: {
    nama: string;
    asosiasi?: string;
  };
}

export function HouseCard({
  data,
  onClick,
  isFavorite = false,
  onToggleFavorite
}: {
  data: Perumahan;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}) {
  const imageUrl = data.foto && data.foto.length > 0 ? data.foto[0] : '';
  let validImageUrl = imageUrl;
  if (validImageUrl && !validImageUrl.startsWith('http')) {
    validImageUrl = `https://sikumbang.tapera.go.id${validImageUrl.startsWith('/') ? '' : '/'}${validImageUrl}`;
  }

  // Format currency
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  const hargaMulai = data.tipeRumah && data.tipeRumah.length > 0
    ? Math.min(...data.tipeRumah.map(t => t.harga))
    : 0;

  const hasSubsidi = data.tipeRumah?.some(t => t.status === 'subsidi');
  const hasKomersil = data.tipeRumah?.some(t => t.status === 'komersil');

  return (
    <div
      onClick={onClick}
      className={cn("group flex flex-col overflow-hidden rounded-2xl bg-card border shadow-sm transition-all hover:shadow-md hover:-translate-y-1 duration-300 relative", onClick && "cursor-pointer")}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(e);
        }}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur shadow-sm hover:scale-110 transition-transform"
      >
        <Heart
          weight={isFavorite ? "fill" : "regular"}
          className={cn("w-5 h-5 transition-colors", isFavorite ? "text-red-500" : "text-muted-foreground")}
        />
      </button>

      <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
        {validImageUrl ? (
          <Image
            src={validImageUrl}
            alt={data.namaPerumahan}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              if (e.target && (e.target as any).nextElementSibling) {
                (e.target as any).nextElementSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}

        {/* Fallback Icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 bg-muted" style={{ display: validImageUrl ? 'none' : 'flex' }}>
          <Buildings weight="duotone" className="w-12 h-12 mb-2" />
          <span className="text-xs font-medium">Foto tidak tersedia</span>
        </div>

        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {hasSubsidi && (
            <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm">
              Subsidi
            </span>
          )}
          {hasKomersil && (
            <span className="rounded-full bg-blue-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm">
              Komersil
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2">
          <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-card-foreground">
            {data.namaPerumahan}
          </h3>
          <p className="line-clamp-1 text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {data.pengembang?.nama || 'Pengembang Tidak Diketahui'}
          </p>
        </div>

        <div className="mb-4 flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2 leading-relaxed">
            {data.wilayah?.kelurahan}, {data.wilayah?.kecamatan}, {data.wilayah?.kabupaten}, {data.wilayah?.provinsi}
          </span>
        </div>

        <div className="mt-auto border-t pt-4">
          <p className="text-xs text-muted-foreground mb-1">Mulai dari</p>
          <div className="flex items-end justify-between">
            <span className="text-lg font-bold text-primary">
              {hargaMulai > 0 ? formatRupiah(hargaMulai) : 'Harga tidak tersedia'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
