/**
 * Nice TV — Smart Proxy
 * Uses localhost:8888 when running locally, CF Worker in production.
 */

const CF_PROXY = 'https://summer-sound-bd21.benjaminphinisee.workers.dev';
const LOCAL_PROXY = 'http://localhost:8888';

export const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

/** Proxy a general fetch (M3U, EPG XML, JSON) */
export function proxyFetch(url) {
  if (isLocal) return `${LOCAL_PROXY}/fetch?url=${encodeURIComponent(url)}`;
  return `${CF_PROXY}/?url=${encodeURIComponent(url)}`;
}

/** Proxy a stream (HLS rewriting + segment passthrough) */
export function proxyStream(url) {
  if (isLocal) return `${LOCAL_PROXY}/stream?url=${encodeURIComponent(url)}`;
  return `${CF_PROXY}/?url=${encodeURIComponent(url)}`;
}

/** Alias used by VideoPlayer — same as proxyStream */
export function getProxyStreamUrl(url) {
  return proxyStream(url);
}

/**
 * Check if the local proxy is reachable.
 * VideoPlayer uses this to decide whether to route streams through it.
 */
export async function isProxyAvailable() {
  if (!isLocal) return false;
  try {
    const res = await fetch(`${LOCAL_PROXY}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
