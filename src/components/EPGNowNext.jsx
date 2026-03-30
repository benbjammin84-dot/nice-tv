import React from 'react';

export default function EPGNowNext({ nowNext }) {
  if (!nowNext?.now && !nowNext?.next) return null;

  return (
    <div className="mt-1 text-left">
      {nowNext.now && (
        <div className="text-xs text-niceaccent truncate" title={nowNext.now.title}>
          ▶ {nowNext.now.title}
        </div>
      )}
      {nowNext.next && (
        <div className="text-xs text-nicemuted truncate" title={nowNext.next.title}>
          ↳ {nowNext.next.title}
        </div>
      )}
    </div>
  );
}
