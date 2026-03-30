import { useState, useEffect } from 'react';
import { parseM3U } from '../utils/m3uParser';
import { proxyFetch } from '../utils/proxy';

const VOD_SOURCES_KEY = 'nicetv_vod_sources';

export const IA_COLLECTIONS = [
  { id: 'vhs', name: '📼 VHS Vault', collection: 'vhsmovies', description: 'Rare VHS transfers — cult classics, oddities, forgotten films' },
  { id: 'scifi_horror', name: '👾 Sci-Fi & Horror', collection: 'SciFi_Horror', description: 'Public domain science fiction and horror films' },
  { id: 'classic_tv_80s', name: '📺 Classic TV — 80s', collection: 'classic_tv_1980s', description: 'Television from the 1980s' },
  { id: 'classic_tv_90s', name: '📺 Classic TV — 90s', collection: 'classic_tv_1990s', description: 'Television from the 1990s' },
  { id: 'anime', name: '🎌 Anime', collection: 'anime', description: 'Classic anime series and films' },
  { id: 'anime_misc', name: '🎌 Anime Miscellaneous', collection: 'anime_miscellaneous', description: 'Rare and obscure anime' },
  { id: 'concerts', name: '🎵 Live Music & Concerts', collection: 'etree', description: 'Live concert recordings' },
  { id: 'music_tv', name: '🎤 Music Television', collection: 'musictelevision', description: 'Music videos and TV music programs' },
  {
    id: 'great78', name: '🎤 Great 78 Project', collection: 'georgeblood',
    description: '180,000+ 78rpm shellac disc recordings digitized for preservation.',
    disclaimer: 'For research, teaching, and private study only.',
    learnMore: 'https://great78.archive.org/',
  },
  { id: 'upmaa', name: '🎬 UPMAA Films', collection: 'UPMAA_films', description: 'University of Pennsylvania Museum films' },
  { id: 'audiobooks', name: '📚 Audio Books & Poetry', collection: 'audio_bookspoetry', description: 'Classic literature, poetry readings, spoken word' },
];

async function fetchIACollection(collection, rows = 50) {
  const query = encodeURIComponent(`collection:${collection} AND mediatype:(movies OR audio)`);
  const fields = 'identifier,title,creator,description,year,subject';
  const url = `https://archive.org/advancedsearch.php?q=${query}&fl=${fields}&rows=${rows}&page=1&output=json`;

  const res = await fetch(proxyFetch(url), { signal: AbortSignal.timeout(20000) });
  const data = await res.json();
  return (data.response?.docs || []).map(item => ({
    id: item.identifier,
    title: item.title || item.identifier,
    creator: Array.isArray(item.creator) ? item.creator[0] : (item.creator || 'Unknown'),
    description: item.description || '',
    year: item.year || '',
    tags: Array.isArray(item.subject) ? item.subject.slice(0, 5) : [],
    thumb: `https://archive.org/services/img/${item.identifier}`,
    url: `https://archive.org/details/${item.identifier}`,
    streamBase: `https://archive.org/download/${item.identifier}`,
  }));
}

export function useVOD() {
  const [activeCollection, setActiveCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [byosSources, setByosSources] = useState(() => {
    try { return JSON.parse(localStorage.getItem(VOD_SOURCES_KEY) || '[]'); } catch { return []; }
  });
  const [activeByos, setActiveByos] = useState(null);
  const [byosItems, setByosItems] = useState([]);

  useEffect(() => {
    if (byosSources) localStorage.setItem(VOD_SOURCES_KEY, JSON.stringify(byosSources));
  }, [byosSources]);

  async function loadCollection(col) {
    setActiveCollection(col);
    setActiveByos(null);
    setLoading(true);
    try {
      const results = await fetchIACollection(col.collection);
      setItems(results);
    } catch (e) {
      console.error('IA fetch failed:', e);
      setItems([]);
    }
    setLoading(false);
  }

  async function addByos(name, url) {
    const channels = await parseM3U(url);
    const source = { id: Date.now().toString(), name, url, items: channels };
    setByosSources(prev => [...prev, source]);
    setActiveByos(source);
    setActiveCollection(null);
    setByosItems(channels);
  }

  function removeByos(id) {
    setByosSources(prev => prev.filter(s => s.id !== id));
    if (activeByos?.id === id) { setActiveByos(null); setByosItems([]); }
  }

  function selectByos(source) {
    setActiveByos(source);
    setActiveCollection(null);
    setByosItems(source.items || []);
  }

  return { activeCollection, items, loading, loadCollection, byosSources, addByos, removeByos, activeByos, selectByos, byosItems };
}
