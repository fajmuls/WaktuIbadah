import { PrayerName } from "../types";
import { format } from "date-fns";
import { storage } from './storage';

export interface PrayerData {
  times: Record<PrayerName, string>;
  hijri: {
    day: string;
    month: string;
    year: string;
  };
  imsak: string;
  location: string;
  cityId?: string;
  dateStr?: string;
  lat?: number;
  lng?: number;
}

const DEFAULT_TIMES = {
  Subuh: "04:30",
  Zuhur: "12:00",
  Asar: "15:15",
  Magrib: "18:00",
  Isya: "19:15",
};

// Caching to avoid hitting API too much
let cachedData: PrayerData | null = storage.getPrayerCache();

export const getCachedPrayerData = () => {
  if (!cachedData) {
    cachedData = storage.getPrayerCache();
  }
  return cachedData;
};

// Helper to search MyQuran cities
export async function searchMyQuranCities(query: string): Promise<Array<{ id: string; lokasi: string }>> {
  if (!query || query.trim().length === 0) return [];
  const cleaned = query.trim().toLowerCase();
  try {
    const res = await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(cleaned)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.status && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn("Error searching MyQuran cities:", e);
  }
  return [];
}

// Popular Indonesian Cities for instant selection
export const POPULAR_CITIES = [
  { id: "1301", lokasi: "KOTA JAKARTA" },
  { id: "1204", lokasi: "KOTA BANDUNG" },
  { id: "1638", lokasi: "KOTA SURABAYA" },
  { id: "1632", lokasi: "KOTA SEMARANG" },
  { id: "1408", lokasi: "KOTA YOGYAKARTA" },
  { id: "1225", lokasi: "KOTA TANGERANG SELATAN" },
  { id: "1224", lokasi: "KOTA TANGERANG" },
  { id: "1221", lokasi: "KOTA BEKASI" },
  { id: "1222", lokasi: "KOTA BOGOR" },
  { id: "1223", lokasi: "KOTA DEPOK" },
  { id: "0228", lokasi: "KOTA MEDAN" },
  { id: "2608", lokasi: "KOTA MAKASSAR" },
  { id: "1809", lokasi: "KOTA DENPASAR" },
  { id: "2108", lokasi: "KOTA BANJARMASIN" },
  { id: "0412", lokasi: "KOTA PADANG" },
  { id: "0611", lokasi: "KOTA PALEMBANG" },
];

// Helper to find City ID in MyQuran API
async function findMyQuranCityId(cityName: string): Promise<{ id: string; lokasi: string } | null> {
  const cleaned = cityName
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.|kecamatan|kelurahan)\s+/i, '')
    .trim();

  const searchTerms = [cleaned];
  if (cleaned.includes(' ')) {
    const parts = cleaned.split(' ');
    searchTerms.push(parts[0]);
  }

  for (const term of searchTerms) {
    if (!term || term.length < 3) continue;
    try {
      const res = await fetch(`https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(term)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.status && Array.isArray(json.data) && json.data.length > 0) {
          const exact = json.data.find((item: any) => 
            item.lokasi.toLowerCase().includes(cleaned)
          );
          return exact || json.data[0];
        }
      }
    } catch (e) {
      console.warn("MyQuran city search error:", e);
    }
  }

  return null;
}

export const fetchPrayerTimes = async (latitude: number, longitude: number, forceRefresh: boolean = false): Promise<PrayerData> => {
  const now = new Date();
  const today = format(now, 'dd-MM-yyyy');
  const yyyy = format(now, 'yyyy');
  const mm = format(now, 'MM');
  const dd = format(now, 'dd');
  
  if (!forceRefresh && cachedData && cachedData.dateStr === today && 
      cachedData.lat !== undefined && Math.abs(cachedData.lat - latitude) < 0.01 && 
      cachedData.lng !== undefined && Math.abs(cachedData.lng - longitude) < 0.01) {
    return cachedData;
  }

  let locality = "";
  let cityName = "Jakarta";
  let fullLocationLabel = "Jakarta, Indonesia";

  if (latitude !== -6.2088 || longitude !== 106.8456) {
    try {
      const geoRes = await fetch(`https://api-bdc.io/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        locality = geoData.locality || "";
        cityName = geoData.city || geoData.principalSubdivision || "Jakarta";
        if (locality && cityName && locality !== cityName) {
          fullLocationLabel = `${locality}, ${cityName}`;
        } else {
          fullLocationLabel = cityName || "Indonesia";
        }
      }
    } catch (e) {
      console.warn("Reverse geocoding error:", e);
    }
  } else {
    fullLocationLabel = "Jakarta, Indonesia";
  }

  try {
    // Check if user has explicit cityId configured in profile
    const storedUser = storage.getUser();
    let cityId = storedUser?.location?.cityId;
    let officialLokasi = storedUser?.location?.city || "";

    // 1. Find MyQuran City ID if not stored
    if (!cityId) {
      let cityMatch = await findMyQuranCityId(cityName);
      if (!cityMatch && locality) {
        cityMatch = await findMyQuranCityId(locality);
      }
      cityId = cityMatch?.id || "1301";
      officialLokasi = cityMatch?.lokasi || "KOTA JAKARTA";
    }

    // 2. Fetch Sholat Schedule from MyQuran API
    const scheduleRes = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${yyyy}/${mm}/${dd}`);
    if (!scheduleRes.ok) {
      throw new Error(`MyQuran API returned status ${scheduleRes.status}`);
    }
    const scheduleJson = await scheduleRes.json();
    if (!scheduleJson.status || !scheduleJson.data?.jadwal) {
      throw new Error("Invalid response format from MyQuran API");
    }

    const jadwal = scheduleJson.data.jadwal;

    // 3. Fetch Hijri calendar info from MyQuran Cal API
    let hijriDay = "-";
    let hijriMonth = "Hijriyah";
    let hijriYear = "1448";

    try {
      const calRes = await fetch(`https://api.myquran.com/v2/cal/hijr/${yyyy}-${mm}-${dd}`);
      if (calRes.ok) {
        const calJson = await calRes.json();
        if (calJson.status && calJson.data?.date?.[1]) {
          const hijriStr = calJson.data.date[1];
          const parts = hijriStr.split(' ');
          if (parts.length >= 3) {
            hijriDay = parts[0];
            const rawYear = parts.slice(-2).join(' ');
            hijriYear = rawYear.replace(/\s*H\s*$/i, '').trim();
            hijriMonth = parts.slice(1, -2).join(' ');
          } else {
            hijriMonth = hijriStr;
          }
        }
      }
    } catch (calErr) {
      console.warn("MyQuran Cal API error (non-fatal):", calErr);
    }

    const finalLocation = locality 
      ? `${locality} (${officialLokasi})` 
      : (fullLocationLabel || officialLokasi);

    const prayerData: PrayerData = {
      times: {
        Subuh: jadwal.subuh,
        Zuhur: jadwal.dzuhur,
        Asar: jadwal.ashar,
        Magrib: jadwal.maghrib,
        Isya: jadwal.isya,
      },
      imsak: jadwal.imsak || "04:20",
      hijri: {
        day: hijriDay,
        month: hijriMonth,
        year: hijriYear.replace(/\s*H\s*$/i, '').trim(),
      },
      location: finalLocation,
      cityId,
      dateStr: today,
      lat: latitude,
      lng: longitude
    };

    cachedData = prayerData;
    storage.setPrayerCache(prayerData);
    return prayerData;

  } catch (error) {
    console.error("Error fetching prayer times:", error);
    if (cachedData) {
      return { ...cachedData, location: cachedData.location.includes("(Offline)") ? cachedData.location : cachedData.location + " (Offline)" };
    }
    return {
      times: DEFAULT_TIMES,
      imsak: "04:20",
      hijri: { day: "-", month: "-", year: "1448" },
      location: cityName + " (Gagal Memuat)"
    };
  }
};

export const fetchPrayerTimesByCityId = async (cityId: string, customCityName?: string): Promise<PrayerData> => {
  const now = new Date();
  const today = format(now, 'dd-MM-yyyy');
  const yyyy = format(now, 'yyyy');
  const mm = format(now, 'MM');
  const dd = format(now, 'dd');

  const scheduleRes = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${cityId}/${yyyy}/${mm}/${dd}`);
  if (!scheduleRes.ok) {
    throw new Error(`MyQuran API error ${scheduleRes.status}`);
  }
  const scheduleJson = await scheduleRes.json();
  if (!scheduleJson.status || !scheduleJson.data?.jadwal) {
    throw new Error("Invalid response from MyQuran API");
  }

  const jadwal = scheduleJson.data.jadwal;
  const officialLokasi = scheduleJson.data.lokasi || customCityName || "KOTA PILIHAN";

  let hijriDay = "-";
  let hijriMonth = "Hijriyah";
  let hijriYear = "1448";

  try {
    const calRes = await fetch(`https://api.myquran.com/v2/cal/hijr/${yyyy}-${mm}-${dd}`);
    if (calRes.ok) {
      const calJson = await calRes.json();
      if (calJson.status && calJson.data?.date?.[1]) {
        const hijriStr = calJson.data.date[1];
        const parts = hijriStr.split(' ');
        if (parts.length >= 3) {
          hijriDay = parts[0];
          const rawYear = parts.slice(-2).join(' ');
          hijriYear = rawYear.replace(/\s*H\s*$/i, '').trim();
          hijriMonth = parts.slice(1, -2).join(' ');
        }
      }
    }
  } catch (e) {
    console.warn("Cal error:", e);
  }

  const prayerData: PrayerData = {
    times: {
      Subuh: jadwal.subuh,
      Zuhur: jadwal.dzuhur,
      Asar: jadwal.ashar,
      Magrib: jadwal.maghrib,
      Isya: jadwal.isya,
    },
    imsak: jadwal.imsak || "04:20",
    hijri: {
      day: hijriDay,
      month: hijriMonth,
      year: hijriYear.replace(/\s*H\s*$/i, '').trim(),
    },
    location: officialLokasi,
    cityId,
    dateStr: today,
  };

  cachedData = prayerData;
  storage.setPrayerCache(prayerData);

  // Also update user profile with chosen city
  const currentUser = storage.getUser();
  if (currentUser) {
    storage.setUser({
      ...currentUser,
      location: {
        latitude: currentUser.location?.latitude || -6.2088,
        longitude: currentUser.location?.longitude || 106.8456,
        city: officialLokasi,
        cityId: cityId
      }
    });
  }

  return prayerData;
};

// Sunnah Fasting Information Helper
export interface SunnahFastingInfo {
  isPuasaToday: boolean;
  isPuasaTomorrow: boolean;
  name: string;
  desc: string;
  niat: string;
  badgeType: 'senin-kamis' | 'ayyamul-bidh' | null;
}

export const getSunnahFastingInfo = (hijriDayStr: string, date: Date = new Date()): SunnahFastingInfo | null => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  const hijriDayNum = parseInt(hijriDayStr, 10);

  // Check Ayyamul Bidh (13, 14, 15 Hijri)
  if (hijriDayNum === 13 || hijriDayNum === 14 || hijriDayNum === 15) {
    return {
      isPuasaToday: true,
      isPuasaTomorrow: hijriDayNum < 15,
      name: `Puasa Ayyamul Bidh (${hijriDayNum} Hijriyah)`,
      desc: "Puasa sunnah pertengahan bulan Hijriyah (13, 14, 15) yang pahalanya seperti puasa sepanjang tahun.",
      niat: "Nawaitu shauma ayyâmil bîdh sunnatan lillâhi ta'âlâ (Aku berniat puasa sunnah Ayyamul Bidh karena Allah Ta'ala)",
      badgeType: 'ayyamul-bidh'
    };
  }

  // Check if tomorrow is Ayyamul Bidh (12 Hijri)
  if (hijriDayNum === 12) {
    return {
      isPuasaToday: false,
      isPuasaTomorrow: true,
      name: "Besok Puasa Ayyamul Bidh (13-15 Hijriyah)",
      desc: "Persiapkan sahur untuk puasa sunnah pertengahan bulan Hijriyah besok hari.",
      niat: "Nawaitu shauma ayyâmil bîdh sunnatan lillâhi ta'âlâ",
      badgeType: 'ayyamul-bidh'
    };
  }

  // Check Senin (Monday)
  if (dayOfWeek === 1) {
    return {
      isPuasaToday: true,
      isPuasaTomorrow: false,
      name: "Puasa Sunnah Hari Senin",
      desc: "Hari Senin adalah hari kelahiran dan turunnya wahyu kepada Rasulullah SAW.",
      niat: "Nawaitu shauma yaumal itsnaini sunnatan lillâhi ta'âlâ (Aku berniat puasa sunnah hari Senin karena Allah Ta'ala)",
      badgeType: 'senin-kamis'
    };
  }

  // Check Kamis (Thursday)
  if (dayOfWeek === 4) {
    return {
      isPuasaToday: true,
      isPuasaTomorrow: false,
      name: "Puasa Sunnah Hari Kamis",
      desc: "Hari di mana amal-amal manusia diperiksa dan diangkat ke hadapan Allah Ta'ala.",
      niat: "Nawaitu shauma yaumal khamîsi sunnatan lillâhi ta'âlâ (Aku berniat puasa sunnah hari Kamis karena Allah Ta'ala)",
      badgeType: 'senin-kamis'
    };
  }

  // Check if tomorrow is Monday (Sunday = 0)
  if (dayOfWeek === 0) {
    return {
      isPuasaToday: false,
      isPuasaTomorrow: true,
      name: "Besok Puasa Sunnah Hari Senin",
      desc: "Siapkan sahur malam ini untuk menjalankan puasa sunnah hari Senin besok.",
      niat: "Nawaitu shauma yaumal itsnaini sunnatan lillâhi ta'âlâ",
      badgeType: 'senin-kamis'
    };
  }

  // Check if tomorrow is Thursday (Wednesday = 3)
  if (dayOfWeek === 3) {
    return {
      isPuasaToday: false,
      isPuasaTomorrow: true,
      name: "Besok Puasa Sunnah Hari Kamis",
      desc: "Siapkan sahur malam ini untuk menjalankan sunnah puasa hari Kamis besok.",
      niat: "Nawaitu shauma yaumal khamîsi sunnatan lillâhi ta'âlâ",
      badgeType: 'senin-kamis'
    };
  }

  return null;
};

export const getPrayerTimesForToday = () => {
  if (cachedData) return cachedData.times;
  return DEFAULT_TIMES; // Sync fallback
};

export const getPrayerStatus = (times: Record<PrayerName, string> = getPrayerTimesForToday()) => {
  const now = new Date();
  const currentTimeStr = format(now, "HH:mm");

  const prayerOrder: PrayerName[] = ["Subuh", "Zuhur", "Asar", "Magrib", "Isya"];
  
  let currentPrayer: { prayer: PrayerName, time: string } | null = null;
  let nextPrayer: { prayer: PrayerName, time: string, isTomorrow: boolean } | null = null;

  for (let i = 0; i < prayerOrder.length; i++) {
    const prayer = prayerOrder[i];
    if (currentTimeStr >= times[prayer]) {
      currentPrayer = { prayer, time: times[prayer] };
    } else if (!nextPrayer) {
      nextPrayer = { prayer, time: times[prayer], isTomorrow: false };
    }
  }

  // If all prayers today have passed
  if (!nextPrayer) {
    nextPrayer = { prayer: "Subuh" as PrayerName, time: times["Subuh"], isTomorrow: true };
  }

  return { currentPrayer, nextPrayer };
};

