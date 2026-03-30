import React, { useState } from 'react';
import SourceManager from './components/SourceManager';
import ChannelList from './components/ChannelList';
import VideoPlayer from './components/VideoPlayer';
import GuideView from './components/GuideView';
import VODView from './components/VODView';
import { usePlaylists } from './hooks/usePlaylists';
import { useEPG } from './hooks/useEPG';
import { useVOD } from './hooks/useVOD';

const TABS = ['LIVE', 'GUIDE', 'VOD'];
const CF_PROXY = 'https://summer-sound-bd21.benjaminphinisee.workers.dev';

async function resolveIAPlayUrl(identifier) {
  try {
    const metaUrl = `https://archive.org/metadata/${identifier}`;
    const res = await fetch(`${CF_PROXY}/?url=${encodeURIComponent(metaUrl)}`);
    const data = await res.json();
    const files = data.files || [];
    const prefer = ['mp4', 'ogv', 'ogg', 'mp3', 'flac'];
    for (const ext of prefer) {
      const f = files.find(f => f.name && f.name.toLowerCase().endsWith('.' + ext) && f.source !== 'metadata');
      if (f) return `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`;
    }
  } catch (e) {
    console.warn('IA resolve failed', e);
  }
  return null;
}

export default function App() {
  const {
    sources, addSource, quickAdd, bulkAdd, removeSource,
    clearAll, resetDefaults, activeSource, setActiveSource, hasSource,
  } = usePlaylists();

  const [activeChannel, setActiveChannel] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [tab, setTab] = useState('LIVE');
  const [vodLoading, setVodLoading] = useState(false);

  const { getNowNext } = useEPG(activeSource?.channels);

  const vod = useVOD();

  async function handleVODPlay(item) {
    if (item.url && item.url.includes('archive.org/details/')) {
      const identifier = item.url.split('archive.org/details/')[1]?.split('?')[0];
      if (!identifier) return;
      setVodLoading(true);
      const streamUrl = await resolveIAPlayUrl(identifier);
      setVodLoading(false);
      if (streamUrl) {
        setActiveChannel({
          name: item.title || item.name || identifier,
          url: streamUrl,
          logo: item.thumb || '',
        });
        setTab('LIVE');
      } else {
        window.open(item.url, '_blank');
      }
    } else if (item.url) {
      setActiveChannel({ name: item.title || item.name, url: item.url, logo: item.thumb || '' });
      setTab('LIVE');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-nicebg text-nicetext font-tv overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b border-niceborder bg-nicepanel">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold tracking-widest glow text-niceglow">📺 NICE TV</h1>
          <nav className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded font-bold tracking-widest transition-colors ${
                  tab === t
                    ? 'bg-niceaccent text-white'
                    : 'text-nicemuted hover:text-nicetext hover:bg-nicecard'
                }`}
              >{t}</button>
            ))}
          </nav>
        </div>
        <SourceManager
          sources={sources}
          onAdd={addSource}
          onRemove={removeSource}
          onQuickAdd={quickAdd}
          onBulkAdd={bulkAdd}
          onClearAll={clearAll}
          onResetDefaults={resetDefaults}
          activeSource={activeSource}
          onSelect={setActiveSource}
          hasSource={hasSource}
        />
      </header>

      {vodLoading && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="text-niceaccent text-sm font-bold tracking-widest animate-pulse">🎬 Loading stream...</div>
        </div>
      )}

      {tab === 'LIVE' && (
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 border-r border-niceborder bg-nicepanel overflow-y-auto flex-shrink-0">
            <ChannelList
              source={activeSource}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onChannelSelect={setActiveChannel}
              activeChannel={activeChannel}
              getNowNext={getNowNext}
            />
          </aside>
          <main className="flex-1 flex items-center justify-center bg-nicebg p-4">
            <VideoPlayer channel={activeChannel} />
          </main>
        </div>
      )}

      {tab === 'GUIDE' && (
        <div className="flex-1 overflow-hidden">
          <GuideView
            channels={activeSource?.channels || []}
            getNowNext={getNowNext}
            onChannelSelect={ch => { setActiveChannel(ch); setTab('LIVE'); }}
          />
        </div>
      )}

      {tab === 'VOD' && (
        <div className="flex-1 overflow-hidden">
          <VODView
            {...vod}
            onPlay={handleVODPlay}
          />
        </div>
      )}
    </div>
  );
}
