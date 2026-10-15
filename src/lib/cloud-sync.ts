import { 
  doc, getDoc, setDoc, getDocs, collection, onSnapshot, getDocFromServer, Unsubscribe 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { storage } from './storage';
import { User, Task, Schedule, PrayerLog, QuranLog, FavoriteAyah, FavoriteHadith, QuranKhatamTarget, Reflection, FocusSession, ReminderSettings, WebsiteReview, AdminReviewConfig } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as required by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or starting up.");
    }
    return false;
  }
}

// Normalize student name to a clean, safe Firestore document ID
export function normalizeProfileId(name: string): string {
  const clean = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
  return clean || 'anonymous_user';
}

export interface CloudProfileSummary {
  exists: boolean;
  hasPin: boolean;
  name?: string;
  updatedAt?: string;
}

// Check if a student profile exists in cloud and whether a PIN is required
export async function checkCloudProfile(name: string): Promise<CloudProfileSummary> {
  const profileId = normalizeProfileId(name);
  const path = `student_profiles/${profileId}`;
  try {
    const snap = await getDoc(doc(db, 'student_profiles', profileId));
    if (!snap.exists()) {
      return { exists: false, hasPin: false };
    }
    const data = snap.data();
    return {
      exists: true,
      hasPin: Boolean(data.pin && data.pin.trim().length === 4),
      name: data.name,
      updatedAt: data.updatedAt
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return { exists: false, hasPin: false };
  }
}

// Connect or Link a device using Student Name and optional 4-digit PIN
export async function connectCloudProfile(name: string, pin?: string): Promise<{ success: boolean; isNew: boolean; message: string }> {
  const profileId = normalizeProfileId(name);
  const path = `student_profiles/${profileId}`;
  
  try {
    const snap = await getDoc(doc(db, 'student_profiles', profileId));
    
    if (snap.exists()) {
      const data = snap.data();
      const existingPin = data.pin ? String(data.pin).trim() : '';
      
      // If PIN is configured on cloud profile, verify it
      if (existingPin && existingPin.length === 4) {
        if (!pin || pin.trim() !== existingPin) {
          throw new Error('PIN 4 digit tidak cocok dengan akun ini. Masukkan PIN yang benar untuk mengakses data.');
        }
      }

      // Synchronize all cloud data to local storage
      applyCloudDataToLocalStorage(data);
      return {
        success: true,
        isNew: false,
        message: `Berhasil tersambung ke profil "${data.name}". Semua jadwal, ibadah & tugas telah disinkronkan dari cloud!`
      };
    } else {
      // Create new profile with local data
      const cleanPin = pin && /^\d{4}$/.test(pin.trim()) ? pin.trim() : '';
      await syncAllToCloud(name, cleanPin);
      return {
        success: true,
        isNew: true,
        message: `Profil cloud baru untuk "${name}" berhasil dibuat dan disinkronkan!`
      };
    }
  } catch (error: any) {
    if (error.message && error.message.includes('PIN 4 digit')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
    return { success: false, isNew: false, message: 'Gagal menyambungkan ke cloud.' };
  }
}

// Apply cloud data payload directly into local storage
export function applyCloudDataToLocalStorage(data: any) {
  if (!data) return;

  if (data.user) {
    const existing = storage.getUser();
    storage.setUser({
      ...existing,
      ...data.user,
      name: data.name || data.user.name,
      isOnboarded: true
    });
  }

  if (data.reminderSettings) {
    storage.setReminderSettings(data.reminderSettings);
  }

  if (Array.isArray(data.tasks)) {
    storage.setTasks(data.tasks);
  }

  if (Array.isArray(data.schedules)) {
    storage.setSchedules(data.schedules);
  }

  if (Array.isArray(data.prayerLogs)) {
    storage.setPrayerLogs(data.prayerLogs);
  } else if (data.prayerLogs && typeof data.prayerLogs === 'object') {
    // If stored as map
    const list = Object.values(data.prayerLogs) as PrayerLog[];
    if (list.length > 0) storage.setPrayerLogs(list);
  }

  if (Array.isArray(data.tilawahLogs)) {
    storage.setQuranLogs(data.tilawahLogs);
  }

  if (Array.isArray(data.favoriteVerses)) {
    // Replace favorite ayahs
    const currentFavs = storage.getFavoriteAyahs();
    if (data.favoriteVerses.length > 0) {
      data.favoriteVerses.forEach((fav: FavoriteAyah) => storage.addFavoriteAyah(fav));
    }
  }

  if (Array.isArray(data.favoriteHadiths)) {
    data.favoriteHadiths.forEach((fav: FavoriteHadith) => storage.addFavoriteHadith(fav));
  }

  if (data.targetKhatam) {
    storage.setKhatamTarget(data.targetKhatam);
  }

  // Trigger window update event so all components refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('wi_cloud_sync_completed', { detail: data }));
  }
}

// Upload all local data to cloud
export async function syncAllToCloud(explicitName?: string, explicitPin?: string): Promise<boolean> {
  const user = storage.getUser();
  const studentName = explicitName || user?.name;
  if (!studentName || !studentName.trim()) return false;

  const profileId = normalizeProfileId(studentName);
  const path = `student_profiles/${profileId}`;

  const currentPin = explicitPin !== undefined ? explicitPin : (user as any)?.pin || '';

  const payload = {
    name: studentName.trim(),
    pin: currentPin ? String(currentPin).trim() : '',
    user: user ? { ...user, name: studentName.trim() } : { name: studentName.trim(), isOnboarded: true },
    reminderSettings: storage.getReminderSettings(),
    tasks: storage.getTasks(),
    schedules: storage.getSchedules(),
    prayerLogs: storage.getPrayerLogs(),
    tilawahLogs: storage.getQuranLogs(),
    favoriteVerses: storage.getFavoriteAyahs(),
    favoriteHadiths: storage.getFavoriteHadiths(),
    targetKhatam: storage.getKhatamTarget(),
    reflections: storage.getReflections(),
    focusSessions: storage.getFocusSessions(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'student_profiles', profileId), payload, { merge: true });
    
    // Save last sync timestamp
    if (user) {
      storage.setUser({
        ...user,
        name: studentName.trim(),
        ...((user as any).pin ? {} : currentPin ? { pin: currentPin } : {})
      });
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('wi_last_cloud_sync', new Date().toISOString());
      window.dispatchEvent(new CustomEvent('wi_cloud_synced', { detail: { profileId, time: new Date().toISOString() } }));
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Fetch all data from cloud and update local storage
export async function syncAllFromCloud(explicitName?: string): Promise<boolean> {
  const user = storage.getUser();
  const studentName = explicitName || user?.name;
  if (!studentName || !studentName.trim()) return false;

  const profileId = normalizeProfileId(studentName);
  const path = `student_profiles/${profileId}`;

  try {
    const snap = await getDoc(doc(db, 'student_profiles', profileId));
    if (snap.exists()) {
      applyCloudDataToLocalStorage(snap.data());
      if (typeof window !== 'undefined') {
        localStorage.setItem('wi_last_cloud_sync', new Date().toISOString());
      }
      return true;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return false;
  }
}

// Update 4-digit PIN for current profile in Cloud and Local
export async function updateProfilePin(name: string, pin: string): Promise<boolean> {
  const cleanPin = pin.trim();
  if (cleanPin && !/^\d{4}$/.test(cleanPin)) {
    throw new Error('PIN harus berupa 4 digit angka.');
  }

  const profileId = normalizeProfileId(name);
  const path = `student_profiles/${profileId}`;

  try {
    await setDoc(doc(db, 'student_profiles', profileId), {
      pin: cleanPin,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const user = storage.getUser();
    if (user) {
      storage.setUser({ ...user, pin: cleanPin } as any);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

// Subscribe to real-time changes of the student's profile across devices
export function subscribeToStudentProfile(name: string, onUpdate?: (data: any) => void): Unsubscribe | null {
  if (!name || !name.trim()) return null;
  const profileId = normalizeProfileId(name);
  const path = `student_profiles/${profileId}`;

  try {
    return onSnapshot(
      doc(db, 'student_profiles', profileId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          applyCloudDataToLocalStorage(data);
          if (onUpdate) onUpdate(data);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    console.error('Error attaching student profile listener:', error);
    return null;
  }
}

// --- Website Reviews for Admin & Multiple Devices ---

// Submit a review to Firestore collection `website_reviews`
export async function submitReviewToCloud(review: WebsiteReview): Promise<boolean> {
  const reviewId = review.id || `rev-${Date.now()}`;
  const path = `website_reviews/${reviewId}`;

  const payload: WebsiteReview = {
    ...review,
    id: reviewId,
    submittedAt: review.submittedAt || new Date().toISOString(),
    date: review.date || new Date().toISOString().split('T')[0]
  };

  try {
    await setDoc(doc(db, 'website_reviews', reviewId), payload);
    storage.addWebsiteReview(payload);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Fetch all website reviews from Firestore for the Admin Dashboard
export async function fetchAllReviewsFromCloud(): Promise<WebsiteReview[]> {
  const path = 'website_reviews';
  try {
    const snap = await getDocs(collection(db, 'website_reviews'));
    const list: WebsiteReview[] = [];
    snap.forEach((d) => {
      list.push(d.data() as WebsiteReview);
    });

    // Sort by submittedAt descending
    list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Real-time listener for website reviews in Admin Dashboard
export function subscribeToReviews(callback: (reviews: WebsiteReview[]) => void): Unsubscribe {
  const path = 'website_reviews';
  return onSnapshot(
    collection(db, 'website_reviews'),
    (snap) => {
      const list: WebsiteReview[] = [];
      snap.forEach((d) => {
        list.push(d.data() as WebsiteReview);
      });
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// --- Admin Global Configuration in Cloud ---

export async function fetchAdminConfigFromCloud(): Promise<AdminReviewConfig | null> {
  const path = 'admin_config/review_config';
  try {
    const snap = await getDoc(doc(db, 'admin_config', 'review_config'));
    if (snap.exists()) {
      return snap.data() as AdminReviewConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveAdminConfigToCloud(config: AdminReviewConfig): Promise<boolean> {
  const path = 'admin_config/review_config';
  try {
    await setDoc(doc(db, 'admin_config', 'review_config'), {
      ...config,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    storage.setAdminReviewConfig(config);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}
