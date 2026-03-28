/**
 * Nice TV — Local Stream Proxy (v2)
 *
 * A lightweight proxy that runs on localhost to bypass CORS restrictions.
 * Rewrites HLS playlist URLs so video segments also route through the proxy.
 *
 * Usage:  node proxy.js
 * Runs on: http://localhost:8888
 *
 * Endpoints:
 *   GET /stream?url=<encoded-stream-url>   — proxies & rewrites HLS playlists + segments
 *   GET /fetch?url=<encoded-playlist-url>  — proxies M3U playlist files
 *   GET /health                            — simple health check
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8888;
const PROXY_BASE = `http://localhost:${PORT}`;

/**
 * Check if a response is an HLS playlist that needs URL rewriting.
 */
function isHLSPlaylist(contentType, targetUrl) {
  return (
    (contentType && (
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      contentType.includes('audio/mpegurl') ||
      contentType.includes('audio/x-mpegurl')
    )) ||
    targetUrl.includes('.m3u8')
  );
}

/**
 * Rewrite URLs inside an HLS playlist so all segments and sub-playlists
 * also route through the proxy. Handles both absolute and relative URLs.
 */
function rewritePlaylist(body, baseUrl) {
  return body
    .split('\n')
    .map(line => {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (trimmed === '' || trimmed.startsWith('#')) {
        // But check for URI= attributes inside #EXT tags (e.g. encryption keys)
        if (trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
            const absolute = new URL(uri, baseUrl).href;
            return `URI="${PROXY_BASE}/stream?url=${encodeURIComponent(absolute)}"`;
          });
        }
        return line;
      }

      // Convert relative URLs to absolute, then wrap through proxy
      try {
        const absoluteUrl = new URL(trimmed, baseUrl).href;
        return `${PROXY_BASE}/stream?url=${encodeURIComponent(absoluteUrl)}`;
      } catch {
        return line;
      }
    })
    .join('\n');
}

/**
 * Collect the full response body as a Buffer.
 */
function collectBody(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/**
 * Core proxy logic: fetch a URL, handle redirects, rewrite HLS playlists.
 */
function proxyRequest(targetUrl, res, options = {}) {
  const { isStream = false, redirectCount = 0 } = options;

  if (redirectCount > 8) {
    res.writeHead(502, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Too many redirects' }));
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    res.writeHead(400, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid URL' }));
  }

  const lib = parsed.protocol === 'https:' ? https : http;

  const reqOptions = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': parsed.origin + '/',
      'Origin': parsed.origin,
    },
    timeout: isStream ? 30000 : 15000,
  };

  const proxyReq = lib.request(reqOptions, async (proxyRes) => {
    // Follow redirects
    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
      const redirectUrl = new URL(proxyRes.headers.location, targetUrl).href;
      proxyReq.destroy();
      return proxyRequest(redirectUrl, res, { isStream, redirectCount: redirectCount + 1 });
    }

    const contentType = proxyRes.headers['content-type'] || 'application/octet-stream';

    // If this is an HLS playlist, rewrite it so segments also go through proxy
    if (isStream && isHLSPlaylist(contentType, targetUrl)) {
      try {
        const body = await collectBody(proxyRes);
        const text = body.toString('utf-8');
        const rewritten = rewritePlaylist(text, targetUrl);

        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
        });
        return res.end(rewritten);
      } catch (err) {
        console.error('Playlist rewrite error:', err.message);
      }
    }

    // For everything else (video segments, M3U files, etc.) — pipe through
    res.writeHead(proxyRes.statusCode, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': contentType,
      ...(proxyRes.headers['content-length'] && { 'Content-Length': proxyRes.headers['content-length'] }),
    });

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error for ${targetUrl}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy failed', message: err.message }));
    }
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Timeout' }));
    }
  });

  proxyReq.end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }

  // Health check
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', proxy: 'nice-tv', version: 2 }));
  }

  // Stream proxy — rewrites HLS playlists so segments also go through proxy
  if (parsed.pathname === '/stream' && parsed.query.url) {
    return proxyRequest(parsed.query.url, res, { isStream: true });
  }

  // Fetch proxy — for M3U playlist files (no rewriting needed)
  if (parsed.pathname === '/fetch' && parsed.query.url) {
    return proxyRequest(parsed.query.url, res, { isStream: false });
  }

  // Not found
  res.writeHead(404, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found. Use /stream?url=... or /fetch?url=...' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`📺 Nice TV proxy v2 running at http://localhost:${PORT}`);
  console.log(`   Streams: http://localhost:${PORT}/stream?url=<encoded-url>  (rewrites HLS)`);
  console.log(`   Fetch:   http://localhost:${PORT}/fetch?url=<encoded-url>`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
});
