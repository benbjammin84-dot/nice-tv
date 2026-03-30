import React, { useState } from 'react';
import SourceManager from './components/SourceManager';
import ChannelList from './components/ChannelList';
import VideoPlayer from './components/VideoPlayer';
import GuideView from './components/GuideView';
import VODView from './components/VODView';
import EPGNowNext from './components/EPGNowNext';
import { usePlaylists } from './hooks/usePlaylists';
import { useEPG } from './hooks/useEPG';
import { useVOD } from './hooks/useVOD';

const TABS = ['LIVE', 'GUIDE', 'VOD'];

export default function App() {
  const {
    sources, addSource, quickAdd, bulkAdd, removeSource,
    clearAll, resetDefaults, activeSource, setActiveSource, hasSource,
  } = usePlaylists();

  const [activeChannel, setActiveChannel] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [tab, setTab] = useState('LIVE');

  const { getNowNext } = useEPG(activeSource?.channels);

  const vod = useVOD();

  function handleVODPlay(item) {
    // For IA items open detail page; for BYOS items play directly
    if (item.url && item.url.includes('archive.org/details')) {
      window.open(item.url, '_blank');
    } else if (item.url) {
      setActiveChannel({ name: item.title || item.name, url: item.url, logo: item.thumb || '' });
      setTab('LIVE');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-nicebg text-nicetext font-tv overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-niceborder bg-nicepanel">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold tracking-widest glow text-niceglow">📺 NICE TV</h1>
          {/* Tabs */}
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

      {/* LIVE TAB */}
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

      {/* GUIDE TAB */}
      {tab === 'GUIDE' && (
        <div className="flex-1 overflow-hidden">
          <GuideView
            channels={activeSource?.channels || []}
            getNowNext={getNowNext}
            onChannelSelect={ch => { setActiveChannel(ch); setTab('LIVE'); }}
          />
        </div>
      )}

      {/* VOD TAB */}
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
