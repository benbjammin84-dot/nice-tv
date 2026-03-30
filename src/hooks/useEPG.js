import { useState, useEffect } from 'react';

const CF_PROXY = 'https://summer-sound-bd21.benjaminphinisee.workers.dev';
const EPG_CACHE_KEY = 'nicetv_epg_cache';
const EPG_CACHE_TTL = 1000 * 60 * 30; // 30 min

function proxyUrl(url) {
  return `${CF_PROXY}/?url=${encodeURIComponent(url)}`;
}

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

  // For each channel keep only current + upcoming
  Object.keys(guide).forEach(ch => {
    guide[ch] = guide[ch]
      .filter(p => p.stop > now)
      .sort((a, b) => a.start - b.start)
      .slice(0, 5);
  });

  return guide;
}

function parseXMLTVDate(str) {
  if (!str) return 0;
  // Format: 20240101120000 +0000
  const m = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return 0;
  return Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);
}

export function useEPG(channels) {
  const [epg, setEpg] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tvgIds = channels?.map(c => c.tvgId).filter(Boolean) || [];
    if (tvgIds.length === 0) return;

    // Check cache
    try {
      const cached = JSON.parse(localStorage.getItem(EPG_CACHE_KEY) || '{}');
      if (cached.ts && Date.now() - cached.ts < EPG_CACHE_TTL && cached.data) {
        setEpg(cached.data);
        return;
      }
    } catch {}

    setLoading(true);
    const epgUrl = 'https://iptv-org.github.io/epg/guides/us/tvtv.us.epg.xml';

    fetch(proxyUrl(epgUrl))
      .then(r => r.text())
      .then(xml => {
        const guide = parseXMLTV(xml);
        setEpg(guide);
        try {
          localStorage.setItem(EPG_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: guide }));
        } catch {}
      })
      .catch(err => console.warn('EPG fetch failed:', err))
      .finally(() => setLoading(false));
  }, [channels?.map(c => c.tvgId).join(',')]);

  function getNowNext(tvgId) {
    if (!tvgId || !epg[tvgId]) return { now: null, next: null };
    const progs = epg[tvgId];
    const nowTs = Date.now();
    const nowProg = progs.find(p => p.start <= nowTs && p.stop > nowTs);
    const nextProg = progs.find(p => p.start > nowTs);
    return { now: nowProg || null, next: nextProg || null };
  }

  return { epg, loading, getNowNext };
}
