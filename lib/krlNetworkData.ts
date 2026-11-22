// lib/krlNetworkData.ts
// Auto-curated from OpenStreetMap official KAI Commuter Line Jabodetabek relations:
// - Bogor & Nambo Line (OSM master 16877214)
// - Cikarang Loop Line via Manggarai & Pasar Senen (OSM master 15097508)
// - Rangkasbitung Line (OSM relation 2922215)
// - Tangerang Line (OSM master 17193464)
// - Tanjung Priok Line (OSM master 17193009)
// Track polylines follow actual railway corridors (RDP-simplified ~18m tolerance).

export type KrlLineId =
  | "bogor"
  | "nambo"
  | "cikarang-selatan"
  | "cikarang-utara"
  | "rangkasbitung"
  | "tangerang"
  | "tanjung-priok"

export interface Station {
  name: string
  code: string
  lat: number
  lon: number
  lines: KrlLineId[]
  isInterchange?: boolean
}

export interface KrlLineDefinition {
  id: KrlLineId
  name: string
  shortName: string
  code: string
  color: string
  corridor: string
  stations: string[]
  /** Actual OpenStreetMap railway track geometry ([lat, lon][]) */
  trackCoordinates: [number, number][]
}

export const KRL_STATIONS_DATA: Station[] = [
  {
    "name": "Stasiun Jakarta Kota",
    "code": "JAKK",
    "lat": -6.13738,
    "lon": 106.81621,
    "lines": [
      "bogor",
      "tanjung-priok"
    ],
    "isInterchange": true
  },
  {
    "name": "Stasiun Kampung Bandan",
    "code": "KPB",
    "lat": -6.13272,
    "lon": 106.82894,
    "lines": [
      "cikarang-selatan",
      "cikarang-utara",
      "tanjung-priok"
    ],
    "isInterchange": true
  },
  {
    "name": "Stasiun Duri",
    "code": "DU",
    "lat": -6.15444,
    "lon": 106.80136,
    "lines": [
      "cikarang-selatan",
      "tangerang"
    ],
    "isInterchange": true
  },
  {
    "name": "Stasiun Tanah Abang",
    "code": "THB",
    "lat": -6.18257,
    "lon": 106.81066,
    "lines": [
      "cikarang-selatan",
      "rangkasbitung"
    ],
    "isInterchange": true
  },
  {
    "name": "Stasiun Manggarai",
    "code": "MRI",
    "lat": -6.20947,
    "lon": 106.84944,
    "lines": [
      "bogor",
      "cikarang-selatan"
    ],
    "isInterchange": true
  },
  {
    "name": "Stasiun Jatinegara",
    "code": "JNG",
    "lat": -6.21502,
    "lon": 106.86928,
    "lines": [
      "cikarang-selatan",
      "cikarang-utara"
    ],
    "isInterchange": true
  },
  {
    "name": "Stasiun Citayam",
    "code": "CTA",
    "lat": -6.44801,
    "lon": 106.80261,
    "lines": [
      "bogor",
      "nambo"
    ],
    "isInterchange": true
  },
  {
    "name": "Stasiun Jayakarta",
    "code": "JAY",
    "lat": -6.14071,
    "lon": 106.82279,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Mangga Besar",
    "code": "MGB",
    "lat": -6.14884,
    "lon": 106.82684,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Sawah Besar",
    "code": "SW",
    "lat": -6.15944,
    "lon": 106.8275,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Juanda",
    "code": "JUA",
    "lat": -6.16516,
    "lon": 106.83016,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Gondangdia",
    "code": "GDD",
    "lat": -6.18455,
    "lon": 106.83243,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Cikini",
    "code": "CKI",
    "lat": -6.19742,
    "lon": 106.84044,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Tebet",
    "code": "TEB",
    "lat": -6.22593,
    "lon": 106.85843,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Cawang",
    "code": "CW",
    "lat": -6.24255,
    "lon": 106.85871,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Duren Kalibata",
    "code": "DRN",
    "lat": -6.25341,
    "lon": 106.85598,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Pasar Minggu Baru",
    "code": "PSMB",
    "lat": -6.2624,
    "lon": 106.85198,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Pasar Minggu",
    "code": "PSM",
    "lat": -6.2815,
    "lon": 106.84519,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Tanjung Barat",
    "code": "TNT",
    "lat": -6.30771,
    "lon": 106.83902,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Lenteng Agung",
    "code": "LNA",
    "lat": -6.32921,
    "lon": 106.83416,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Universitas Pancasila",
    "code": "UP",
    "lat": -6.33908,
    "lon": 106.83434,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Universitas Indonesia",
    "code": "UI",
    "lat": -6.3588,
    "lon": 106.83163,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Pondok Cina",
    "code": "POC",
    "lat": -6.37051,
    "lon": 106.83163,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Depok Baru",
    "code": "DPB",
    "lat": -6.39037,
    "lon": 106.82206,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Depok",
    "code": "DP",
    "lat": -6.40284,
    "lon": 106.81762,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Bojong Gede",
    "code": "BJD",
    "lat": -6.49196,
    "lon": 106.7951,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Cilebut",
    "code": "CLT",
    "lat": -6.52989,
    "lon": 106.80077,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Bogor",
    "code": "BOO",
    "lat": -6.59429,
    "lon": 106.79079,
    "lines": [
      "bogor"
    ]
  },
  {
    "name": "Stasiun Pondok Rajeg",
    "code": "PDRG",
    "lat": -6.46057,
    "lon": 106.82481,
    "lines": [
      "nambo"
    ]
  },
  {
    "name": "Stasiun Cibinong",
    "code": "CBN",
    "lat": -6.46419,
    "lon": 106.85204,
    "lines": [
      "nambo"
    ]
  },
  {
    "name": "Stasiun Nambo",
    "code": "NMO",
    "lat": -6.46682,
    "lon": 106.90552,
    "lines": [
      "nambo"
    ]
  },
  {
    "name": "Stasiun Angke",
    "code": "AK",
    "lat": -6.14354,
    "lon": 106.80069,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Karet",
    "code": "KRT",
    "lat": -6.20076,
    "lon": 106.81597,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun BNI City",
    "code": "BNC",
    "lat": -6.20135,
    "lon": 106.81868,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Sudirman",
    "code": "SUD",
    "lat": -6.2026,
    "lon": 106.82434,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Matraman",
    "code": "MTR",
    "lat": -6.21289,
    "lon": 106.85891,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Klender",
    "code": "KLD",
    "lat": -6.21341,
    "lon": 106.90064,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Buaran",
    "code": "BUA",
    "lat": -6.21533,
    "lon": 106.9214,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Klender Baru",
    "code": "KLDB",
    "lat": -6.21749,
    "lon": 106.93926,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Cakung",
    "code": "CUK",
    "lat": -6.21909,
    "lon": 106.95206,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Kranji",
    "code": "KRI",
    "lat": -6.22383,
    "lon": 106.97889,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Bekasi",
    "code": "BKS",
    "lat": -6.23524,
    "lon": 106.99713,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Bekasi Timur",
    "code": "BKST",
    "lat": -6.24726,
    "lon": 107.01922,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Tambun",
    "code": "TB",
    "lat": -6.2588,
    "lon": 107.05644,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Cibitung",
    "code": "CIT",
    "lat": -6.26156,
    "lon": 107.08565,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Metland Telagamurni",
    "code": "MTM",
    "lat": -6.2573,
    "lon": 107.1124,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Cikarang",
    "code": "CKR",
    "lat": -6.25558,
    "lon": 107.14575,
    "lines": [
      "cikarang-selatan"
    ]
  },
  {
    "name": "Stasiun Rajawali",
    "code": "RJW",
    "lat": -6.14633,
    "lon": 106.83717,
    "lines": [
      "cikarang-utara"
    ]
  },
  {
    "name": "Stasiun Kemayoran",
    "code": "KMO",
    "lat": -6.16255,
    "lon": 106.84174,
    "lines": [
      "cikarang-utara"
    ]
  },
  {
    "name": "Stasiun Pasar Senen",
    "code": "PSE",
    "lat": -6.17528,
    "lon": 106.84478,
    "lines": [
      "cikarang-utara"
    ]
  },
  {
    "name": "Stasiun Gang Sentiong",
    "code": "GST",
    "lat": -6.18643,
    "lon": 106.85104,
    "lines": [
      "cikarang-utara"
    ]
  },
  {
    "name": "Stasiun Kramat",
    "code": "KMT",
    "lat": -6.19406,
    "lon": 106.8568,
    "lines": [
      "cikarang-utara"
    ]
  },
  {
    "name": "Stasiun Pondok Jati",
    "code": "POK",
    "lat": -6.21076,
    "lon": 106.86289,
    "lines": [
      "cikarang-utara"
    ]
  },
  {
    "name": "Stasiun Palmerah",
    "code": "PLM",
    "lat": -6.20622,
    "lon": 106.79805,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Kebayoran",
    "code": "KBY",
    "lat": -6.23599,
    "lon": 106.78296,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Pondok Ranji",
    "code": "PDJ",
    "lat": -6.27633,
    "lon": 106.74521,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Jurang Mangu",
    "code": "JMG",
    "lat": -6.28853,
    "lon": 106.72926,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Sudimara",
    "code": "SDM",
    "lat": -6.29625,
    "lon": 106.71374,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Rawa Buntu",
    "code": "RU",
    "lat": -6.31455,
    "lon": 106.67678,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Serpong",
    "code": "SRP",
    "lat": -6.32018,
    "lon": 106.66663,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Cisauk",
    "code": "CSK",
    "lat": -6.32403,
    "lon": 106.64246,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Cicayur",
    "code": "CC",
    "lat": -6.32923,
    "lon": 106.62019,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Jatake",
    "code": "JTK",
    "lat": -6.33476,
    "lon": 106.60774,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Parung Panjang",
    "code": "PRP",
    "lat": -6.34439,
    "lon": 106.5703,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Cilejit",
    "code": "CJT",
    "lat": -6.35484,
    "lon": 106.5105,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Daru",
    "code": "DAR",
    "lat": -6.3388,
    "lon": 106.49296,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Tenjo",
    "code": "TEJ",
    "lat": -6.32753,
    "lon": 106.46204,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Tigaraksa",
    "code": "TGS",
    "lat": -6.32845,
    "lon": 106.43509,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Cikoya",
    "code": "CKY",
    "lat": -6.33565,
    "lon": 106.41254,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Maja",
    "code": "MJ",
    "lat": -6.33269,
    "lon": 106.39692,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Citeras",
    "code": "CTR",
    "lat": -6.33489,
    "lon": 106.33393,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Rangkasbitung",
    "code": "RK",
    "lat": -6.35311,
    "lon": 106.25313,
    "lines": [
      "rangkasbitung"
    ]
  },
  {
    "name": "Stasiun Grogol",
    "code": "GRG",
    "lat": -6.162,
    "lon": 106.78727,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Pesing",
    "code": "PSG",
    "lat": -6.16119,
    "lon": 106.77159,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Taman Kota",
    "code": "TKO",
    "lat": -6.15818,
    "lon": 106.75456,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Bojong Indah",
    "code": "BOI",
    "lat": -6.16054,
    "lon": 106.73503,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Rawa Buaya",
    "code": "RW",
    "lat": -6.16276,
    "lon": 106.72278,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Kalideres",
    "code": "KDS",
    "lat": -6.16615,
    "lon": 106.70251,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Poris",
    "code": "PI",
    "lat": -6.16979,
    "lon": 106.68027,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Batu Ceper",
    "code": "BPR",
    "lat": -6.17241,
    "lon": 106.66394,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Tanah Tinggi",
    "code": "TTI",
    "lat": -6.1753,
    "lon": 106.64573,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Tangerang",
    "code": "TNG",
    "lat": -6.17681,
    "lon": 106.63072,
    "lines": [
      "tangerang"
    ]
  },
  {
    "name": "Stasiun Ancol",
    "code": "AC",
    "lat": -6.12786,
    "lon": 106.84646,
    "lines": [
      "tanjung-priok"
    ]
  },
  {
    "name": "Stasiun Tanjung Priok",
    "code": "TPK",
    "lat": -6.1106,
    "lon": 106.88145,
    "lines": [
      "tanjung-priok"
    ]
  }
]

export const KRL_LINES_DATA: KrlLineDefinition[] = [
  {
    "id": "bogor",
    "name": "Lin Bogor",
    "shortName": "Bogor",
    "code": "B",
    "color": "#E11D48",
    "corridor": "Jakarta Kota ↔ Bogor",
    "stations": [
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
      "Stasiun Bogor"
    ],
    "trackCoordinates": [
      [
        -6.1378,
        106.81483
      ],
      [
        -6.13636,
        106.8197
      ],
      [
        -6.13637,
        106.82038
      ],
      [
        -6.13674,
        106.82121
      ],
      [
        -6.13747,
        106.82178
      ],
      [
        -6.14099,
        106.82293
      ],
      [
        -6.14714,
        106.82641
      ],
      [
        -6.15187,
        106.82731
      ],
      [
        -6.16042,
        106.82761
      ],
      [
        -6.162,
        106.8282
      ],
      [
        -6.16453,
        106.82987
      ],
      [
        -6.16612,
        106.83042
      ],
      [
        -6.16838,
        106.8305
      ],
      [
        -6.17138,
        106.82982
      ],
      [
        -6.17302,
        106.82982
      ],
      [
        -6.1759,
        106.83043
      ],
      [
        -6.18006,
        106.8318
      ],
      [
        -6.18583,
        106.83261
      ],
      [
        -6.18769,
        106.83328
      ],
      [
        -6.20113,
        106.84321
      ],
      [
        -6.20926,
        106.8489
      ],
      [
        -6.21925,
        106.8567
      ],
      [
        -6.22127,
        106.85781
      ],
      [
        -6.22418,
        106.8584
      ],
      [
        -6.24568,
        106.85875
      ],
      [
        -6.24706,
        106.85859
      ],
      [
        -6.24919,
        106.85789
      ],
      [
        -6.27517,
        106.84646
      ],
      [
        -6.28563,
        106.84446
      ],
      [
        -6.29604,
        106.84066
      ],
      [
        -6.3018,
        106.84002
      ],
      [
        -6.31976,
        106.83692
      ],
      [
        -6.32194,
        106.83612
      ],
      [
        -6.32471,
        106.83432
      ],
      [
        -6.32589,
        106.83385
      ],
      [
        -6.32801,
        106.83377
      ],
      [
        -6.33117,
        106.83509
      ],
      [
        -6.33368,
        106.8355
      ],
      [
        -6.34179,
        106.83371
      ],
      [
        -6.35697,
        106.83167
      ],
      [
        -6.3594,
        106.83168
      ],
      [
        -6.36577,
        106.83251
      ],
      [
        -6.36844,
        106.8323
      ],
      [
        -6.38059,
        106.82822
      ],
      [
        -6.38323,
        106.82648
      ],
      [
        -6.38507,
        106.8248
      ],
      [
        -6.38686,
        106.82358
      ],
      [
        -6.39787,
        106.81893
      ],
      [
        -6.40067,
        106.81805
      ],
      [
        -6.41841,
        106.81424
      ],
      [
        -6.43581,
        106.8082
      ],
      [
        -6.44673,
        106.80305
      ],
      [
        -6.45516,
        106.80099
      ],
      [
        -6.45881,
        106.8008
      ],
      [
        -6.46968,
        106.80274
      ],
      [
        -6.47725,
        106.80269
      ],
      [
        -6.48046,
        106.80153
      ],
      [
        -6.4859,
        106.79711
      ],
      [
        -6.48783,
        106.79601
      ],
      [
        -6.49087,
        106.7952
      ],
      [
        -6.49561,
        106.79499
      ],
      [
        -6.50648,
        106.79584
      ],
      [
        -6.51136,
        106.79682
      ],
      [
        -6.51403,
        106.79659
      ],
      [
        -6.51527,
        106.79672
      ],
      [
        -6.51675,
        106.79741
      ],
      [
        -6.51998,
        106.80027
      ],
      [
        -6.52251,
        106.80121
      ],
      [
        -6.52384,
        106.80128
      ],
      [
        -6.54486,
        106.79952
      ],
      [
        -6.54935,
        106.80012
      ],
      [
        -6.56143,
        106.80279
      ],
      [
        -6.56299,
        106.80284
      ],
      [
        -6.56521,
        106.80221
      ],
      [
        -6.56802,
        106.8008
      ],
      [
        -6.56927,
        106.79957
      ],
      [
        -6.57228,
        106.79512
      ],
      [
        -6.57364,
        106.79401
      ],
      [
        -6.57534,
        106.79319
      ],
      [
        -6.57751,
        106.79282
      ],
      [
        -6.58332,
        106.7934
      ],
      [
        -6.59115,
        106.7912
      ],
      [
        -6.59429,
        106.79079
      ]
    ]
  },
  {
    "id": "nambo",
    "name": "Lin Bogor (Cabang Nambo)",
    "shortName": "Nambo",
    "code": "B-N",
    "color": "#F97316",
    "corridor": "Citayam ↔ Nambo",
    "stations": [
      "Stasiun Citayam",
      "Stasiun Pondok Rajeg",
      "Stasiun Cibinong",
      "Stasiun Nambo"
    ],
    "trackCoordinates": [
      [
        -6.44801,
        106.80261
      ],
      [
        -6.45404,
        106.80121
      ],
      [
        -6.45598,
        106.80098
      ],
      [
        -6.45714,
        106.80117
      ],
      [
        -6.45863,
        106.802
      ],
      [
        -6.46047,
        106.80405
      ],
      [
        -6.46167,
        106.80628
      ],
      [
        -6.46193,
        106.80728
      ],
      [
        -6.46208,
        106.80904
      ],
      [
        -6.46175,
        106.81469
      ],
      [
        -6.46059,
        106.82642
      ],
      [
        -6.46494,
        106.84644
      ],
      [
        -6.46376,
        106.85476
      ],
      [
        -6.464,
        106.85857
      ],
      [
        -6.46751,
        106.87881
      ],
      [
        -6.46984,
        106.88481
      ],
      [
        -6.47344,
        106.89163
      ],
      [
        -6.474,
        106.8935
      ],
      [
        -6.47387,
        106.89524
      ],
      [
        -6.4732,
        106.89673
      ],
      [
        -6.46935,
        106.90071
      ],
      [
        -6.4654,
        106.90835
      ]
    ]
  },
  {
    "id": "cikarang-selatan",
    "name": "Lin Cikarang (Via Manggarai)",
    "shortName": "Cikarang",
    "code": "C",
    "color": "#0284C7",
    "corridor": "Kp. Bandan ↔ Manggarai ↔ Cikarang",
    "stations": [
      "Stasiun Kampung Bandan",
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
      "Stasiun Cikarang"
    ],
    "trackCoordinates": [
      [
        -6.13272,
        106.82894
      ],
      [
        -6.1322,
        106.82795
      ],
      [
        -6.13203,
        106.82699
      ],
      [
        -6.13292,
        106.82093
      ],
      [
        -6.13222,
        106.81892
      ],
      [
        -6.13048,
        106.81586
      ],
      [
        -6.13003,
        106.81373
      ],
      [
        -6.13305,
        106.80214
      ],
      [
        -6.13398,
        106.80094
      ],
      [
        -6.13505,
        106.80039
      ],
      [
        -6.13654,
        106.80028
      ],
      [
        -6.16737,
        106.80209
      ],
      [
        -6.16892,
        106.80282
      ],
      [
        -6.17973,
        106.8102
      ],
      [
        -6.18298,
        106.81076
      ],
      [
        -6.18814,
        106.81119
      ],
      [
        -6.1923,
        106.81026
      ],
      [
        -6.19462,
        106.81045
      ],
      [
        -6.19904,
        106.81224
      ],
      [
        -6.20023,
        106.81367
      ],
      [
        -6.20407,
        106.83056
      ],
      [
        -6.20504,
        106.83706
      ],
      [
        -6.20654,
        106.84169
      ],
      [
        -6.20643,
        106.84287
      ],
      [
        -6.20567,
        106.84475
      ],
      [
        -6.20578,
        106.84593
      ],
      [
        -6.20668,
        106.84722
      ],
      [
        -6.21369,
        106.85259
      ],
      [
        -6.21448,
        106.85398
      ],
      [
        -6.21435,
        106.85547
      ],
      [
        -6.21183,
        106.86144
      ],
      [
        -6.21164,
        106.86237
      ],
      [
        -6.21207,
        106.86389
      ],
      [
        -6.21454,
        106.86668
      ],
      [
        -6.21502,
        106.86807
      ],
      [
        -6.215,
        106.87254
      ],
      [
        -6.21414,
        106.88693
      ],
      [
        -6.21314,
        106.89169
      ],
      [
        -6.21342,
        106.90534
      ],
      [
        -6.2218,
        106.97485
      ],
      [
        -6.22327,
        106.97801
      ],
      [
        -6.23898,
        107.00313
      ],
      [
        -6.24209,
        107.00704
      ],
      [
        -6.24391,
        107.0107
      ],
      [
        -6.25251,
        107.03326
      ],
      [
        -6.26274,
        107.07189
      ],
      [
        -6.26296,
        107.07435
      ],
      [
        -6.2628,
        107.07723
      ],
      [
        -6.25327,
        107.13805
      ],
      [
        -6.25351,
        107.14109
      ],
      [
        -6.25555,
        107.14576
      ]
    ]
  },
  {
    "id": "cikarang-utara",
    "name": "Lin Cikarang (Via Pasar Senen)",
    "shortName": "Loop Utara",
    "code": "C-U",
    "color": "#0EA5E9",
    "corridor": "Kp. Bandan ↔ Pasar Senen ↔ Jatinegara",
    "stations": [
      "Stasiun Kampung Bandan",
      "Stasiun Rajawali",
      "Stasiun Kemayoran",
      "Stasiun Pasar Senen",
      "Stasiun Gang Sentiong",
      "Stasiun Kramat",
      "Stasiun Pondok Jati",
      "Stasiun Jatinegara"
    ],
    "trackCoordinates": [
      [
        -6.13272,
        106.82894
      ],
      [
        -6.13352,
        106.83003
      ],
      [
        -6.13472,
        106.83062
      ],
      [
        -6.13886,
        106.83067
      ],
      [
        -6.14018,
        106.83106
      ],
      [
        -6.14111,
        106.83196
      ],
      [
        -6.14209,
        106.83425
      ],
      [
        -6.14284,
        106.83534
      ],
      [
        -6.14373,
        106.83614
      ],
      [
        -6.14491,
        106.83675
      ],
      [
        -6.16673,
        106.84289
      ],
      [
        -6.17064,
        106.84315
      ],
      [
        -6.17711,
        106.84559
      ],
      [
        -6.18026,
        106.84649
      ],
      [
        -6.19652,
        106.85855
      ],
      [
        -6.20074,
        106.86003
      ],
      [
        -6.21094,
        106.86301
      ],
      [
        -6.21441,
        106.86688
      ],
      [
        -6.21481,
        106.86802
      ],
      [
        -6.21478,
        106.86945
      ]
    ]
  },
  {
    "id": "rangkasbitung",
    "name": "Lin Rangkasbitung",
    "shortName": "Rangkas",
    "code": "R",
    "color": "#16A34A",
    "corridor": "Tanah Abang ↔ Rangkasbitung",
    "stations": [
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
      "Stasiun Rangkasbitung"
    ],
    "trackCoordinates": [
      [
        -6.1839,
        106.81068
      ],
      [
        -6.1885,
        106.81105
      ],
      [
        -6.1931,
        106.81001
      ],
      [
        -6.19656,
        106.8105
      ],
      [
        -6.19798,
        106.81004
      ],
      [
        -6.20113,
        106.8071
      ],
      [
        -6.20473,
        106.7994
      ],
      [
        -6.20549,
        106.79847
      ],
      [
        -6.21017,
        106.79628
      ],
      [
        -6.21352,
        106.796
      ],
      [
        -6.2163,
        106.79347
      ],
      [
        -6.21781,
        106.79249
      ],
      [
        -6.22432,
        106.7897
      ],
      [
        -6.23514,
        106.78332
      ],
      [
        -6.2404,
        106.78124
      ],
      [
        -6.25083,
        106.77242
      ],
      [
        -6.25376,
        106.76878
      ],
      [
        -6.25509,
        106.76578
      ],
      [
        -6.2568,
        106.76277
      ],
      [
        -6.25807,
        106.76198
      ],
      [
        -6.26149,
        106.76106
      ],
      [
        -6.263,
        106.75998
      ],
      [
        -6.26524,
        106.75683
      ],
      [
        -6.27384,
        106.74832
      ],
      [
        -6.28412,
        106.7355
      ],
      [
        -6.29017,
        106.72696
      ],
      [
        -6.29064,
        106.72596
      ],
      [
        -6.29108,
        106.72354
      ],
      [
        -6.29154,
        106.72238
      ],
      [
        -6.29399,
        106.71945
      ],
      [
        -6.29533,
        106.71533
      ],
      [
        -6.30419,
        106.69992
      ],
      [
        -6.30833,
        106.69074
      ],
      [
        -6.3115,
        106.68127
      ],
      [
        -6.31389,
        106.67789
      ],
      [
        -6.31701,
        106.67248
      ],
      [
        -6.31935,
        106.67045
      ],
      [
        -6.32005,
        106.66915
      ],
      [
        -6.32022,
        106.66068
      ],
      [
        -6.32059,
        106.65954
      ],
      [
        -6.32238,
        106.6566
      ],
      [
        -6.32274,
        106.65547
      ],
      [
        -6.32336,
        106.64431
      ],
      [
        -6.32576,
        106.63867
      ],
      [
        -6.32612,
        106.63071
      ],
      [
        -6.32789,
        106.62795
      ],
      [
        -6.32922,
        106.62026
      ],
      [
        -6.33046,
        106.61705
      ],
      [
        -6.33108,
        106.61584
      ],
      [
        -6.33328,
        106.61301
      ],
      [
        -6.33392,
        106.61147
      ],
      [
        -6.33853,
        106.59065
      ],
      [
        -6.34215,
        106.58269
      ],
      [
        -6.34411,
        106.58056
      ],
      [
        -6.3447,
        106.57943
      ],
      [
        -6.34484,
        106.57816
      ],
      [
        -6.34405,
        106.56489
      ],
      [
        -6.34424,
        106.56286
      ],
      [
        -6.34482,
        106.56111
      ],
      [
        -6.351,
        106.54813
      ],
      [
        -6.35131,
        106.54678
      ],
      [
        -6.35115,
        106.54474
      ],
      [
        -6.3514,
        106.5435
      ],
      [
        -6.35473,
        106.53847
      ],
      [
        -6.35487,
        106.53454
      ],
      [
        -6.35705,
        106.52799
      ],
      [
        -6.35689,
        106.52647
      ],
      [
        -6.35566,
        106.52337
      ],
      [
        -6.35589,
        106.52008
      ],
      [
        -6.35435,
        106.51814
      ],
      [
        -6.35394,
        106.51695
      ],
      [
        -6.35415,
        106.51466
      ],
      [
        -6.35528,
        106.51229
      ],
      [
        -6.35504,
        106.51082
      ],
      [
        -6.35342,
        106.50843
      ],
      [
        -6.3505,
        106.50673
      ],
      [
        -6.3458,
        106.50192
      ],
      [
        -6.34262,
        106.49575
      ],
      [
        -6.34192,
        106.49482
      ],
      [
        -6.3409,
        106.49402
      ],
      [
        -6.33492,
        106.49097
      ],
      [
        -6.33383,
        106.48969
      ],
      [
        -6.33356,
        106.48808
      ],
      [
        -6.33441,
        106.48522
      ],
      [
        -6.33433,
        106.4833
      ],
      [
        -6.33146,
        106.4753
      ],
      [
        -6.3298,
        106.47189
      ],
      [
        -6.3285,
        106.46418
      ],
      [
        -6.32649,
        106.45946
      ],
      [
        -6.32692,
        106.45297
      ],
      [
        -6.32699,
        106.43917
      ],
      [
        -6.33452,
        106.42007
      ],
      [
        -6.33637,
        106.40682
      ],
      [
        -6.33611,
        106.40517
      ],
      [
        -6.32975,
        106.3896
      ],
      [
        -6.33071,
        106.37636
      ],
      [
        -6.33235,
        106.37054
      ],
      [
        -6.33259,
        106.36503
      ],
      [
        -6.33221,
        106.36328
      ],
      [
        -6.32953,
        106.35911
      ],
      [
        -6.32915,
        106.35682
      ],
      [
        -6.32961,
        106.3552
      ],
      [
        -6.33304,
        106.34711
      ],
      [
        -6.33356,
        106.34509
      ],
      [
        -6.33577,
        106.32653
      ],
      [
        -6.33519,
        106.31893
      ],
      [
        -6.3354,
        106.3173
      ],
      [
        -6.3362,
        106.31471
      ],
      [
        -6.33642,
        106.31075
      ],
      [
        -6.33684,
        106.30977
      ],
      [
        -6.33851,
        106.30737
      ],
      [
        -6.34123,
        106.29964
      ],
      [
        -6.34021,
        106.28787
      ],
      [
        -6.34098,
        106.28468
      ],
      [
        -6.34105,
        106.28068
      ],
      [
        -6.34246,
        106.27493
      ],
      [
        -6.34262,
        106.27068
      ],
      [
        -6.34318,
        106.26952
      ],
      [
        -6.3441,
        106.26881
      ],
      [
        -6.34492,
        106.26857
      ],
      [
        -6.34795,
        106.26864
      ],
      [
        -6.34929,
        106.26794
      ],
      [
        -6.35005,
        106.26708
      ],
      [
        -6.35356,
        106.2595
      ],
      [
        -6.35368,
        106.25781
      ],
      [
        -6.35316,
        106.25509
      ],
      [
        -6.35311,
        106.25313
      ]
    ]
  },
  {
    "id": "tangerang",
    "name": "Lin Tangerang",
    "shortName": "Tangerang",
    "code": "T",
    "color": "#B45309",
    "corridor": "Duri ↔ Tangerang",
    "stations": [
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
      "Stasiun Tangerang"
    ],
    "trackCoordinates": [
      [
        -6.15435,
        106.80115
      ],
      [
        -6.15843,
        106.80136
      ],
      [
        -6.15973,
        106.80099
      ],
      [
        -6.16065,
        106.79988
      ],
      [
        -6.1622,
        106.79569
      ],
      [
        -6.16149,
        106.7738
      ],
      [
        -6.15994,
        106.76299
      ],
      [
        -6.15796,
        106.75354
      ],
      [
        -6.15812,
        106.74867
      ],
      [
        -6.1589,
        106.73992
      ],
      [
        -6.16046,
        106.73538
      ],
      [
        -6.16194,
        106.72747
      ],
      [
        -6.17475,
        106.64926
      ],
      [
        -6.17682,
        106.63601
      ],
      [
        -6.1768,
        106.63045
      ]
    ]
  },
  {
    "id": "tanjung-priok",
    "name": "Lin Tanjung Priok",
    "shortName": "Tj. Priok",
    "code": "TP",
    "color": "#DB2777",
    "corridor": "Jakarta Kota ↔ Tanjung Priok",
    "stations": [
      "Stasiun Jakarta Kota",
      "Stasiun Kampung Bandan",
      "Stasiun Ancol",
      "Stasiun Tanjung Priok"
    ],
    "trackCoordinates": [
      [
        -6.13769,
        106.8148
      ],
      [
        -6.13606,
        106.82035
      ],
      [
        -6.13467,
        106.82276
      ],
      [
        -6.13284,
        106.82888
      ],
      [
        -6.13004,
        106.8351
      ],
      [
        -6.12682,
        106.85184
      ],
      [
        -6.12267,
        106.86178
      ],
      [
        -6.12151,
        106.86693
      ],
      [
        -6.1203,
        106.86894
      ],
      [
        -6.11056,
        106.88151
      ]
    ]
  }
]
