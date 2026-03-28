import { useState, useEffect } from 'react';
import { parseM3U } from '../utils/m3uParser';

const STORAGE_KEY = 'nicetv_sources';
const VERSION_KEY = 'nicetv_sources_version';

// Bump this number any time you add, remove, or change default sources.
// Existing users will automatically receive new defaults on their next visit.
const DEFAULTS_VERSION = 2;

const DEFAULT_SOURCES = [
  { id: '1', name: 'IPTV-Org Global', url: 'https://iptv-org.github.io/iptv/index.m3u', channels: [] },
  { id: '2', name: 'Pluto TV', url: 'https://i.mjh.nz/PlutoTV/all.m3u8', channels: [] },
  { id: '3', name: 'Free-TV GitHub', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', channels: [] },
  { id: '4', name: 'RW1986 Curated', url: 'https://github.com/RW1986/IPTV/raw/main/lineup.m3u8', channels: [] },
  { id: '5', name: 'Samsung TV Plus', url: 'https://apsattv.com/ssungusa.m3u', channels: [] },
  { id: '6', name: 'XUMO', url: 'https://www.apsattv.com/xumo.m3u', channels: [] },
];

/**
 * Merge new default sources into a user's existing saved list.
 * Keeps any sources the user added manually and avoids duplicates.
 */
function mergeDefaults(saved) {
  const existingUrls = new Set(saved.map(s => s.url));
  const newSources = DEFAULT_SOURCES.filter(d => !existingUrls.has(d.url));
  return [...saved, ...newSources];
}

export function usePlaylists() {
  const [sources, setSources] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedVersion = Number(localStorage.getItem(VERSION_KEY) || '0');

      if (!saved) {
        // First-time visitor — give them the full default list
        localStorage.setItem(VERSION_KEY, String(DEFAULTS_VERSION));
        return DEFAULT_SOURCES;
      }

      const parsed = JSON.parse(saved);

      if (savedVersion < DEFAULTS_VERSION) {
        // Returning visitor with outdated defaults — merge in new sources
        const merged = mergeDefaults(parsed);
        localStorage.setItem(VERSION_KEY, String(DEFAULTS_VERSION));
        return merged;
      }

      return parsed;
    } catch {
      localStorage.setItem(VERSION_KEY, String(DEFAULTS_VERSION));
      return DEFAULT_SOURCES;
    }
  });
  const [activeSource, setActiveSource] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }, [sources]);

  const addSource = async (name, url) => {
    const channels = await parseM3U(url);
    const newSource = { id: Date.now().toString(), name, url, channels };
    setSources(prev => [...prev, newSource]);
    setActiveSource(newSource);
  };

  const removeSource = (id) => {
    setSources(prev => prev.filter(s => s.id !== id));
    setActiveSource(null);
  };

  const selectSource = async (source) => {
    if (!source.channels.length) {
      const channels = await parseM3U(source.url);
      const updated = { ...source, channels };
      setSources(prev => prev.map(s => s.id === source.id ? updated : s));
      setActiveSource(updated);
    } else {
      setActiveSource(source);
    }
  };

  return { sources, addSource, removeSource, activeSource, setActiveSource: selectSource };
}
