import { useState, useEffect } from 'react';
import { parseM3U } from '../utils/m3uParser';

const STORAGE_KEY = 'nicetv_sources';

const DEFAULT_SOURCES = [
  { id: '1', name: 'Pluto TV', url: 'https://i.mjh.nz/PlutoTV/all.m3u8', channels: [] },
  { id: '2', name: 'Free-TV (Global)', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', channels: [] },
  { id: '3', name: 'Samsung TV Plus', url: 'https://apsattv.com/ssungusa.m3u', channels: [] },
  { id: '4', name: 'XUMO', url: 'https://www.apsattv.com/xumo.m3u', channels: [] },
  { id: '5', name: 'IPTV-Org Global', url: 'https://iptv-org.github.io/iptv/index.m3u', channels: [] },
];

export function usePlaylists() {
  const [sources, setSources] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SOURCES;
    } catch { return DEFAULT_SOURCES; }
  });
  const [activeSource, setActiveSourceState] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }, [sources]);

  const addSource = async (name, url) => {
    const channels = await parseM3U(url);
    const newSource = { id: Date.now().toString(), name, url, channels };
    setSources(prev => [...prev, newSource]);
    setActiveSourceState(newSource);
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

  const setActiveSource = async (source) => {
    if (!source) { setActiveSourceState(null); return; }
    if (!source.channels || source.channels.length === 0) {
      const channels = await parseM3U(source.url);
      const updated = { ...source, channels };
      setSources(prev => prev.map(s => s.id === source.id ? updated : s));
      setActiveSourceState(updated);
    } else {
      setActiveSourceState(source);
    }
  };

  return {
    sources, addSource, quickAdd, bulkAdd,
    removeSource, clearAll, resetDefaults,
    activeSource, setActiveSource,
    hasSource,
  };
}
