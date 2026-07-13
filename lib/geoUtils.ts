// lib/geoUtils.ts

export interface Station {
  name: string;
  lat: number;
  lon: number;
}

// Coordinate of Monas as Jakarta Center
export const JAKARTA_CENTER = { lat: -6.175110, lon: 106.827153 };

// Major KRL Stations in Jabodetabek
export const KRL_STATIONS: Station[] = [
  // --- JALUR PUSAT / TRANSIT UTAMA ---
  { name: 'Stasiun Jakarta Kota', lat: -6.1375, lon: 106.8146 },
  { name: 'Stasiun Manggarai', lat: -6.2098, lon: 106.8502 },
  { name: 'Stasiun Sudirman', lat: -6.2023, lon: 106.8229 },
  { name: 'Stasiun BNI City', lat: -6.2019, lon: 106.8197 },
  { name: 'Stasiun Karet', lat: -6.2016, lon: 106.8166 },
  { name: 'Stasiun Tanah Abang', lat: -6.1852, lon: 106.8105 },
  { name: 'Stasiun Duri', lat: -6.1558, lon: 106.8009 },
  { name: 'Stasiun Angke', lat: -6.1444, lon: 106.7981 },
  { name: 'Stasiun Kampung Bandan', lat: -6.1325, lon: 106.8322 },

  // --- BOGOR LINE (JAKARTA KOTA - BOGOR) ---
  { name: 'Stasiun Jayakarta', lat: -6.1413, lon: 106.8225 },
  { name: 'Stasiun Mangga Besar', lat: -6.1495, lon: 106.8250 },
  { name: 'Stasiun Sawah Besar', lat: -6.1605, lon: 106.8271 },
  { name: 'Stasiun Juanda', lat: -6.1668, lon: 106.8282 },
  { name: 'Stasiun Gondangdia', lat: -6.1863, lon: 106.8327 },
  { name: 'Stasiun Cikini', lat: -6.1985, lon: 106.8424 },
  { name: 'Stasiun Tebet', lat: -6.2266, lon: 106.8584 },
  { name: 'Stasiun Cawang', lat: -6.2426, lon: 106.8587 },
  { name: 'Stasiun Duren Kalibata', lat: -6.2554, lon: 106.8553 },
  { name: 'Stasiun Pasar Minggu Baru', lat: -6.2690, lon: 106.8492 },
  { name: 'Stasiun Pasar Minggu', lat: -6.2844, lon: 106.8441 },
  { name: 'Stasiun Tanjung Barat', lat: -6.3075, lon: 106.8386 },
  { name: 'Stasiun Lenteng Agung', lat: -6.3308, lon: 106.8349 },
  { name: 'Stasiun Universitas Pancasila', lat: -6.3465, lon: 106.8335 },
  { name: 'Stasiun Universitas Indonesia', lat: -6.3606, lon: 106.8317 },
  { name: 'Stasiun Pondok Cina', lat: -6.3690, lon: 106.8315 },
  { name: 'Stasiun Depok Baru', lat: -6.3916, lon: 106.8185 },
  { name: 'Stasiun Depok', lat: -6.4045, lon: 106.8164 },
  { name: 'Stasiun Citayam', lat: -6.4497, lon: 106.8021 },
  { name: 'Stasiun Bojong Gede', lat: -6.4939, lon: 106.7946 },
  { name: 'Stasiun Cilebut', lat: -6.5319, lon: 106.7909 },
  { name: 'Stasiun Bogor', lat: -6.5944, lon: 106.7892 },

  // --- CABANG NAMBO (DARI CITAYAM) ---
  { name: 'Stasiun Pondok Rajeg', lat: -6.4468, lon: 106.8267 },
  { name: 'Stasiun Cibinong', lat: -6.4789, lon: 106.8504 },
  { name: 'Stasiun Gunung Putri', lat: -6.4526, lon: 106.8970 },
  { name: 'Stasiun Nambo', lat: -6.4632, lon: 106.9189 },

  // --- LINGKAR CIKARANG LINE (MANGGARAI/PASAR SENEN - CIKARANG) ---
  { name: 'Stasiun Jatinegara', lat: -6.2151, lon: 106.8680 },
  { name: 'Stasiun Klender', lat: -6.2135, lon: 106.9015 },
  { name: 'Stasiun Buaran', lat: -6.2197, lon: 106.9298 },
  { name: 'Stasiun Klender Baru', lat: -6.2227, lon: 106.9439 },
  { name: 'Stasiun Cakung', lat: -6.2252, lon: 106.9536 },
  { name: 'Stasiun Kranji', lat: -6.2242, lon: 106.9788 },
  { name: 'Stasiun Bekasi', lat: -6.2361, lon: 106.9997 },
  { name: 'Stasiun Bekasi Timur', lat: -6.2441, lon: 107.0163 },
  { name: 'Stasiun Tambun', lat: -6.2612, lon: 107.0620 },
  { name: 'Stasiun Cibitung', lat: -6.2604, lon: 107.0894 },
  { name: 'Stasiun Metland Telagamurni', lat: -6.2617, lon: 107.1128 },
  { name: 'Stasiun Cikarang', lat: -6.2612, lon: 107.1444 },

  // --- JALUR LINGKAR UTARA & PASAR SENEN (MANGGARAI - KAMPUNG BANDAN) ---
  { name: 'Stasiun Matraman', lat: -6.2114, lon: 106.8576 },
  { name: 'Stasiun Pondok Jati', lat: -6.2084, lon: 106.8619 },
  { name: 'Stasiun Kramat', lat: -6.1936, lon: 106.8558 },
  { name: 'Stasiun Gang Sentiong', lat: -6.1849, lon: 106.8504 },
  { name: 'Stasiun Pasar Senen', lat: -6.1744, lon: 106.8443 },
  { name: 'Stasiun Kemayoran', lat: -6.1624, lon: 106.8398 },
  { name: 'Stasiun Rajawali', lat: -6.1449, lon: 106.8364 },

  // --- RANGKASBITUNG LINE (TANAH ABANG - RANGKASBITUNG) ---
  { name: 'Stasiun Palmerah', lat: -6.2076, lon: 106.7972 },
  { name: 'Stasiun Kebayoran', lat: -6.2372, lon: 106.7828 },
  { name: 'Stasiun Pondok Ranji', lat: -6.2731, lon: 106.7455 },
  { name: 'Stasiun Jurang Mangu', lat: -6.2872, lon: 106.7303 },
  { name: 'Stasiun Sudimara', lat: -6.2952, lon: 106.7230 },
  { name: 'Stasiun Rawa Buntu', lat: -6.3159, lon: 106.6800 },
  { name: 'Stasiun Serpong', lat: -6.3188, lon: 106.6627 },
  { name: 'Stasiun Cisauk', lat: -6.3236, lon: 106.6429 },
  { name: 'Stasiun Cicayur', lat: -6.3255, lon: 106.6111 },
  { name: 'Stasiun Jatake', lat: -6.3242, lon: 106.5912 },
  { name: 'Stasiun Parung Panjang', lat: -6.3189, lon: 106.5684 },
  { name: 'Stasiun Cilejit', lat: -6.3211, lon: 106.4952 },
  { name: 'Stasiun Daru', lat: -6.3276, lon: 106.4592 },
  { name: 'Stasiun Tenjo', lat: -6.3298, lon: 106.4024 },
  { name: 'Stasiun Tigaraksa', lat: -6.3275, lon: 106.3688 },
  { name: 'Stasiun Cikoya', lat: -6.3244, lon: 106.3475 },
  { name: 'Stasiun Maja', lat: -6.3323, lon: 106.3005 },
  { name: 'Stasiun Citeras', lat: -6.3314, lon: 106.1969 },
  { name: 'Stasiun Rangkasbitung', lat: -6.3536, lon: 106.2464 },

  // --- TANGERANG LINE (DURI - TANGERANG) ---
  { name: 'Stasiun Grogol', lat: -6.1627, lon: 106.7876 },
  { name: 'Stasiun Pesing', lat: -6.1601, lon: 106.7667 },
  { name: 'Stasiun Taman Kota', lat: -6.1607, lon: 106.7441 },
  { name: 'Stasiun Bojong Indah', lat: -6.1633, lon: 106.7262 },
  { name: 'Stasiun Rawa Buaya', lat: -6.1626, lon: 106.7176 },
  { name: 'Stasiun Kalideres', lat: -6.1554, lon: 106.6974 },
  { name: 'Stasiun Poris', lat: -6.1627, lon: 106.6705 },
  { name: 'Stasiun Batu Ceper', lat: -6.1697, lon: 106.6628 },
  { name: 'Stasiun Tanah Tinggi', lat: -6.1751, lon: 106.6508 },
  { name: 'Stasiun Tangerang', lat: -6.1756, lon: 106.6322 },

  // --- TANJUNG PRIOK LINE (JAKARTA KOTA - TANJUNG PRIOK) ---
  { name: 'Stasiun Ancol', lat: -6.1284, lon: 106.8488 },
  { name: 'Stasiun Tanjung Priok', lat: -6.1111, lon: 106.8811 }
];


/**
 * Calculates straight-line distance between two coordinates in kilometers
 * Using the Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest KRL station from a given coordinate
 */
export function getNearestStation(lat: number, lon: number): { station: Station; distance: number } {
  let nearest = KRL_STATIONS[0];
  let minDistance = calculateDistance(lat, lon, nearest.lat, nearest.lon);

  for (let i = 1; i < KRL_STATIONS.length; i++) {
    const dist = calculateDistance(lat, lon, KRL_STATIONS[i].lat, KRL_STATIONS[i].lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = KRL_STATIONS[i];
    }
  }

  return { station: nearest, distance: minDistance };
}

/**
 * Gets distance to Jakarta Center
 */
export function getDistanceToJakarta(lat: number, lon: number): number {
  return calculateDistance(lat, lon, JAKARTA_CENTER.lat, JAKARTA_CENTER.lon);
}
