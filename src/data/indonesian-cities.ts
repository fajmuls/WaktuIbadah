export interface IndonesianCity {
  id: string;
  name: string;
  province: string;
  timezone: 'WIB' | 'WITA' | 'WIT';
  timezoneOffsetHours: number; // 7, 8, or 9
  lat: number;
  lng: number;
}

export const INDONESIAN_CITIES: IndonesianCity[] = [
  // --- WIB (UTC+7) ---
  { id: 'jakarta', name: 'Jakarta', province: 'DKI Jakarta', timezone: 'WIB', timezoneOffsetHours: 7, lat: -6.2088, lng: 106.8456 },
  { id: 'bandung', name: 'Bandung', province: 'Jawa Barat', timezone: 'WIB', timezoneOffsetHours: 7, lat: -6.9175, lng: 107.6191 },
  { id: 'surabaya', name: 'Surabaya', province: 'Jawa Timur', timezone: 'WIB', timezoneOffsetHours: 7, lat: -7.2575, lng: 112.7521 },
  { id: 'yogyakarta', name: 'Yogyakarta', province: 'DI Yogyakarta', timezone: 'WIB', timezoneOffsetHours: 7, lat: -7.7956, lng: 110.3695 },
  { id: 'semarang', name: 'Semarang', province: 'Jawa Tengah', timezone: 'WIB', timezoneOffsetHours: 7, lat: -6.9667, lng: 110.4167 },
  { id: 'medan', name: 'Medan', province: 'Sumatera Utara', timezone: 'WIB', timezoneOffsetHours: 7, lat: 3.5952, lng: 98.6722 },
  { id: 'padang', name: 'Padang', province: 'Sumatera Barat', timezone: 'WIB', timezoneOffsetHours: 7, lat: -0.9471, lng: 100.4172 },
  { id: 'palembang', name: 'Palembang', province: 'Sumatera Selatan', timezone: 'WIB', timezoneOffsetHours: 7, lat: -2.9761, lng: 104.7754 },
  { id: 'banda-aceh', name: 'Banda Aceh', province: 'Aceh', timezone: 'WIB', timezoneOffsetHours: 7, lat: 5.5483, lng: 95.3238 },
  { id: 'pekanbaru', name: 'Pekanbaru', province: 'Riau', timezone: 'WIB', timezoneOffsetHours: 7, lat: 0.5071, lng: 101.4478 },
  { id: 'pontianak', name: 'Pontianak', province: 'Kalimantan Barat', timezone: 'WIB', timezoneOffsetHours: 7, lat: -0.0263, lng: 109.3425 },
  { id: 'malang', name: 'Malang', province: 'Jawa Timur', timezone: 'WIB', timezoneOffsetHours: 7, lat: -7.9797, lng: 112.6304 },
  { id: 'bogor', name: 'Bogor', province: 'Jawa Barat', timezone: 'WIB', timezoneOffsetHours: 7, lat: -6.5971, lng: 106.8060 },
  { id: 'tangerang', name: 'Tangerang', province: 'Banten', timezone: 'WIB', timezoneOffsetHours: 7, lat: -6.1783, lng: 106.6319 },

  // --- WITA (UTC+8) ---
  { id: 'makassar', name: 'Makassar', province: 'Sulawesi Selatan', timezone: 'WITA', timezoneOffsetHours: 8, lat: -5.1477, lng: 119.4327 },
  { id: 'denpasar', name: 'Denpasar', province: 'Bali', timezone: 'WITA', timezoneOffsetHours: 8, lat: -8.6705, lng: 115.2126 },
  { id: 'mataram', name: 'Mataram (Lombok)', province: 'Nusa Tenggara Barat', timezone: 'WITA', timezoneOffsetHours: 8, lat: -8.5833, lng: 116.1167 },
  { id: 'kupang', name: 'Kupang', province: 'Nusa Tenggara Timur', timezone: 'WITA', timezoneOffsetHours: 8, lat: -10.1772, lng: 123.6070 },
  { id: 'banjarmasin', name: 'Banjarmasin', province: 'Kalimantan Selatan', timezone: 'WITA', timezoneOffsetHours: 8, lat: -3.3194, lng: 114.5908 },
  { id: 'balikpapan', name: 'Balikpapan', province: 'Kalimantan Timur', timezone: 'WITA', timezoneOffsetHours: 8, lat: -1.2379, lng: 116.8289 },
  { id: 'samarinda', name: 'Samarinda', province: 'Kalimantan Timur', timezone: 'WITA', timezoneOffsetHours: 8, lat: -0.5016, lng: 117.1265 },
  { id: 'manado', name: 'Manado', province: 'Sulawesi Utara', timezone: 'WITA', timezoneOffsetHours: 8, lat: 1.4748, lng: 124.8421 },
  { id: 'palu', name: 'Palu', province: 'Sulawesi Tengah', timezone: 'WITA', timezoneOffsetHours: 8, lat: -0.9003, lng: 119.8780 },
  { id: 'kendari', name: 'Kendari', province: 'Sulawesi Tenggara', timezone: 'WITA', timezoneOffsetHours: 8, lat: -3.9985, lng: 122.5126 },

  // --- WIT (UTC+9) ---
  { id: 'ambon', name: 'Ambon', province: 'Maluku', timezone: 'WIT', timezoneOffsetHours: 9, lat: -3.6547, lng: 128.1906 },
  { id: 'jayapura', name: 'Jayapura', province: 'Papua', timezone: 'WIT', timezoneOffsetHours: 9, lat: -2.5916, lng: 140.6690 },
  { id: 'sorong', name: 'Sorong', province: 'Papua Barat Daya', timezone: 'WIT', timezoneOffsetHours: 9, lat: -0.8762, lng: 131.2558 },
  { id: 'ternate', name: 'Ternate', province: 'Maluku Utara', timezone: 'WIT', timezoneOffsetHours: 9, lat: 0.7905, lng: 127.3820 },
  { id: 'merauke', name: 'Merauke', province: 'Papua Selatan', timezone: 'WIT', timezoneOffsetHours: 9, lat: -8.4991, lng: 140.4047 },
];

export const DEFAULT_CITY = INDONESIAN_CITIES[0]; // Jakarta

export function getCityByName(name: string): IndonesianCity {
  const normalized = name.toLowerCase().trim();
  const found = INDONESIAN_CITIES.find(
    (c) => c.name.toLowerCase() === normalized || c.id.toLowerCase() === normalized
  );
  return found || DEFAULT_CITY;
}
