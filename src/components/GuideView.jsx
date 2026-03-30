import React from 'react';

function fmt(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function GuideView({ channels, getNowNext, onChannelSelect }) {
  const withEPG = channels.filter(ch => ch.tvgId && getNowNext(ch.tvgId).now);

  if (withEPG.length === 0) return (
    <div className="p-8 text-nicemuted text-center">
      <div className="text-4xl mb-3">📋</div>
      <p className="text-sm">No EPG data available for these channels.</p>
      <p className="text-xs mt-1">Channels need a tvg-id in their M3U entry for guide data.</p>
    </div>
  );

  return (
    <div className="overflow-y-auto h-full p-4">
      <h2 className="text-niceaccent font-bold mb-4 tracking-widest text-sm">📋 CHANNEL GUIDE</h2>
      <div className="space-y-2">
        {withEPG.map((ch, i) => {
          const { now, next } = getNowNext(ch.tvgId);
          return (
            <div
              key={i}
              className="bg-nicecard border border-niceborder rounded-lg p-3 cursor-pointer hover:border-niceaccent transition-colors"
              onClick={() => onChannelSelect(ch)}
            >
              <div className="flex items-center gap-3 mb-2">
                {ch.logo
                  ? <img src={ch.logo} alt="" className="w-8 h-8 rounded object-contain bg-black" onError={e => e.target.style.display='none'} />
                  : <div className="w-8 h-8 rounded bg-niceborder flex items-center justify-center text-sm">📺</div>
                }
                <span className="font-semibold text-sm text-nicetext">{ch.name}</span>
              </div>
              {now && (
                <div className="mb-1">
                  <span className="text-xs bg-niceaccent text-white px-1.5 py-0.5 rounded mr-2">NOW</span>
                  <span className="text-xs text-nicetext">{now.title}</span>
                  <span className="text-xs text-nicemuted ml-2">{fmt(now.start)}–{fmt(now.stop)}</span>
                </div>
              )}
              {next && (
                <div>
                  <span className="text-xs bg-niceborder text-nicemuted px-1.5 py-0.5 rounded mr-2">NEXT</span>
                  <span className="text-xs text-nicemuted">{next.title}</span>
                  <span className="text-xs text-nicemuted ml-2">{fmt(next.start)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
