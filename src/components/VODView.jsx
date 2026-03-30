import React, { useState } from 'react';
import { IA_COLLECTIONS } from '../hooks/useVOD';

export default function VODView({
  activeCollection, items, loading,
  loadCollection,
  byosSources, addByos, removeByos, activeByos, selectByos, byosItems,
  onPlay,
}) {
  const [byosName, setByosName] = useState('');
  const [byosUrl, setByosUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [showByosForm, setShowByosForm] = useState(false);

  const currentItems = activeByos ? byosItems : items;

  async function handleAddByos(e) {
    e.preventDefault();
    if (!byosName || !byosUrl) return;
    setAdding(true);
    await addByos(byosName, byosUrl);
    setByosName(''); setByosUrl('');
    setShowByosForm(false);
    setAdding(false);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-niceborder bg-nicepanel flex flex-col overflow-y-auto flex-shrink-0">
        <div className="p-3 border-b border-niceborder">
          <p className="text-xs text-nicemuted font-bold tracking-widest uppercase">Internet Archive</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {IA_COLLECTIONS.map(col => (
            <button
              key={col.id}
              onClick={() => loadCollection(col)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeCollection?.id === col.id
                  ? 'bg-niceaccent text-white'
                  : 'text-nicemuted hover:bg-nicecard hover:text-nicetext'
              }`}
            >
              {col.name}
            </button>
          ))}
        </div>

        {/* BYOS Section */}
        <div className="border-t border-niceborder p-3">
          <p className="text-xs text-nicemuted font-bold tracking-widest uppercase mb-2">Custom VOD (BYOS)</p>
          {byosSources.map(s => (
            <div key={s.id} className="flex items-center justify-between mb-1">
              <button
                onClick={() => selectByos(s)}
                className={`text-xs truncate flex-1 text-left px-2 py-1 rounded ${
                  activeByos?.id === s.id ? 'text-niceaccent' : 'text-nicemuted hover:text-nicetext'
                }`}
              >{s.name}</button>
              <button onClick={() => removeByos(s.id)} className="text-nicemuted hover:text-red-400 text-xs ml-1">✕</button>
            </div>
          ))}
          <button
            onClick={() => setShowByosForm(!showByosForm)}
            className="text-xs text-niceaccent hover:underline mt-1"
          >+ Add VOD Source</button>
          {showByosForm && (
            <form onSubmit={handleAddByos} className="mt-2 space-y-1">
              <input
                className="w-full bg-nicecard border border-niceborder rounded px-2 py-1 text-xs text-nicetext focus:outline-none"
                placeholder="Name"
                value={byosName} onChange={e => setByosName(e.target.value)}
              />
              <input
                className="w-full bg-nicecard border border-niceborder rounded px-2 py-1 text-xs text-nicetext focus:outline-none"
                placeholder="M3U URL"
                value={byosUrl} onChange={e => setByosUrl(e.target.value)}
              />
              <button
                type="submit"
                disabled={adding}
                className="w-full bg-niceaccent text-white text-xs py-1 rounded hover:opacity-90"
              >{adding ? 'Loading...' : 'Add'}</button>
            </form>
          )}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {!activeCollection && !activeByos && (
          <div className="flex flex-col items-center justify-center h-full text-nicemuted">
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-sm">Pick a collection from the sidebar to browse.</p>
            <p className="text-xs mt-1">Or add your own VOD M3U source below.</p>
          </div>
        )}

        {(activeCollection || activeByos) && (
          <>
            <h2 className="text-niceaccent font-bold tracking-widest text-sm mb-4">
              {activeByos ? activeByos.name : activeCollection?.name}
            </h2>

            {loading && (
              <div className="text-nicemuted text-sm text-center py-12">Loading...</div>
            )}

            {!loading && currentItems.length === 0 && (
              <div className="text-nicemuted text-sm text-center py-12">No items found.</div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentItems.map((item, i) => (
                <div
                  key={item.id || i}
                  className="bg-nicecard border border-niceborder rounded-lg overflow-hidden cursor-pointer hover:border-niceaccent transition-colors group"
                  onClick={() => onPlay(item)}
                >
                  <div className="aspect-[2/3] bg-nicebg overflow-hidden">
                    {item.thumb
                      ? <img src={item.thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={e => { e.target.style.display='none'; }} />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                    }
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold text-nicetext truncate">{item.title || item.name}</p>
                    <p className="text-xs text-nicemuted truncate">{item.creator || item.group || ''}</p>
                    {item.year && <p className="text-xs text-nicemuted">{item.year}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
