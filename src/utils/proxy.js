/**
 * Nice TV — Smart Proxy
 * Uses localhost:8888 when running locally (dev or local build),
 * falls back to Cloudflare Worker for production (GitHub Pages).
 */

const CF_PROXY = 'https://summer-sound-bd21.benjaminphinisee.workers.dev';
const LOCAL_PROXY = 'http://localhost:8888';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

/**
 * Proxy a general fetch (M3U, EPG XML, JSON, etc.)
 * Local: http://localhost:8888/fetch?url=...
 * Prod:  https://cf-worker/?url=...
 */
export function proxyFetch(url) {
  if (isLocal) return `${LOCAL_PROXY}/fetch?url=${encodeURIComponent(url)}`;
  return `${CF_PROXY}/?url=${encodeURIComponent(url)}`;
}

/**
 * Proxy a stream (HLS rewriting, segments, etc.)
 * Local: http://localhost:8888/stream?url=...
 * Prod:  https://cf-worker/?url=... (best effort, no rewrite)
 */
export function proxyStream(url) {
  if (isLocal) return `${LOCAL_PROXY}/stream?url=${encodeURIComponent(url)}`;
  return `${CF_PROXY}/?url=${encodeURIComponent(url)}`;
}
