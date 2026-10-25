import { apiFetch, BASE_URL } from '../api';
import * as FileSystem from 'expo-file-system/legacy';

// All network calls of the app go through here. Never throws.
export const call = (token, path, opts) => apiFetch(path, token, opts);
export const errOf = (r, fallback = 'Something went wrong. Please try again.') =>
  (r && r.data && r.data.error) || fallback;

export async function uploadNative(token, path, file) {
  const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
  try {
    const response = await FileSystem.uploadAsync(url, file.uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: file.type,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    let data = {};
    try {
      data = JSON.parse(response.body);
    } catch {
      data = {};
    }
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, status: 0, data: { error: `License upload failed: ${reason}` } };
  }
}
