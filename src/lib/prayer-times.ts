// Since getting real prayer times requires geolocation and an API (which we want to avoid),
// we will use generic approximate times that can be overridden later if needed.
// This matches Indonesian approximate times.

import { PrayerName } from "../types";
import { format } from "date-fns";

export const getPrayerTimesForToday = () => {
  // Return times in HH:mm format for today.
  // In a real app this would use something like adhan.js
  return {
    Subuh: "04:30",
    Zuhur: "12:00",
    Asar: "15:15",
    Magrib: "18:00",
    Isya: "19:15",
  };
};

export const getNextPrayer = () => {
  const times = getPrayerTimesForToday();
  const now = new Date();
  const currentTimeStr = format(now, "HH:mm");

  const prayerOrder: PrayerName[] = ["Subuh", "Zuhur", "Asar", "Magrib", "Isya"];
  
  for (const prayer of prayerOrder) {
    if (currentTimeStr < times[prayer]) {
      return { prayer, time: times[prayer] };
    }
  }

  // If all prayers today have passed, return Subuh for tomorrow
  return { prayer: "Subuh" as PrayerName, time: times["Subuh"], isTomorrow: true };
};
