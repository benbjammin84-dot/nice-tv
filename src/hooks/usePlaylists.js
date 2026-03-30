import { useState, useEffect } from 'react';
import { parseM3U } from '../utils/m3uParser';

const STORAGE_KEY = 'nicetv_sources';

const DEFAULT_SOURCES = [
  { id: '1', name: 'Pluto TV', url: 'https://i.mjh.nz/PlutoTV/all.m3u8' },
  { id: '2', name: 'Free-TV (Global)', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8' },
  { id: '3', name: 'Samsung TV Plus', url: 'https://apsattv.com/ssungusa.m3u' },
  { id: '4', name: 'XUMO', url: 'https://www.apsattv.com/xumo.m3u' },
  { id: '5', name: 'IPTV-Org Global', url: 'https://iptv-org.github.io/iptv/index.m3u' },
];

// Strip channels before saving — they can be huge (30k+ entries)
function toStorable(sources) {
  return sources.map(({ channels, ...rest }) => rest);
}

export function usePlaylists() {
  // sources in state may carry a loaded channels array in memory,
  // but we never write channels to localStorage
  const [sources, setSources] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SOURCES;
    } catch { return DEFAULT_SOURCES; }
  });
  const [activeSource, setActiveSourceState] = useState(null);
  const [loadingSource, setLoadingSource] = useState(false);

  // Persist only metadata (no channels)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStorable(sources)));
    } catch (e) {
      console.warn('Could not save sources to localStorage:', e);
    }
  }, [sources]);

  const addSource = async (name, url) => {
    const newSource = { id: Date.now().toString(), name, url };
    setSources(prev => [...prev, newSource]);
    // Load channels into memory for immediate use but don't block
    const channels = await parseM3U(url);
    const withChannels = { ...newSource, channels };
    setSources(prev => prev.map(s => s.id === newSource.id ? { ...s } : s));
    setActiveSourceState(withChannels);
  };

  const quickAdd = (name, url) => addSource(name, url);

  const bulkAdd = (items) => {
    items.forEach(item => addSource(item.name, item.url));
  };

  const removeSource = (id) => {
    setSources(prev => prev.filter(s => s.id !== id));
    setActiveSourceState(prev => prev?.id === id ? null : prev);
  };

  const clearAll = () => {
    setSources([]);
    setActiveSourceState(null);
  };

  const resetDefaults = () => {
    setSources(DEFAULT_SOURCES);
    setActiveSourceState(null);
  };

  const hasSource = (url) => sources.some(s => s.url === url);

  // Selecting a source: load channels into memory only (not localStorage)
  const setActiveSource = async (source) => {
    if (!source) { setActiveSourceState(null); return; }
    // Already loaded in memory this session
    if (source.channels && source.channels.length > 0) {
      setActiveSourceState(source);
      return;
    }
    setLoadingSource(true);
    try {
      const channels = await parseM3U(source.url);
      const updated = { ...source, channels };
      // Update in-memory state only (not persisted)
      setSources(prev => prev.map(s => s.id === source.id ? updated : s));
      setActiveSourceState(updated);
    } catch (e) {
      console.warn('Failed to load source:', e);
      setActiveSourceState({ ...source, channels: [] });
    }
    setLoadingSource(false);
  };

  return {
    sources, addSource, quickAdd, bulkAdd,
    removeSource, clearAll, resetDefaults,
    activeSource, setActiveSource,
    hasSource, loadingSource,
  };
}
