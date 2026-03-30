import { proxyFetch } from './proxy';

const FALLBACK_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function fetchWithFallback(url) {
  // 1. Smart proxy (local or CF Worker)
  try {
    const res = await fetch(proxyFetch(url), { signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('#EXTINF') || text.includes('#EXTM3U')) return text;
    }
  } catch {}

  // 2. Direct fetch
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('#EXTINF') || text.includes('#EXTM3U')) return text;
    }
  } catch {}

  // 3. Fallback CORS proxies
  for (const proxy of FALLBACK_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const text = await res.text();
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
      const nameMatch = line.match(/,(.+)$/);
      current.name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      current.group = groupMatch ? groupMatch[1] : 'Uncategorized';
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      current.logo = logoMatch ? logoMatch[1] : '';
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
