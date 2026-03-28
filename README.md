# 📺 Nice TV

> A dark, elegant, web-based IPTV player. Plug in your M3U/M3U8 playlists, browse categorized channels, view EPG guides, and watch in style.

## Features
- 🎯 Multi-source M3U/M3U8 playlist support
- 📋 Categorized channel browser with logos
- 📅 EPG (Electronic Program Guide) support via XMLTV
- 🎬 HLS video player with preview + fullscreen
- ⚙️ Quality, brightness, and CCT controls
- 🌑 Dark, elegant UI — TV-first design
- 💾 Playlists saved locally in your browser (no account needed)

## Getting Started

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000)

## Usage
1. Click **Add Source** and paste any M3U or M3U8 URL
2. Choose your source from the sidebar
3. Browse channels by category
4. Click a channel to preview — double-click or press fullscreen to go big

## Free M3U Sources to Try
- `https://iptv-org.github.io/iptv/index.m3u` — Global IPTV-Org master list
- `https://i.mjh.nz/PlutoTV/all.m3u8` — Pluto TV
- `https://apsattv.com/ssungusa.m3u` — Samsung TV Plus USA

## Tech Stack
- React 18
- hls.js (HLS stream playback)
- Tailwind CSS (dark theme)
- @iptv/playlist (M3U parser)

## Contributing
Feel free to fork, add features, and open PRs. This is for everyone. 📺

## License
MIT
