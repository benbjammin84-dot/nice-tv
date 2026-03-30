import { useState, useEffect } from 'react';
import { proxyFetch } from '../utils/proxy';

const CACHE = {}; // in-memory only, per session

function parseXMLTVDate(str) {
  if (!str) return 0;
  const m = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return 0;
  return Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);
}

function parseXMLTV(xmlText, tvgId) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const now = Date.now();
  const results = [];
  doc.querySelectorAll('programme').forEach(p => {
    if (p.getAttribute('channel')?.toLowerCase() !== tvgId.toLowerCase()) return;
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

async function fetchEPGIndex() {
  if (CACHE.__index) return CACHE.__index;
  const res = await fetch(proxyFetch('https://iptv-org.github.io/epg/index.json'), {
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  CACHE.__index = data;
  return data;
}

export function useChannelEPG(channel) {
  const [nowNext, setNowNext] = useState({ now: null, next: null });

  useEffect(() => {
    if (!channel?.tvgId) { setNowNext({ now: null, next: null }); return; }
    const tvgId = channel.tvgId.toLowerCase();
    let cancelled = false;

    async function load() {
      // Check in-memory cache
      if (CACHE[tvgId]) {
        resolve(CACHE[tvgId]);
        return;
      }

      try {
        const index = await fetchEPGIndex();
        const guide = index.find(g =>
          g.channels?.some(c => c.id?.toLowerCase() === tvgId)
        );
        if (!guide) return;

        const res = await fetch(proxyFetch(guide.url), { signal: AbortSignal.timeout(20000) });
        const xml = await res.text();
        if (!xml.trim().startsWith('<')) return;

        const progs = parseXMLTV(xml, tvgId);
        CACHE[tvgId] = progs;
        if (!cancelled) resolve(progs);
      } catch (e) {
        console.warn('[EPG] fetch failed for', tvgId, e);
      }
    }

    function resolve(progs) {
      const now = Date.now();
      const nowP = progs.find(p => p.start <= now && p.stop > now);
      const nextP = progs.find(p => p.start > now);
      setNowNext({ now: nowP || null, next: nextP || null });
    }

    load();
    return () => { cancelled = true; };
  }, [channel?.tvgId]);

  return nowNext;
}
