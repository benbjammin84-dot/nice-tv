import React, { useState } from 'react';

export default function SourceManager({ sources, onAdd, onRemove, activeSource, onSelect }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name || !url) return;
    setLoading(true);
    await onAdd(name, url);
    setLoading(false);
    setName(''); setUrl('');
    setShowModal(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Source selector */}
      <select
        className="bg-nicecard border border-niceborder text-nicetext text-sm rounded px-3 py-1.5 focus:outline-none focus:border-niceaccent"
        value={activeSource?.id || ''}
        onChange={e => onSelect(sources.find(s => s.id === e.target.value))}
      >
        <option value="">— Select Source —</option>
        {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <button
        onClick={() => setShowModal(true)}
        className="text-xs px-3 py-1.5 rounded bg-niceaccent hover:bg-niceglow text-white font-medium transition-colors"
      >+ Add M3U</button>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-nicepanel border border-niceborder rounded-xl p-6 w-96 space-y-4">
            <h2 className="text-lg font-semibold text-niceglow">Add M3U Source</h2>
            <input
              className="w-full bg-nicecard border border-niceborder rounded px-3 py-2 text-sm text-nicetext focus:outline-none focus:border-niceaccent"
              placeholder="Source name (e.g. Pluto TV)"
              value={name} onChange={e => setName(e.target.value)}
            />
            <input
              className="w-full bg-nicecard border border-niceborder rounded px-3 py-2 text-sm text-nicetext focus:outline-none focus:border-niceaccent"
              placeholder="M3U URL"
              value={url} onChange={e => setUrl(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="text-sm text-nicemuted hover:text-nicetext">Cancel</button>
              <button onClick={handleAdd} disabled={loading} className="text-sm px-4 py-1.5 rounded bg-niceaccent hover:bg-niceglow text-white disabled:opacity-50">
                {loading ? 'Loading...' : 'Add Source'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
