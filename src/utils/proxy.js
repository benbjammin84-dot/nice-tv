/**
 * Local proxy helper.
 *
 * Checks if the local Nice TV proxy is running (localhost:8888).
 * If it is, routes all requests through it for CORS-free playback.
 * If it isn't, falls back to free CORS proxies.
 */

const LOCAL_PROXY = 'http://localhost:8888';

let _proxyAvailable = null; // cached result

/**
 * Check if the local proxy is running. Caches the result for 30s.
 */
export async function isProxyAvailable() {
  if (_proxyAvailable !== null) return _proxyAvailable;
  try {
    const res = await fetch(`${LOCAL_PROXY}/health`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    _proxyAvailable = data.status === 'ok';
  } catch {
    _proxyAvailable = false;
  }
  // Re-check every 30 seconds
  setTimeout(() => { _proxyAvailable = null; }, 30000);
  return _proxyAvailable;
}

/**
 * Get the proxied URL for fetching playlist files.
 */
export function getProxyFetchUrl(url) {
  return `${LOCAL_PROXY}/fetch?url=${encodeURIComponent(url)}`;
}

/**
 * Get the proxied URL for streaming video.
 */
export function getProxyStreamUrl(url) {
  return `${LOCAL_PROXY}/stream?url=${encodeURIComponent(url)}`;
}
