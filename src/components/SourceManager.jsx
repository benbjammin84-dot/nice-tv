import React, { useState } from 'react';
import { CATALOG } from '../data/sourceCatalog';

export default function SourceManager({
  sources, onAdd, onRemove, onQuickAdd, onBulkAdd, onClearAll, onResetDefaults,
  activeSource, onSelect, hasSource,
}) {
  const [showPanel, setShowPanel] = useState(false);
  const [tab, setTab] = useState('loaded');   // 'loaded' | 'browse' | 'custom'
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState(null);

  const handleCustomAdd = async () => {
    if (!name || !url) return;
    setLoading(true);
    await onAdd(name, url);
    setLoading(false);
    setName(''); setUrl('');
    setTab('loaded');
  };

  const handleAddAll = (regionSources) => {
    onBulkAdd(regionSources);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Source selector dropdown */}
      <select
        className="bg-nicecard border border-niceborder text-nicetext text-sm rounded px-3 py-1.5 focus:outline-none focus:border-niceaccent max-w-[220px]"
        value={activeSource?.id || ''}
        onChange={e => onSelect(sources.find(s => s.id === e.target.value))}
      >
        <option value="">— Select Source —</option>
        {sources.map(s => (
          <option key={s.id} value={s.id}>
            {s.name} {s.channels?.length ? `(${s.channels.length})` : ''}
          </option>
        ))}
      </select>

      {/* Manage button */}
      <button
        onClick={() => setShowPanel(true)}
        className="text-xs px-3 py-1.5 rounded bg-niceaccent hover:bg-niceglow text-white font-medium transition-colors"
      >⚙ Sources</button>

      {/* ─── Full-screen panel ─── */}
      {showPanel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-nicepanel border border-niceborder rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-niceborder">
              <h2 className="text-lg font-semibold text-niceglow">📺 Source Manager</h2>
              <button onClick={() => setShowPanel(false)} className="text-nicemuted hover:text-nicetext text-xl leading-none">&times;</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-niceborder">
              {[
                ['loaded', `My Sources (${sources.length})`],
                ['browse', 'Browse Catalog'],
                ['custom', 'Custom URL'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 text-sm py-2.5 transition-colors ${
                    tab === key
                      ? 'text-niceaccent border-b-2 border-niceaccent font-medium'
                      : 'text-nicemuted hover:text-nicetext'
                  }`}
                >{label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* ── My Sources ── */}
              {tab === 'loaded' && (
                <div className="space-y-2">
                  {sources.length === 0 && (
                    <p className="text-nicemuted text-sm text-center py-8">No sources loaded. Browse the catalog or add a custom URL.</p>
                  )}
                  {sources.map(s => (
                    <div key={s.id} className="flex items-center gap-3 bg-nicecard rounded-lg px-4 py-2.5 border border-niceborder group">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-nicetext truncate">{s.name}</div>
                        <div className="text-xs text-nicemuted truncate">{s.url}</div>
                      </div>
                      {s.channels?.length > 0 && (
                        <span className="text-xs text-nicemuted bg-nicebg px-2 py-0.5 rounded">{s.channels.length} ch</span>
                      )}
                      <button
                        onClick={() => onRemove(s.id)}
                        className="text-nicemuted hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove source"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Browse Catalog ── */}
              {tab === 'browse' && (
                <div className="space-y-2">
                  {CATALOG.map((group, gi) => (
                    <div key={gi} className="border border-niceborder rounded-lg overflow-hidden">
                      {/* Region header */}
                      <button
                        onClick={() => setExpandedRegion(expandedRegion === gi ? null : gi)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-nicecard hover:bg-niceborder transition-colors"
                      >
                        <span className="text-sm font-medium text-nicetext">{group.region}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-nicemuted">{group.sources.length} sources</span>
                          <span className="text-nicemuted text-xs">{expandedRegion === gi ? '▾' : '▸'}</span>
                        </div>
                      </button>

                      {/* Expanded source list */}
                      {expandedRegion === gi && (
                        <div className="border-t border-niceborder">
                          {/* Add All button */}
                          <div className="px-4 py-2 bg-nicebg border-b border-niceborder">
                            <button
                              onClick={() => handleAddAll(group.sources)}
                              className="text-xs px-3 py-1 rounded bg-niceaccent/20 text-niceaccent hover:bg-niceaccent/30 transition-colors"
                            >+ Add all {group.sources.length} sources</button>
                          </div>

                          {group.sources.map((src, si) => {
                            const added = hasSource(src.url);
                            return (
                              <div key={si} className="flex items-center gap-3 px-4 py-2 hover:bg-nicecard transition-colors">
                                <span className="text-sm text-nicetext flex-1 truncate">{src.name}</span>
                                {added ? (
                                  <span className="text-xs text-green-400/70 px-2 py-0.5">✓ Added</span>
                                ) : (
                                  <button
                                    onClick={() => onQuickAdd(src.name, src.url)}
                                    className="text-xs px-2.5 py-0.5 rounded bg-niceaccent/20 text-niceaccent hover:bg-niceaccent hover:text-white transition-colors"
                                  >+ Add</button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Custom URL ── */}
              {tab === 'custom' && (
                <div className="space-y-4 max-w-md mx-auto pt-4">
                  <p className="text-xs text-nicemuted">Paste any M3U / M3U8 playlist URL.</p>
                  <input
                    className="w-full bg-nicecard border border-niceborder rounded px-3 py-2 text-sm text-nicetext focus:outline-none focus:border-niceaccent"
                    placeholder="Source name (e.g. My IPTV)"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                  <input
                    className="w-full bg-nicecard border border-niceborder rounded px-3 py-2 text-sm text-nicetext focus:outline-none focus:border-niceaccent"
                    placeholder="https://example.com/playlist.m3u"
                    value={url} onChange={e => setUrl(e.target.value)}
                  />
                  <button
                    onClick={handleCustomAdd}
                    disabled={loading || !name || !url}
                    className="w-full text-sm py-2 rounded bg-niceaccent hover:bg-niceglow text-white disabled:opacity-40 transition-colors"
                  >{loading ? 'Loading...' : 'Add Source'}</button>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-niceborder bg-nicebg/50">
              <div className="flex gap-2">
                <button
                  onClick={onClearAll}
                  className="text-xs px-3 py-1.5 rounded border border-red-400/30 text-red-400/70 hover:bg-red-400/10 hover:text-red-400 transition-colors"
                >Clear All</button>
                <button
                  onClick={onResetDefaults}
                  className="text-xs px-3 py-1.5 rounded border border-niceborder text-nicemuted hover:text-nicetext hover:bg-nicecard transition-colors"
                >Reset Defaults</button>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="text-xs px-4 py-1.5 rounded bg-niceaccent hover:bg-niceglow text-white transition-colors"
              >Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
