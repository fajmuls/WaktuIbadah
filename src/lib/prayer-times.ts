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

export const fetchPrayerTimes = async (latitude: number, longitude: number): Promise<PrayerData> => {
  const today = format(new Date(), 'dd-MM-yyyy');
  
  if (cachedData && lastFetchDate === today) {
    return cachedData;
  }

  try {
    const response = await fetch(`https://api.aladhan.com/v1/timings/${today}?latitude=${latitude}&longitude=${longitude}&method=20`);
    if (!response.ok) {
      throw new Error('Failed to fetch prayer times');
    }
    const jsonResponse = await response.json();
    const data = jsonResponse.data;
    
    // Attempt reverse geocoding to get city name using a free API
    let cityName = "Lokasi Saat Ini";
    try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            cityName = geoData.city || geoData.locality || geoData.principalSubdivision || "Lokasi Saat Ini";
        }
    } catch (e) {
        console.warn("Reverse geocoding failed");
    }

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
    return prayerData;

  } catch (error) {
    console.error("Error fetching prayer times:", error);
    // Fallback to default if error
    return {
      times: DEFAULT_TIMES,
      imsak: "04:20",
      hijri: { day: "-", month: "-", year: "-" },
      location: "Offline/Default"
    };
  }
};

export const getPrayerTimesForToday = () => {
  if (cachedData) return cachedData.times;
  return DEFAULT_TIMES; // Sync fallback
};

export const getNextPrayer = (times: Record<PrayerName, string> = getPrayerTimesForToday()) => {
  const now = new Date();
  const currentTimeStr = format(now, "HH:mm");

  const prayerOrder: PrayerName[] = ["Subuh", "Zuhur", "Asar", "Magrib", "Isya"];
  
  for (const prayer of prayerOrder) {
    if (currentTimeStr < times[prayer]) {
      return { prayer, time: times[prayer], isTomorrow: false };
    }
  }

  // If all prayers today have passed, return Subuh for tomorrow
  return { prayer: "Subuh" as PrayerName, time: times["Subuh"], isTomorrow: true };
};

