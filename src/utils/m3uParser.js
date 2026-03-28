/**
 * CORS proxies — we try multiple in order so the app doesn't break
 * when one goes down (which happens constantly with free proxies).
 */
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchWithFallback(url) {
  // First try direct (works for GitHub-hosted files which have CORS headers)
  try {
    const res = await fetch(url);
    if (res.ok) return await res.text();
  } catch {}

  // Try each proxy in order
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const text = await res.text();
        // Make sure we got actual M3U content, not an error page
        if (text.includes('#EXTINF') || text.includes('#EXTM3U')) return text;
      }
    } catch {}
  }

  throw new Error(`All fetch methods failed for: ${url}`);
}

export async function parseM3U(url) {
  try {
    const text = await fetchWithFallback(url);
    return parseM3UText(text);
  } catch (err) {
    console.error('Failed to fetch M3U:', err);
    return [];
  }
}

export function parseM3UText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const channels = [];
  let current = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF')) {
      current = {};
      // Extract name
      const nameMatch = line.match(/,(.+)$/);
      current.name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      // Extract group
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      current.group = groupMatch ? groupMatch[1] : 'Uncategorized';
      // Extract logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      current.logo = logoMatch ? logoMatch[1] : '';
      // Extract tvg-id for EPG
      const idMatch = line.match(/tvg-id="([^"]*)"/i);
      current.tvgId = idMatch ? idMatch[1] : '';
    } else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
      current.url = line;
      if (current.name) channels.push({ ...current });
      current = {};
    }
  }
  return channels;
}

/**
 * Get a CORS-proxied version of a stream URL for HLS.js playback.
 * Call this when direct playback fails.
 */
export function getProxiedStreamUrl(url) {
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
}
