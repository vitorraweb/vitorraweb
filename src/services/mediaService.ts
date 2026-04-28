import { storage, db } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, where, onSnapshot, Unsubscribe } from 'firebase/firestore';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface MediaItem {
  id: string;
  url: string;
  name: string;
  originalName: string;
  type: 'image' | 'document' | 'video' | 'other';
  mimeType: string;
  size: number;
  folder: string;
  storagePath: string;
  uploadedAt: string;
  uploadedBy?: string;
  width?: number;
  height?: number;
}

export type MediaFilter = 'all' | 'image' | 'document' | 'video';

// ─── Helpers ────────────────────────────────────────────────────────────────
function getMediaType(mimeType: string): MediaItem['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('application/pdf') || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('spreadsheet')) return 'document';
  return 'other';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── Upload ─────────────────────────────────────────────────────────────────
export async function uploadMedia(
  file: File,
  folder: string = 'general',
  uploadedBy?: string
): Promise<MediaItem> {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeName = sanitizeFilename(file.name);
  const storagePath = `media/${folder}/${id}_${safeName}`;

  let url: string;

  if (storage) {
    // Firebase Storage upload
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    url = await getDownloadURL(snapshot.ref);
  } else {
    // Fallback: base64 for local dev without Storage
    url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const mediaItem: MediaItem = {
    id,
    url,
    name: file.name,
    originalName: file.name,
    type: getMediaType(file.type),
    mimeType: file.type,
    size: file.size,
    folder,
    storagePath,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };

  // Get image dimensions
  if (file.type.startsWith('image/')) {
    try {
      const dims = await getImageDimensions(url);
      mediaItem.width = dims.width;
      mediaItem.height = dims.height;
    } catch { /* ignore */ }
  }

  // Save metadata to Firestore
  if (db) {
    await setDoc(doc(db, 'media', id), mediaItem);
  }

  return mediaItem;
}

// ─── Delete ─────────────────────────────────────────────────────────────────
export async function deleteMedia(item: MediaItem): Promise<void> {
  // Delete from Storage
  if (storage && item.storagePath && !item.url.startsWith('data:')) {
    try {
      const storageRef = ref(storage, item.storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Failed to delete from Storage (may not exist):', err);
    }
  }

  // Delete from Firestore
  if (db) {
    await deleteDoc(doc(db, 'media', item.id));
  }
}

// ─── Bulk Delete ────────────────────────────────────────────────────────────
export async function deleteMediaBulk(items: MediaItem[]): Promise<void> {
  await Promise.all(items.map(item => deleteMedia(item)));
}

// ─── List (one-time fetch) ──────────────────────────────────────────────────
export async function listMedia(filter?: MediaFilter): Promise<MediaItem[]> {
  if (!db) return [];

  const mediaRef = collection(db, 'media');
  let q;
  if (filter && filter !== 'all') {
    q = query(mediaRef, where('type', '==', filter), orderBy('uploadedAt', 'desc'));
  } else {
    q = query(mediaRef, orderBy('uploadedAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as MediaItem);
}

// ─── Real-time listener ─────────────────────────────────────────────────────
export function subscribeToMedia(
  callback: (items: MediaItem[]) => void,
  filter?: MediaFilter
): Unsubscribe {
  if (!db) {
    callback([]);
    return () => {};
  }

  const mediaRef = collection(db, 'media');
  let q;
  if (filter && filter !== 'all') {
    q = query(mediaRef, where('type', '==', filter), orderBy('uploadedAt', 'desc'));
  } else {
    q = query(mediaRef, orderBy('uploadedAt', 'desc'));
  }

  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => d.data() as MediaItem));
  }, err => {
    console.error('Media subscription error:', err);
    callback([]);
  });
}

// ─── Utilities ──────────────────────────────────────────────────────────────
function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

export { formatFileSize };
