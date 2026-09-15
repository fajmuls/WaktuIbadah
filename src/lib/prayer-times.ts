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
}

const DEFAULT_TIMES = {
  Subuh: "04:30",
  Zuhur: "12:00",
  Asar: "15:15",
  Magrib: "18:00",
  Isya: "19:15",
};

// Caching to avoid hitting API too much
let cachedData: PrayerData | null = null;
let lastFetchDate = '';
let lastLat = 0;
let lastLng = 0;

export const getCachedPrayerData = () => cachedData;

export const fetchPrayerTimes = async (latitude: number, longitude: number, forceRefresh: boolean = false): Promise<PrayerData> => {
  const today = format(new Date(), 'dd-MM-yyyy');
  
  if (!forceRefresh && cachedData && lastFetchDate === today && Math.abs(lastLat - latitude) < 0.01 && Math.abs(lastLng - longitude) < 0.01) {
    return cachedData;
  }

  let cityName = "Lokasi Anda";
  if (latitude !== -6.2088 || longitude !== 106.8456) {
    try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            cityName = geoData.locality || geoData.city || geoData.principalSubdivision || "Lokasi Anda";
        }
    } catch (e) {
        console.warn("Reverse geocoding failed", e);
    }
  } else {
    cityName = "Jakarta, Indonesia";
  }

  try {
    const response = await fetch(`https://api.aladhan.com/v1/timings/${today}?latitude=${latitude}&longitude=${longitude}&method=20`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const jsonResponse = await response.json();
    const data = jsonResponse.data;
    
    const prayerData: PrayerData = {
      times: {
        Subuh: data.timings.Fajr,
        Zuhur: data.timings.Dhuhr,
        Asar: data.timings.Asr,
        Magrib: data.timings.Maghrib,
        Isya: data.timings.Isha,
      },
      imsak: data.timings.Imsak,
      hijri: {
        day: data.date.hijri.day,
        month: data.date.hijri.month.en,
        year: data.date.hijri.year,
      },
      location: cityName
    };

    cachedData = prayerData;
    lastFetchDate = today;
    lastLat = latitude;
    lastLng = longitude;
    return prayerData;

  } catch (error) {
    console.error("Error fetching prayer times:", error);
    // If we have old cached data, return it instead of completely breaking
    if (cachedData) {
      return { ...cachedData, location: cachedData.location + " (Offline)" };
    }
    // Fallback to default if error
    return {
      times: DEFAULT_TIMES,
      imsak: "04:20",
      hijri: { day: "-", month: "-", year: "-" },
      location: cityName + " (Offline)"
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

