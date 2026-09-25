// Fetch a protected license file as a Blob (endpoint 8 is Bearer-only).
export async function fetchLicenseBlob(token: string, name: string): Promise<Blob> {
  const res = await fetch(`/api/driver/license/${encodeURIComponent(name)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Session expired — please log in again.');
    if (res.status === 403) throw new Error('You are not allowed to view this file.');
    if (res.status === 404) throw new Error('License file not found.');
    throw new Error('Could not load the license file.');
  }
  return res.blob();
}

// What kind of file is this license? Decided from the URL — no download needed.
export function licenseKind(licenseUrl: string): 'image' | 'pdf' | 'other' {
  const ext = (licenseUrl.split('.').pop() ?? '').toLowerCase();
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

export async function viewLicense(token: string, name: string): Promise<void> {
  // Open the blank tab FIRST, inside the click — otherwise popup blockers kill it
  const win = window.open('', '_blank');
  if (!win) {
    throw new Error('Your browser blocked the file window — allow popups, then try again.');
  }
  try {
    const blob = await fetchLicenseBlob(token, name);
    const url = URL.createObjectURL(blob);
    win.location.href = url;
    // Free the blob's memory once the tab has loaded (60s is plenty)
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    win.close();
    console.error('viewLicense failed:', err); // convention: console.error + friendly message
    throw err;
  }
}
