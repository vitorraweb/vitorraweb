import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 * If Firebase isn't configured, falls back to a base64 string for local demoing.
 */
export async function uploadFile(file: File, folder: string = 'uploads'): Promise<string> {
  if (!storage) {
    console.warn("Firebase Storage is not initialized. Falling back to local Base64 mock.");
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to convert file to Base64 data URL.'));
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      }, 1200);
    });
  }

  try {
    const filename = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    throw error;
  }
}
