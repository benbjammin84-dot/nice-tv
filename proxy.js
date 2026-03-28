/**
 * Nice TV — Local Stream Proxy
 *
 * A lightweight proxy that runs on localhost to bypass CORS restrictions.
 * Streams are fetched directly from the source, just like VLC does.
 *
 * Usage:  node proxy.js
 * Runs on: http://localhost:8888
 *
 * Endpoint:
 *   GET /stream?url=<encoded-stream-url>
 *   GET /fetch?url=<encoded-playlist-url>
 *   GET /health  — simple health check
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8888;

function proxyRequest(targetUrl, res, isStream) {
  const parsed = new URL(targetUrl);
  const lib = parsed.protocol === 'https:' ? https : http;

  const options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': parsed.origin + '/',
    },
    timeout: isStream ? 30000 : 15000,
  };

  const proxyReq = lib.request(options, (proxyRes) => {
    // Follow redirects (up to 5)
    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
      const redirectUrl = new URL(proxyRes.headers.location, targetUrl).href;
      proxyReq.destroy();
      return proxyRequest(redirectUrl, res, isStream);
    }

    // Set CORS headers so the browser accepts the response
    res.writeHead(proxyRes.statusCode, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
      ...(proxyRes.headers['content-length'] && { 'Content-Length': proxyRes.headers['content-length'] }),
    });

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error for ${targetUrl}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ error: 'Proxy failed', message: err.message }));
    }
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      });
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
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
    return res.end(JSON.stringify({ status: 'ok', proxy: 'nice-tv' }));
  }

  // Stream proxy (for video playback)
  if (parsed.pathname === '/stream' && parsed.query.url) {
    return proxyRequest(parsed.query.url, res, true);
  }

  // Fetch proxy (for M3U playlist files)
  if (parsed.pathname === '/fetch' && parsed.query.url) {
    return proxyRequest(parsed.query.url, res, false);
  }

  // Not found
  res.writeHead(404, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify({ error: 'Not found. Use /stream?url=... or /fetch?url=...' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`📺 Nice TV proxy running at http://localhost:${PORT}`);
  console.log(`   Stream:  http://localhost:${PORT}/stream?url=<encoded-url>`);
  console.log(`   Fetch:   http://localhost:${PORT}/fetch?url=<encoded-url>`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
});
