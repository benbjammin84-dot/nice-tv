import { useState, useEffect } from 'react';
import { parseM3U } from '../utils/m3uParser';

const STORAGE_KEY = 'nicetv_sources';

const DEFAULT_SOURCES = [
  { id: '1', name: 'IPTV-Org Global', url: 'https://iptv-org.github.io/iptv/index.m3u', channels: [] },
  { id: '2', name: 'Pluto TV', url: 'https://i.mjh.nz/PlutoTV/all.m3u8', channels: [] },
  { id: '3', name: 'Samsung TV Plus', url: 'https://apsattv.com/ssungusa.m3u', channels: [] },
];

export function usePlaylists() {
  const [sources, setSources] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SOURCES;
    } catch { return DEFAULT_SOURCES; }
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
