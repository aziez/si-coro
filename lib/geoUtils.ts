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

/**
 * Returns the top N nearest KRL stations by straight-line distance
 * Used as candidates for actual road routing (OSRM)
 */
export function getNearestStations(
  lat: number,
  lon: number,
  limit = 3
): { station: Station; straightDistanceKm: number }[] {
  return KRL_STATIONS.map((station) => ({
    station,
    straightDistanceKm: calculateDistance(lat, lon, station.lat, station.lon),
  }))
    .sort((a, b) => a.straightDistanceKm - b.straightDistanceKm)
    .slice(0, limit);
}

// ─── KRL Network Graph & Official Fare Calculation ───────────────────────────

export interface KrlLineDefinition {
  id: string;
  name: string;
  color: string;
  stations: string[];
}

export const KRL_LINES_NETWORK: KrlLineDefinition[] = [
  {
    id: "bogor",
    name: "Lin Bogor",
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
    id: "nambo",
    name: "Lin Nambo",
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
    id: "cikarang-selatan",
    name: "Lin Cikarang (Via Manggarai)",
    color: "#3498db",
    stations: [
      "Stasiun Angke",
      "Stasiun Duri",
      "Stasiun Tanah Abang",
      "Stasiun Karet",
      "Stasiun BNI City",
      "Stasiun Sudirman",
      "Stasiun Manggarai",
      "Stasiun Matraman",
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
    id: "cikarang-utara",
    name: "Lin Cikarang (Via Pasar Senen)",
    color: "#2980b9",
    stations: [
      "Stasiun Kampung Bandan",
      "Stasiun Rajawali",
      "Stasiun Kemayoran",
      "Stasiun Pasar Senen",
      "Stasiun Gang Sentiong",
      "Stasiun Kramat",
      "Stasiun Pondok Jati",
      "Stasiun Jatinegara",
    ],
  },
  {
    id: "rangkasbitung",
    name: "Lin Rangkasbitung",
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
    id: "tangerang",
    name: "Lin Tangerang",
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
    id: "tanjung-priok",
    name: "Lin Tanjung Priok",
    color: "#e67e22",
    stations: [
      "Stasiun Jakarta Kota",
      "Stasiun Kampung Bandan",
      "Stasiun Ancol",
      "Stasiun Tanjung Priok",
    ],
  },
];

export const POPULAR_WORK_STATIONS = [
  "Stasiun Sudirman",
  "Stasiun Tanah Abang",
  "Stasiun Manggarai",
  "Stasiun Gondangdia",
  "Stasiun Juanda",
  "Stasiun Jakarta Kota",
  "Stasiun Tebet",
  "Stasiun Cawang",
  "Stasiun Palmerah",
  "Stasiun Kebayoran",
  "Stasiun Duri",
  "Stasiun Pasar Senen",
  "Stasiun Jatinegara",
];

export interface KrlRouteSummary {
  fromStation: string;
  toStation: string;
  railDistanceKm: number;
  railDurationMinutes: number;
  fareOneWay: number;
  transits: string[];
  linesUsed: string[];
  stationCount: number;
  pathCoordinates: [number, number][];
}

/**
 * Official KAI Commuter Jabodetabek Tariff Formula:
 * Rp 3.000 for the first 1-25 km, plus Rp 1.000 for every subsequent 10 km (or fraction thereof).
 */
export function calculateKrlFare(railDistanceKm: number): number {
  if (railDistanceKm <= 0) return 3000;
  if (railDistanceKm <= 25) return 3000;
  const extraKm = railDistanceKm - 25;
  return 3000 + Math.ceil(extraKm / 10) * 1000;
}

/**
 * Finds shortest rail path & transit stations between two KRL stations
 * using Dijkstra over the KRL Jabodetabek station network.
 */
export function calculateKrlRoute(
  fromStationName: string,
  toStationName: string
): KrlRouteSummary | null {
  const stationMap = new Map<string, Station>(
    KRL_STATIONS.map((s) => [s.name, s])
  );
  if (!stationMap.has(fromStationName) || !stationMap.has(toStationName)) {
    return null;
  }

  if (fromStationName === toStationName) {
    const st = stationMap.get(fromStationName)!;
    return {
      fromStation: fromStationName,
      toStation: toStationName,
      railDistanceKm: 0,
      railDurationMinutes: 0,
      fareOneWay: 3000,
      transits: [],
      linesUsed: [],
      stationCount: 0,
      pathCoordinates: [[st.lat, st.lon]],
    };
  }

  interface Edge {
    to: string;
    lineName: string;
    distanceKm: number;
  }

  const adjacency = new Map<string, Edge[]>();
  const addEdge = (a: string, b: string, lineName: string) => {
    const stA = stationMap.get(a);
    const stB = stationMap.get(b);
    if (!stA || !stB) return;
    // Rail track curvature factor (~1.12x segment straight distance between adjacent stations)
    const dist = calculateDistance(stA.lat, stA.lon, stB.lat, stB.lon) * 1.12;
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push({ to: b, lineName, distanceKm: dist });
    adjacency.get(b)!.push({ to: a, lineName, distanceKm: dist });
  };

  for (const line of KRL_LINES_NETWORK) {
    for (let i = 0; i < line.stations.length - 1; i++) {
      addEdge(line.stations[i], line.stations[i + 1], line.name);
    }
  }

  // State: stationName
  const distMap = new Map<string, number>();
  const prevMap = new Map<
    string,
    { prevStation: string; lineName: string; segmentKm: number }
  >();
  const visited = new Set<string>();

  distMap.set(fromStationName, 0);

  while (true) {
    let current: string | null = null;
    let bestDist = Infinity;
    for (const [st, d] of distMap.entries()) {
      if (!visited.has(st) && d < bestDist) {
        bestDist = d;
        current = st;
      }
    }

    if (!current || current === toStationName) break;
    visited.add(current);

    const currentPrev = prevMap.get(current);
    const edges = adjacency.get(current) ?? [];
    for (const edge of edges) {
      if (visited.has(edge.to)) continue;
      // Add small penalty for changing lines so same-line routes are preferred
      const lineChangePenalty =
        currentPrev && currentPrev.lineName !== edge.lineName ? 1.5 : 0;
      const candidateCost = bestDist + edge.distanceKm + lineChangePenalty;
      if (candidateCost < (distMap.get(edge.to) ?? Infinity)) {
        distMap.set(edge.to, candidateCost);
        prevMap.set(edge.to, {
          prevStation: current,
          lineName: edge.lineName,
          segmentKm: edge.distanceKm,
        });
      }
    }
  }

  if (!prevMap.has(toStationName)) return null;

  const pathStations: string[] = [toStationName];
  const segmentLines: string[] = [];
  let totalRailKm = 0;
  let cursor = toStationName;

  while (cursor !== fromStationName) {
    const step = prevMap.get(cursor);
    if (!step) break;
    totalRailKm += step.segmentKm;
    segmentLines.unshift(step.lineName);
    pathStations.unshift(step.prevStation);
    cursor = step.prevStation;
  }

  const transits: string[] = [];
  const linesUsed: string[] = [];
  for (let i = 0; i < segmentLines.length; i++) {
    const ln = segmentLines[i];
    if (linesUsed[linesUsed.length - 1] !== ln) {
      linesUsed.push(ln);
      if (i > 0) {
        transits.push(pathStations[i]);
      }
    }
  }

  const stationCount = Math.max(0, pathStations.length - 1);
  // Average KRL speed ~38 km/h + 1 min dwell per station + 6 min per transit
  const railDurationMinutes = Math.round(
    (totalRailKm / 38) * 60 + stationCount * 1.1 + transits.length * 6
  );

  const pathCoordinates: [number, number][] = pathStations
    .map((name) => stationMap.get(name))
    .filter((s): s is Station => Boolean(s))
    .map((s) => [s.lat, s.lon]);

  return {
    fromStation: fromStationName,
    toStation: toStationName,
    railDistanceKm: Number(totalRailKm.toFixed(1)),
    railDurationMinutes,
    fareOneWay: calculateKrlFare(totalRailKm),
    transits,
    linesUsed,
    stationCount,
    pathCoordinates,
  };
}

export type FirstMileMode = "motor" | "ojol" | "angkot";

export interface FirstMileEstimate {
  mode: FirstMileMode;
  label: string;
  dailyRoundTripCost: number;
  oneWayDurationMinutes: number;
  note: string;
}

/**
 * Estimates daily round-trip first-mile cost from property to nearest KRL station
 * using actual road distance (km) and driving duration.
 */
export function calculateFirstMileCost(
  roadDistanceKm: number,
  roadDurationMinutes?: number
): Record<FirstMileMode, FirstMileEstimate> {
  const d = Math.max(0.5, roadDistanceKm);
  const baseDriveMin =
    roadDurationMinutes ?? Math.max(3, Math.round((d / 28) * 60));

  // 1. Motor Pribadi: BBM ~Rp 350/km x 2 (PP) + Parkir Inap Stasiun Rp 6.000/hari
  const motorFuelPP = Math.round((d * 2 * 350) / 500) * 500;
  const motorParking = 6000;
  const motorDaily = motorFuelPP + motorParking;

  // 2. Ojek Online (GoRide/GrabBike): Rp 11.000 untuk 4 km pertama + Rp 2.500/km selanjutnya (sekali jalan)
  const ojolOneWay =
    d <= 4 ? 11000 : 11000 + Math.ceil(d - 4) * 2500;
  const ojolDaily = ojolOneWay * 2;

  // 3. Angkot / Mikrotrans / Feeder: Rp 5.000 untuk <=5 km, Rp 7.000 untuk >5 km (sekali jalan)
  const angkotOneWay = d <= 5 ? 5000 : d <= 10 ? 7000 : 10000;
  const angkotDaily = angkotOneWay * 2;

  return {
    motor: {
      mode: "motor",
      label: "Motor Pribadi + Parkir Stasiun",
      dailyRoundTripCost: motorDaily,
      oneWayDurationMinutes: baseDriveMin,
      note: `BBM PP ~Rp${motorFuelPP.toLocaleString("id-ID")} + Parkir Inap Rp6.000/hr`,
    },
    ojol: {
      mode: "ojol",
      label: "Ojek Online (PP)",
      dailyRoundTripCost: ojolDaily,
      oneWayDurationMinutes: baseDriveMin + 3,
      note: `~Rp${ojolOneWay.toLocaleString("id-ID")} sekali jalan (${d.toFixed(1)} km)`,
    },
    angkot: {
      mode: "angkot",
      label: "Angkot / Feeder Umum (PP)",
      dailyRoundTripCost: angkotDaily,
      oneWayDurationMinutes: Math.round(baseDriveMin * 1.45) + 5,
      note: `~Rp${angkotOneWay.toLocaleString("id-ID")} sekali jalan`,
    },
  };
}
