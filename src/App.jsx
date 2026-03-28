import React, { useState } from 'react';
import SourceManager from './components/SourceManager';
import ChannelList from './components/ChannelList';
import VideoPlayer from './components/VideoPlayer';
import { usePlaylists } from './hooks/usePlaylists';

export default function App() {
  const {
    sources, addSource, quickAdd, bulkAdd, removeSource,
    clearAll, resetDefaults, activeSource, setActiveSource, hasSource,
  } = usePlaylists();
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <div className="flex flex-col h-screen bg-nicebg text-nicetext font-tv overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-niceborder bg-nicepanel">
        <h1 className="text-xl font-bold tracking-widest glow text-niceglow">📺 NICE TV</h1>
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

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Channel sidebar */}
        <aside className="w-72 border-r border-niceborder bg-nicepanel overflow-y-auto flex-shrink-0">
          <ChannelList
            source={activeSource}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onChannelSelect={setActiveChannel}
            activeChannel={activeChannel}
          />
        </aside>

        {/* Player area */}
        <main className="flex-1 flex items-center justify-center bg-nicebg p-4">
          <VideoPlayer channel={activeChannel} />
        </main>
      </div>
    </div>
  );
}
