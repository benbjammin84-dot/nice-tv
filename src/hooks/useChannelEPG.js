import { useState, useEffect } from 'react';

const CACHE = {}; // in-memory, per session

// epgshare01.online feeds — gzip, fetched via local proxy which handles decompression
// Ordered by likelihood of matching: US first, then Plex, UK, CA
const EPG_SOURCES = [
  'http://epgshare01.online/epgshare01/epg_ripper_US1.xml.gz',
  'http://epgshare01.online/epgshare01/epg_ripper_PLEX1.xml.gz',
  'http://epgshare01.online/epgshare01/epg_ripper_UK1.xml.gz',
  'http://epgshare01.online/epgshare01/epg_ripper_CA1.xml.gz',
];

// Loaded source data: { [sourceUrl]: Set of channel ids }
const SOURCE_CHANNEL_INDEX = {};
// Loaded XML text cache: { [sourceUrl]: string }
const SOURCE_XML = {};

function parseXMLTVDate(str) {
  if (!str) return 0;
  const m = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return 0;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

function parseXMLTV(xmlText, tvgId) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const now = Date.now();
  const id = tvgId.toLowerCase();
  const results = [];
  doc.querySelectorAll('programme').forEach(p => {
    const ch = p.getAttribute('channel')?.toLowerCase();
    if (ch !== id) return;
    const start = parseXMLTVDate(p.getAttribute('start'));
    const stop = parseXMLTVDate(p.getAttribute('stop'));
    if (stop < now) return;
    results.push({
      start, stop,
      title: p.querySelector('title')?.textContent || '',
      desc: p.querySelector('desc')?.textContent || '',
    });
  });
  return results.sort((a, b) => a.start - b.start).slice(0, 5);
}

function extractChannelIds(xmlText) {
  const ids = new Set();
  const re = /<channel id="([^"]+)"/g;
  let m;
  while ((m = re.exec(xmlText)) !== null) ids.add(m[1].toLowerCase());
  return ids;
}

async function fetchSource(url) {
  if (SOURCE_XML[url]) return SOURCE_XML[url];
  // Route through local proxy — it handles gzip decompression and http→https
  const proxyUrl = `http://localhost:8888/fetch?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(30000) });
  const text = await res.text();
  if (!text.trim().startsWith('<')) throw new Error('Not XML');
  SOURCE_XML[url] = text;
  SOURCE_CHANNEL_INDEX[url] = extractChannelIds(text);
  return text;
}

export function useChannelEPG(channel) {
  const [nowNext, setNowNext] = useState({ now: null, next: null });

  useEffect(() => {
    if (!channel?.tvgId) { setNowNext({ now: null, next: null }); return; }
    const tvgId = channel.tvgId.toLowerCase();
    let cancelled = false;

    async function load() {
      if (CACHE[tvgId]) { resolve(CACHE[tvgId]); return; }

      for (const sourceUrl of EPG_SOURCES) {
        try {
          // If we already loaded this source, check index before re-parsing
          if (SOURCE_CHANNEL_INDEX[sourceUrl]) {
            if (!SOURCE_CHANNEL_INDEX[sourceUrl].has(tvgId)) continue;
          }

          const xml = await fetchSource(sourceUrl);
          if (cancelled) return;

          // Re-check after loading
          if (!SOURCE_CHANNEL_INDEX[sourceUrl]?.has(tvgId)) continue;

          const progs = parseXMLTV(xml, tvgId);
          if (progs.length === 0) continue;

          CACHE[tvgId] = progs;
          resolve(progs);
          return;
        } catch (e) {
          console.warn('[EPG] source failed:', sourceUrl, e.message);
        }
      }

      // Nothing found
      if (!cancelled) setNowNext({ now: null, next: null });
    }

    function resolve(progs) {
      const now = Date.now();
      const nowP = progs.find(p => p.start <= now && p.stop > now);
      const nextP = progs.find(p => p.start > now);
      if (!cancelled) setNowNext({ now: nowP || null, next: nextP || null });
    }

    load();
    return () => { cancelled = true; };
  }, [channel?.tvgId]);

  return nowNext;
}
