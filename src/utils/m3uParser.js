/**
 * Nice TV — M3U Parser
 * Primary proxy: Cloudflare Worker (summer-sound-bd21.benjaminphinisee.workers.dev)
 * Fallbacks: direct fetch, allorigins, corsproxy.io
 */

const CF_PROXY = (url) =>
  `https://summer-sound-bd21.benjaminphinisee.workers.dev/?url=${encodeURIComponent(url)}`;

const FALLBACK_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function fetchWithFallback(url) {
  // 1. Cloudflare Worker — primary, fastest, always-on
  try {
    const res = await fetch(CF_PROXY(url), { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('#EXTINF') || text.includes('#EXTM3U')) return text;
    }
  } catch {}

  // 2. Direct fetch (works for GitHub-hosted M3Us with CORS headers)
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
