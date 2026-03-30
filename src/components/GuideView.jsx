import React, { useState, useMemo, useRef } from 'react';
import VideoPlayer from './VideoPlayer';

function fmt(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GuideView({ channels, getNowNext, onChannelSelect }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeChannel, setActiveChannel] = useState(null);

  const categories = useMemo(() => {
    const groups = [...new Set((channels || []).map(c => c.group).filter(Boolean))];
    return ['All', ...groups];
  }, [channels]);

  const filtered = useMemo(() => {
    return (channels || []).filter(ch => {
      const matchCat = category === 'All' || ch.group === category;
      const matchSearch = !search || ch.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    }).slice(0, 200);
  }, [channels, search, category]);

  function handleSelect(ch) {
    setActiveChannel(ch);
    // Also bubble up so LIVE tab stays in sync if user switches
    onChannelSelect && onChannelSelect(ch);
  }

  if (!channels || channels.length === 0) return (
    <div className="p-8 text-nicemuted text-center">
      <div className="text-4xl mb-3">📋</div>
      <p className="text-sm">No source loaded.</p>
      <p className="text-xs mt-1">Select a source in the header to see the guide.</p>
    </div>
  );

  const { now, next } = activeChannel && getNowNext ? getNowNext(activeChannel.tvgId) : {};

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Mini player — shown when a channel is selected */}
      {activeChannel && (
        <div className="flex gap-4 p-4 border-b border-niceborder bg-nicepanel flex-shrink-0">
          <div className="w-64 aspect-video bg-black rounded-lg overflow-hidden flex-shrink-0">
            <VideoPlayer channel={activeChannel} compact />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              {activeChannel.logo && (
                <img src={activeChannel.logo} alt="" className="w-8 h-8 rounded object-contain bg-black" onError={e => e.target.style.display='none'} />
              )}
              <span className="font-bold text-nicetext text-base truncate">{activeChannel.name}</span>
              {activeChannel.group && (
                <span className="text-xs text-nicemuted bg-nicebg px-1.5 py-0.5 rounded">{activeChannel.group}</span>
              )}
            </div>
            {now && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-niceaccent text-white px-1.5 py-0.5 rounded">NOW</span>
                <span className="text-sm text-nicetext truncate">{now.title}</span>
                <span className="text-xs text-nicemuted">{fmt(now.start)}–{fmt(now.stop)}</span>
              </div>
            )}
            {next && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-niceborder text-nicemuted px-1.5 py-0.5 rounded">NEXT</span>
                <span className="text-xs text-nicemuted truncate">{next.title}</span>
                <span className="text-xs text-nicemuted">{fmt(next.start)}</span>
              </div>
            )}
            {!now && !next && (
              <span className="text-xs text-nicemuted/50 mt-1">No EPG data</span>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-niceborder bg-nicepanel flex-shrink-0">
        <input
          className="flex-1 bg-nicecard border border-niceborder rounded px-3 py-1.5 text-sm text-nicetext focus:outline-none focus:border-niceaccent"
          placeholder="Search channels..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="bg-nicecard border border-niceborder text-nicetext text-sm rounded px-2 py-1.5 focus:outline-none focus:border-niceaccent max-w-[180px]"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className="text-xs text-nicemuted whitespace-nowrap">
          {filtered.length}{filtered.length === 200 ? '+' : ''} channels
        </span>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filtered.map((ch, i) => {
            const { now, next } = getNowNext ? getNowNext(ch.tvgId) : {};
            const isActive = activeChannel?.url === ch.url;
            return (
              <div
                key={i}
                className={`border rounded-lg p-3 cursor-pointer transition-colors group ${
                  isActive
                    ? 'border-niceaccent bg-nicecard'
                    : 'border-niceborder bg-nicecard hover:border-niceaccent'
                }`}
                onClick={() => handleSelect(ch)}
              >
                <div className="flex items-center gap-3">
                  {ch.logo
                    ? <img src={ch.logo} alt="" className="w-8 h-8 rounded object-contain bg-black flex-shrink-0" onError={e => e.target.style.display='none'} />
                    : <div className="w-8 h-8 rounded bg-niceborder flex items-center justify-center text-sm flex-shrink-0">📺</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-nicetext truncate">{ch.name}</span>
                      {ch.group && (
                        <span className="text-xs text-nicemuted bg-nicebg px-1.5 py-0.5 rounded whitespace-nowrap">{ch.group}</span>
                      )}
                    </div>
                    {now ? (
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-niceaccent/20 text-niceaccent px-1.5 py-0.5 rounded">NOW</span>
                        <span className="text-xs text-nicetext truncate">{now.title}</span>
                        <span className="text-xs text-nicemuted">{fmt(now.start)}–{fmt(now.stop)}</span>
                        {next && (
                          <span className="text-xs text-nicemuted hidden sm:inline">· NEXT: {next.title} @ {fmt(next.start)}</span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-nicemuted/40">No EPG data</div>
                    )}
                  </div>
                  {isActive && (
                    <span className="text-xs text-niceaccent font-bold whitespace-nowrap">▶ Playing</span>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-nicemuted text-sm text-center py-12">No channels match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
