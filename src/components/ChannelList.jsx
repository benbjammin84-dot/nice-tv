import React, { useMemo, useState } from 'react';
import EPGNowNext from './EPGNowNext';

export default function ChannelList({ source, activeCategory, onCategoryChange, onChannelSelect, activeChannel, getNowNext }) {
  const [search, setSearch] = useState('');

  const categories = useMemo(() => {
    if (!source?.channels) return [];
    return ['All', ...new Set(source.channels.map(c => c.group))].filter(Boolean);
  }, [source]);

  const filtered = useMemo(() => {
    if (!source?.channels) return [];
    return source.channels.filter(c => {
      const matchCat = activeCategory === 'All' || c.group === activeCategory;
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [source, activeCategory, search]);

  if (!source) return (
    <div className="p-6 text-nicemuted text-sm text-center mt-8">
      <div className="text-4xl mb-3">📺</div>
      Select a source above to browse channels.
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-niceborder">
        <input
          className="w-full bg-nicecard border border-niceborder rounded px-3 py-1.5 text-sm text-nicetext focus:outline-none focus:border-niceaccent"
          placeholder="Search channels..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-1 p-2 overflow-x-auto border-b border-niceborder flex-shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`text-xs px-2 py-1 rounded whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-niceaccent text-white'
                : 'bg-nicecard text-nicemuted hover:text-nicetext hover:bg-niceborder'
            }`}
          >{cat}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map((ch, i) => {
          const nowNext = getNowNext ? getNowNext(ch.tvgId) : null;
          return (
            <button
              key={i}
              onClick={() => onChannelSelect(ch)}
              className={`channel-card w-full flex items-start gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                activeChannel?.url === ch.url
                  ? 'border-niceaccent bg-nicecard text-nicetext'
                  : 'border-transparent hover:bg-nicecard text-nicemuted hover:text-nicetext'
              }`}
            >
              {ch.logo
                ? <img src={ch.logo} alt="" className="w-7 h-7 rounded object-contain bg-black flex-shrink-0 mt-0.5" onError={e => e.target.style.display='none'} />
                : <div className="w-7 h-7 rounded bg-niceborder flex items-center justify-center text-xs flex-shrink-0 mt-0.5">📺</div>
              }
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">{ch.name}</span>
                <EPGNowNext nowNext={nowNext} />
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-nicemuted text-xs text-center py-6">No channels found.</p>
        )}
      </div>
    </div>
  );
}
