import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ channel }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [cct, setCct] = useState(0);
  const [quality, setQuality] = useState(-1);
  const [levels, setLevels] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!channel?.url || !videoRef.current) return;
    const video = videoRef.current;

    if (hlsRef.current) { hlsRef.current.destroy(); }

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels);
        video.play().catch(() => {});
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.url;
      video.play().catch(() => {});
    }

    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [channel]);

  useEffect(() => {
    if (hlsRef.current) hlsRef.current.currentLevel = quality;
  }, [quality]);

  const videoStyle = {
    filter: `brightness(${brightness}%) sepia(${cct}%) saturate(${cct > 0 ? 80 + cct * 0.2 : 100}%)`,
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!channel) return (
    <div className="flex flex-col items-center justify-center text-nicemuted space-y-3">
      <div className="text-8xl opacity-20">📺</div>
      <p className="text-sm">Select a channel to start watching</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl">
      {/* Video container */}
      <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl border border-niceborder">
        <video ref={videoRef} style={videoStyle} className="w-full h-full object-contain" />

        {/* Overlay controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium text-white">{channel.name}</span>
          <button onClick={toggleFullscreen} className="text-white hover:text-niceglow text-sm">
            {isFullscreen ? '⊡ Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="bg-nicepanel border border-niceborder rounded-xl p-4 grid grid-cols-3 gap-4">
        {/* Brightness */}
        <div className="space-y-1">
          <label className="text-xs text-nicemuted">☀️ Brightness — {brightness}%</label>
          <input type="range" min="20" max="150" value={brightness}
            onChange={e => setBrightness(Number(e.target.value))}
            className="w-full accent-niceaccent"
          />
        </div>

        {/* CCT / Warmth */}
        <div className="space-y-1">
          <label className="text-xs text-nicemuted">🌡️ Warmth (CCT) — {cct}%</label>
          <input type="range" min="0" max="60" value={cct}
            onChange={e => setCct(Number(e.target.value))}
            className="w-full accent-niceaccent"
          />
        </div>

        {/* Quality */}
        <div className="space-y-1">
          <label className="text-xs text-nicemuted">🎚️ Quality</label>
          <select
            className="w-full bg-nicecard border border-niceborder text-nicetext text-sm rounded px-2 py-1 focus:outline-none focus:border-niceaccent"
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
          >
            <option value={-1}>Auto</option>
            {levels.map((l, i) => (
              <option key={i} value={i}>{l.height ? `${l.height}p` : `Level ${i}`}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
