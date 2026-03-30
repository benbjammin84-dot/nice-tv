import React from 'react';

function fmt(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ProgressBar({ start, stop }) {
  if (!start || !stop) return null;
  const pct = Math.min(100, Math.max(0, ((Date.now() - start) / (stop - start)) * 100));
  return (
    <div className="w-full h-0.5 bg-niceborder rounded-full mt-1.5">
      <div className="h-full bg-niceaccent rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function EPGDock({ channel, nowNext }) {
  if (!channel) return null;
  const { now, next } = nowNext || {};

  return (
    <div className="bg-nicepanel border border-niceborder rounded-xl px-4 py-3 flex items-start gap-4">
      {/* Channel identity */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {channel.logo
          ? <img src={channel.logo} alt="" className="w-8 h-8 rounded object-contain bg-black" onError={e => e.target.style.display='none'} />
          : <div className="w-8 h-8 rounded bg-niceborder flex items-center justify-center text-sm">📺</div>
        }
        <span className="text-xs font-bold text-nicemuted tracking-wide truncate max-w-[100px]">{channel.name}</span>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-niceborder flex-shrink-0" />

      {/* EPG info */}
      <div className="flex-1 min-w-0">
        {now ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-niceaccent text-white px-1.5 py-0.5 rounded font-bold">NOW</span>
              <span className="text-sm text-nicetext font-medium truncate">{now.title}</span>
              <span className="text-xs text-nicemuted ml-auto whitespace-nowrap">{fmt(now.start)}–{fmt(now.stop)}</span>
            </div>
            <ProgressBar start={now.start} stop={now.stop} />
            {next && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-nicemuted px-1.5 py-0.5 rounded border border-niceborder">NEXT</span>
                <span className="text-xs text-nicemuted truncate">{next.title}</span>
                <span className="text-xs text-nicemuted/60 ml-auto whitespace-nowrap">{fmt(next.start)}</span>
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-nicemuted/50">
            {channel.tvgId ? 'Fetching guide data...' : 'No EPG available for this channel'}
          </span>
        )}
      </div>
    </div>
  );
}
