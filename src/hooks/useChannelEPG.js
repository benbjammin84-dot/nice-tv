import { useState, useEffect } from 'react';
import { proxyFetch } from '../utils/proxy';

const EPG_CACHE_KEY = 'nicetv_epg_cache';
const EPG_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const GUIDE_URLS = [
  'https://worker-9dd4.onrender.com/guide.xml',
];

function parseXMLTVDate(str) {
  if (!str) return 0;
  const m = str.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  return m ? Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]) : 0;
}

function parseNowNext(xmlText, channelId) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const now = Date.now();
  const progs = Array.from(doc.querySelectorAll('programme'))
    .filter(p => p.getAttribute('channel') === channelId)
    .map(p => ({
      start: parseXMLTVDate(p.getAttribute('start')),
      stop: parseXMLTVDate(p.getAttribute('stop')),
      title: p.querySelector('title')?.textContent || '',
      desc: p.querySelector('desc')?.textContent || '',
    }))
    .sort((a, b) => a.start - b.start);

  return {
    now: progs.find(p => p.start <= now && p.stop > now) || null,
    next: progs.find(p => p.start > now) || null,
  };
}

// Shared XML cache so multiple channels don't re-fetch the same guide
let guideXmlCache = null;
let guideXmlTs = 0;

async function fetchGuideXml() {
  const now = Date.now();
  if (guideXmlCache && (now - guideXmlTs) < EPG_CACHE_TTL) return guideXmlCache;

  // Try localStorage cache first
  try {
    const cached = JSON.parse(localStorage.getItem(EPG_CACHE_KEY) || '{}');
    if (cached.ts && (now - cached.ts) < EPG_CACHE_TTL && cached.xml) {
      guideXmlCache = cached.xml;
      guideXmlTs = cached.ts;
      return guideXmlCache;
    }
  } catch {}

  for (const url of GUIDE_URLS) {
    try {
      const res = await fetch(proxyFetch(url), { signal: AbortSignal.timeout(30000) });
      const xml = await res.text();
      if (!xml.trim().startsWith('<')) continue;
      guideXmlCache = xml;
      guideXmlTs = now;
      try {
        localStorage.setItem(EPG_CACHE_KEY, JSON.stringify({ ts: now, xml }));
      } catch {}
      return xml;
    } catch (e) {
      console.warn('[EPG] guide fetch failed:', url, e.message);
    }
  }
  return null;
}

// Per-channel in-memory cache
const channelCache = {};

export function useChannelEPG(channel) {
  const [nowNext, setNowNext] = useState({ now: null, next: null });

  useEffect(() => {
    if (!channel?.tvgId) { setNowNext({ now: null, next: null }); return; }
    const tvgId = channel.tvgId;
    let cancelled = false;

    async function load() {
      if (channelCache[tvgId]) {
        if (!cancelled) setNowNext(channelCache[tvgId]);
        return;
      }
      try {
        const xml = await fetchGuideXml();
        if (!xml || cancelled) return;
        const result = parseNowNext(xml, tvgId);
        channelCache[tvgId] = result;
        if (!cancelled) setNowNext(result);
      } catch (e) {
        console.warn('[EPG] parse failed for', tvgId, e.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [channel?.tvgId]);

  return nowNext;
}
