import { useState, useEffect, useCallback } from 'react';
import { parseM3U } from '../utils/m3uParser';
import { DEFAULT_SOURCES, CATALOG_VERSION } from '../data/sourceCatalog';

const STORAGE_KEY = 'nicetv_sources';
const VERSION_KEY = 'nicetv_sources_version';

function initSources(defaults) {
  return defaults.map(d => ({ ...d, channels: [] }));
}

/**
 * Merge new default sources into a user's existing saved list.
 * Keeps any sources the user added manually and avoids duplicates.
 */
function mergeDefaults(saved) {
  const existingUrls = new Set(saved.map(s => s.url));
  const newSources = initSources(DEFAULT_SOURCES).filter(d => !existingUrls.has(d.url));
  return [...saved, ...newSources];
}

export function usePlaylists() {
  const [sources, setSources] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedVersion = Number(localStorage.getItem(VERSION_KEY) || '0');

      if (!saved) {
        localStorage.setItem(VERSION_KEY, String(CATALOG_VERSION));
        return initSources(DEFAULT_SOURCES);
      }

      const parsed = JSON.parse(saved);

      if (savedVersion < CATALOG_VERSION) {
        const merged = mergeDefaults(parsed);
        localStorage.setItem(VERSION_KEY, String(CATALOG_VERSION));
        return merged;
      }

      return parsed;
    } catch {
      localStorage.setItem(VERSION_KEY, String(CATALOG_VERSION));
      return initSources(DEFAULT_SOURCES);
    }
  });
  const [activeSource, setActiveSource] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }, [sources]);

  // Add a single source by name + URL
  const addSource = useCallback(async (name, url) => {
    // Prevent duplicates
    if (sources.some(s => s.url === url)) return;
    const channels = await parseM3U(url);
    const newSource = { id: Date.now().toString(), name, url, channels };
    setSources(prev => [...prev, newSource]);
    setActiveSource(newSource);
  }, [sources]);

  // Quick-add from catalog (no parse yet — lazy-loads on select)
  const quickAdd = useCallback((name, url) => {
    if (sources.some(s => s.url === url)) return;
    const newSource = { id: `cat-${Date.now()}`, name, url, channels: [] };
    setSources(prev => [...prev, newSource]);
  }, [sources]);

  // Bulk quick-add multiple sources at once
  const bulkAdd = useCallback((entries) => {
    const existingUrls = new Set(sources.map(s => s.url));
    const fresh = entries
      .filter(e => !existingUrls.has(e.url))
      .map((e, i) => ({ id: `bulk-${Date.now()}-${i}`, name: e.name, url: e.url, channels: [] }));
    if (fresh.length) setSources(prev => [...prev, ...fresh]);
  }, [sources]);

  // Remove a single source
  const removeSource = useCallback((id) => {
    setSources(prev => prev.filter(s => s.id !== id));
    setActiveSource(prev => (prev?.id === id ? null : prev));
  }, []);

  // Clear ALL sources
  const clearAll = useCallback(() => {
    setSources([]);
    setActiveSource(null);
  }, []);

  // Reset to defaults only
  const resetDefaults = useCallback(() => {
    setSources(initSources(DEFAULT_SOURCES));
    setActiveSource(null);
  }, []);

  // Select a source (lazy-parse its M3U if not yet loaded)
  const selectSource = useCallback(async (source) => {
    if (!source) { setActiveSource(null); return; }
    if (!source.channels || !source.channels.length) {
      const channels = await parseM3U(source.url);
      const updated = { ...source, channels };
      setSources(prev => prev.map(s => s.id === source.id ? updated : s));
      setActiveSource(updated);
    } else {
      setActiveSource(source);
    }
  }, []);

  // Check if a URL is already loaded
  const hasSource = useCallback((url) => {
    return sources.some(s => s.url === url);
  }, [sources]);

  return {
    sources,
    addSource,
    quickAdd,
    bulkAdd,
    removeSource,
    clearAll,
    resetDefaults,
    activeSource,
    setActiveSource: selectSource,
    hasSource,
  };
}
