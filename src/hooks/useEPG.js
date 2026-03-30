import { useState, useEffect, useRef, useMemo } from 'react';
import { proxyFetch } from '../utils/proxy';

const EPG_CACHE_KEY = 'nicetv_epg_cache';
const EPG_CACHE_TTL = 1000 * 60 * 60; // 1 hour
const EPG_INDEX_URL = 'https://iptv-org.github.io/epg/index.json';

function parseXMLTV(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const programmes = doc.querySelectorAll('programme');
  const guide = {};
  const now = Date.now();

  programmes.forEach(p => {
    const channel = p.getAttribute('channel');
    const start = parseXMLTVDate(p.getAttribute('start'));
    const stop = parseXMLTVDate(p.getAttribute('stop'));
    const title = p.querySelector('title')?.textContent || '';
    const desc = p.querySelector('desc')?.textContent || '';
    if (!guide[channel]) guide[channel] = [];
    guide[channel].push({ start, stop, title, desc });
  });

  Object.keys(guide).forEach(ch => {
    guide[ch] = guide[ch]
      .filter(p => p.stop > now)
      .sort((a, b) => a.start - b.start)
      .slice(0, 8);
  });

  return guide;
}

function parseXMLTVDate(str) {
  if (!str) return 0;
  const m = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return 0;
  return Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);
}

function normalizeId(tvgId) {
  return tvgId ? tvgId.replace(/@.*$/, '').toLowerCase() : '';
}

export function useEPG(channels) {
  const [epg, setEpg] = useState({});
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  const channelKey = useMemo(
    () => (channels || []).map(c => c.tvgId).filter(Boolean).slice(0, 20).join(','),
    [channels]
  );

  useEffect(() => {
    if (!channelKey) return;
    fetchedRef.current = false; // reset when source changes
  }, [channelKey]);

  useEffect(() => {
    if (!channelKey || fetchedRef.current) return;

    // Check cache
    try {
      const cached = JSON.parse(localStorage.getItem(EPG_CACHE_KEY) || '{}');
      if (cached.ts && Date.now() - cached.ts < EPG_CACHE_TTL && cached.data && Object.keys(cached.data).length > 0) {
        setEpg(cached.data);
        return;
      }
    } catch {}

    fetchedRef.current = true;
    setLoading(true);

    const tvgIds = new Set(
      (channels || []).map(c => normalizeId(c.tvgId)).filter(Boolean)
    );

    // Step 1: fetch EPG index
    fetch(proxyFetch(EPG_INDEX_URL), { signal: AbortSignal.timeout(15000) })
      .then(r => r.json())
      .then(async (index) => {
        // Step 2: find guides matching our channels (cap at 3 to keep it fast)
        const matchingGuides = index
          .filter(guide => guide.channels?.some(ch => tvgIds.has(normalizeId(ch.id))))
          .slice(0, 3);

        if (matchingGuides.length === 0) {
          // Fallback: US guide
          matchingGuides.push({ url: 'https://iptv-org.github.io/epg/guides/us/tvtv.us.epg.xml' });
        }

        console.log(`[EPG] Fetching ${matchingGuides.length} guide(s):`, matchingGuides.map(g => g.url));

        // Step 3: fetch each guide XML through local proxy (handles large files)
        const merged = {};
        await Promise.all(
          matchingGuides.map(guide =>
            fetch(proxyFetch(guide.url), { signal: AbortSignal.timeout(30000) })
              .then(r => r.text())
              .then(xml => {
                if (xml.trim().startsWith('<')) {
                  Object.assign(merged, parseXMLTV(xml));
                  console.log(`[EPG] Loaded ${Object.keys(merged).length} channels from ${guide.url}`);
                } else {
                  console.warn('[EPG] Got non-XML response for', guide.url);
                }
              })
              .catch(e => console.warn('[EPG] Failed to fetch guide:', guide.url, e))
          )
        );

        setEpg(merged);
        try {
          localStorage.setItem(EPG_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: merged }));
        } catch {}
      })
      .catch(err => console.warn('[EPG] Index fetch failed:', err))
      .finally(() => setLoading(false));
  }, [channelKey, channels]);

  function getNowNext(tvgId) {
    if (!tvgId) return { now: null, next: null };
    const progs = epg[tvgId] || epg[normalizeId(tvgId)] || null;
    if (!progs) return { now: null, next: null };
    const nowTs = Date.now();
    const nowProg = progs.find(p => p.start <= nowTs && p.stop > nowTs);
    const nextProg = progs.find(p => p.start > nowTs);
    return { now: nowProg || null, next: nextProg || null };
  }

  return { epg, loading, getNowNext };
}
