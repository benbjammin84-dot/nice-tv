import { useState, useEffect } from 'react';
import { parseM3U } from '../utils/m3uParser';

const VOD_SOURCES_KEY = 'nicetv_vod_sources';
const CF_PROXY = 'https://summer-sound-bd21.benjaminphinisee.workers.dev';

export const IA_COLLECTIONS = [
  {
    id: 'vhs',
    name: '📼 VHS Vault',
    collection: 'vhsmovies',
    description: 'Rare VHS transfers — cult classics, oddities, forgotten films',
  },
  {
    id: 'scifi_horror',
    name: '👾 Sci-Fi & Horror',
    collection: 'SciFi_Horror',
    description: 'Public domain science fiction and horror films',
  },
  {
    id: 'classic_tv_80s',
    name: '📺 Classic TV — 80s',
    collection: 'classic_tv_1980s',
    description: 'Television from the 1980s',
  },
  {
    id: 'classic_tv_90s',
    name: '📺 Classic TV — 90s',
    collection: 'classic_tv_1990s',
    description: 'Television from the 1990s',
  },
  {
    id: 'anime',
    name: '🎌 Anime',
    collection: 'anime',
    description: 'Classic anime series and films',
  },
  {
    id: 'anime_misc',
    name: '🎌 Anime Miscellaneous',
    collection: 'anime_miscellaneous',
    description: 'Rare and obscure anime',
  },
  {
    id: 'concerts',
    name: '🎵 Live Music & Concerts',
    collection: 'etree',
    description: 'Live concert recordings — thousands of shows',
  },
  {
    id: 'music_tv',
    name: '🎤 Music Television',
    collection: 'musictelevision',
    description: 'Music videos and TV music programs',
  },
  {
    id: 'great78',
    name: '🎙️ Great 78 Project',
    collection: 'georgeblood',
    description: '180,000+ 78rpm shellac disc recordings digitized for preservation — rare, underrepresented artists across jazz, blues, classical, world music, and more. Digitized by George Blood L.P. via the Internet Archive Great 78 Project.',
    disclaimer: 'For research, teaching, and private study only. Copyright status of individual items may vary. See archive.org terms of use.',
    learnMore: 'https://great78.archive.org/',
  },
  {
    id: 'george_blood',
    name: '🎞️ George Blood — Archival Transfers',
    collection: 'georgeblood',
    description: 'Film and audio archival transfers by George Blood L.P. — the studio behind the Great 78 Project digitization work.',
    learnMore: 'http://www.georgeblood.com/',
  },
  {
    id: 'upmaa',
    name: '🎬 UPMAA Films',
    collection: 'UPMAA_films',
    description: 'University of Pennsylvania Museum of Archaeology and Anthropology films',
  },
  {
    id: 'audiobooks',
    name: '📚 Audio Books & Poetry',
    collection: 'audio_bookspoetry',
    description: 'Classic literature, poetry readings, and spoken word',
  },
];

async function fetchIACollection(collection, page = 1, rows = 50) {
  const query = encodeURIComponent(`collection:${collection} AND mediatype:(movies OR audio)`);
  const fields = 'identifier,title,creator,description,year,subject';
  const url = `https://archive.org/advancedsearch.php?q=${query}&fl=${fields}&rows=${rows}&page=${page}&output=json`;
  const proxyUrl = `${CF_PROXY}/?url=${encodeURIComponent(url)}`;

  const res = await fetch(proxyUrl);
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

  return {
    activeCollection, items, loading,
    loadCollection,
    byosSources, addByos, removeByos, activeByos, selectByos, byosItems,
  };
}
