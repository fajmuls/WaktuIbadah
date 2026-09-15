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
    // 1. Find MyQuran City ID
    let cityMatch = await findMyQuranCityId(cityName);
    if (!cityMatch && locality) {
      cityMatch = await findMyQuranCityId(locality);
    }
    
    // Default to Jakarta (1301) if not found
    const cityId = cityMatch?.id || "1301";
    const officialLokasi = cityMatch?.lokasi || "KOTA JAKARTA";

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
    let hijriYear = "1448 H";

    try {
      const calRes = await fetch(`https://api.myquran.com/v2/cal/hijr/${yyyy}-${mm}-${dd}`);
      if (calRes.ok) {
        const calJson = await calRes.json();
        if (calJson.status && calJson.data?.date?.[1]) {
          const hijriStr = calJson.data.date[1];
          const parts = hijriStr.split(' ');
          if (parts.length >= 3) {
            hijriDay = parts[0];
            hijriYear = parts.slice(-2).join(' ');
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
        year: hijriYear,
      },
      location: finalLocation,
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
      hijri: { day: "-", month: "-", year: "-" },
      location: cityName + " (Gagal Memuat)"
    };
  }
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

