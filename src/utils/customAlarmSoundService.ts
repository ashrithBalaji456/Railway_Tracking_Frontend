/**
 * Custom Alarm Sound Management Service
 * Persists user-uploaded MP3/WAV/AAC audio files using browser IndexedDB,
 * allowing custom alarm ringtones, defaults, favorites, and instant playback.
 */

export interface CustomAlarmSound {
  id: string;
  name: string;
  blob: Blob;
  sizeBytes: number;
  isDefault: boolean;
  isFavorite: boolean;
  createdAt: number;
}

const DB_NAME = 'railtrack_alarm_sounds_db';
const DB_VERSION = 1;
const STORE_NAME = 'sounds';

class CustomAlarmSoundService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private activeBlobUrls: Map<string, string> = new Map();

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        reject(new Error('IndexedDB is not supported in this browser'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('isDefault', 'isDefault', { unique: false });
          store.createIndex('isFavorite', 'isFavorite', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        reject(event.target.error || new Error('Failed to open IndexedDB'));
      };
    });

    return this.dbPromise;
  }

  /**
   * Get all uploaded custom alarm sounds
   */
  async getAllSounds(): Promise<CustomAlarmSound[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list: CustomAlarmSound[] = req.result || [];
          // Sort favorites first, then newest
          list.sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return b.createdAt - a.createdAt;
          });
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Error reading custom sounds from IndexedDB:', e);
      return [];
    }
  }

  /**
   * Save a newly uploaded audio file (MP3, WAV, OGG, M4A)
   */
  async saveSound(file: File): Promise<CustomAlarmSound> {
    const db = await this.getDB();
    const id = 'sound_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    
    // Check if this is the first sound; if so, make it default automatically
    const existing = await this.getAllSounds();
    const isFirst = existing.length === 0;

    const soundItem: CustomAlarmSound = {
      id,
      name: file.name.replace(/\\.[^/.]+$/, ''), // Clean file name without extension
      blob: file,
      sizeBytes: file.size,
      isDefault: isFirst,
      isFavorite: false,
      createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(soundItem);

      req.onsuccess = () => {
        this.notifyChange();
        resolve(soundItem);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Set a specific audio as the default alarm sound
   */
  async setDefault(id: string): Promise<void> {
    const db = await this.getDB();
    const all = await this.getAllSounds();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      all.forEach((item) => {
        item.isDefault = item.id === id;
        store.put(item);
      });

      tx.oncomplete = () => {
        localStorage.setItem('rail_default_custom_sound_id', id);
        this.notifyChange();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Toggle favorite status on an audio file
   */
  async toggleFavorite(id: string): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const item: CustomAlarmSound = req.result;
        if (!item) {
          reject(new Error('Sound not found'));
          return;
        }
        item.isFavorite = !item.isFavorite;
        store.put(item);
      };

      tx.oncomplete = () => {
        this.notifyChange();
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete an uploaded audio file
   */
  async deleteSound(id: string): Promise<void> {
    const db = await this.getDB();
    
    // Revoke any created ObjectURL to free memory
    const existingUrl = this.activeBlobUrls.get(id);
    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
      this.activeBlobUrls.delete(id);
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => {
        if (localStorage.getItem('rail_default_custom_sound_id') === id) {
          localStorage.removeItem('rail_default_custom_sound_id');
        }
        this.notifyChange();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get an executable browser blob audio URL for playback
   */
  async getSoundBlobUrl(id: string): Promise<string | null> {
    if (this.activeBlobUrls.has(id)) {
      return this.activeBlobUrls.get(id)!;
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          const item: CustomAlarmSound = req.result;
          if (item && item.blob) {
            const url = URL.createObjectURL(item.blob);
            this.activeBlobUrls.set(id, url);
            resolve(url);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Get the current default custom sound if any
   */
  async getDefaultSound(): Promise<CustomAlarmSound | null> {
    const sounds = await this.getAllSounds();
    const defaultSaved = sounds.find((s) => s.isDefault);
    if (defaultSaved) return defaultSaved;

    const savedId = localStorage.getItem('rail_default_custom_sound_id');
    if (savedId) {
      const match = sounds.find((s) => s.id === savedId);
      if (match) return match;
    }

    return sounds.length > 0 ? sounds[0] : null;
  }

  private notifyChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rail-custom-sounds-changed'));
    }
  }
}

export const customAlarmSoundService = new CustomAlarmSoundService();
export default customAlarmSoundService;
