/**
 * Source Catalog for Nice TV
 *
 * `defaults` — pre-loaded for every new user.
 * `catalog`  — browsable extras grouped by region. Users quick-add what they want.
 *
 * Sources come from two open-source community repos:
 *   • iptv-org/iptv  — https://github.com/iptv-org/iptv
 *   • Free-TV/IPTV   — https://github.com/Free-TV/IPTV
 *
 * Bump CATALOG_VERSION whenever you change defaults or catalog entries.
 * Returning users will automatically receive new sources on their next visit.
 */

export const CATALOG_VERSION = 3;

// ── Pre-loaded defaults (best mix of reliability + variety) ──────────────
export const DEFAULT_SOURCES = [
  { id: 'default-iptv-org',   name: 'IPTV-Org Global',  url: 'https://iptv-org.github.io/iptv/index.m3u' },
  { id: 'default-freetv',     name: 'Free-TV Global',   url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8' },
  { id: 'default-xumo',       name: 'XUMO',             url: 'https://www.apsattv.com/xumo.m3u' },
];

// ── Browsable catalog (grouped by region) ────────────────────────────────
export const CATALOG = [
  {
    region: '🇺🇸 United States',
    sources: [
      { name: 'US — All Channels',     url: 'https://iptv-org.github.io/iptv/countries/us.m3u' },
      { name: 'US — Pluto TV',         url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pluto.m3u' },
      { name: 'US — Samsung TV Plus',  url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_samsung.m3u' },
      { name: 'US — Roku',             url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_roku.m3u' },
      { name: 'US — Plex',             url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_plex.m3u' },
      { name: 'US — Tubi',             url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_tubi.m3u' },
      { name: 'US — PBS',              url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_pbs.m3u' },
      { name: 'US — Local Stations',   url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_local.m3u' },
      { name: 'US — Stirr',            url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us_stirr.m3u' },
      { name: 'US — Free-TV',          url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_usa.m3u8' },
    ],
  },
  {
    region: '🇨🇦 Canada',
    sources: [
      { name: 'Canada — All',          url: 'https://iptv-org.github.io/iptv/countries/ca.m3u' },
      { name: 'Canada — Pluto TV',     url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ca_pluto.m3u' },
      { name: 'Canada — Samsung',      url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ca_samsung.m3u' },
      { name: 'Canada — Free-TV',      url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_canada.m3u8' },
    ],
  },
  {
    region: '🇬🇧 United Kingdom',
    sources: [
      { name: 'UK — All',              url: 'https://iptv-org.github.io/iptv/countries/uk.m3u' },
      { name: 'UK — BBC',              url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk_bbc.m3u' },
      { name: 'UK — Pluto TV',         url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk_pluto.m3u' },
      { name: 'UK — Samsung',          url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/uk_samsung.m3u' },
      { name: 'UK — Free-TV',          url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_uk.m3u8' },
    ],
  },
  {
    region: '🇪🇺 Europe',
    sources: [
      { name: 'Germany — All',         url: 'https://iptv-org.github.io/iptv/countries/de.m3u' },
      { name: 'France — All',          url: 'https://iptv-org.github.io/iptv/countries/fr.m3u' },
      { name: 'Spain — All',           url: 'https://iptv-org.github.io/iptv/countries/es.m3u' },
      { name: 'Italy — All',           url: 'https://iptv-org.github.io/iptv/countries/it.m3u' },
      { name: 'Netherlands — All',     url: 'https://iptv-org.github.io/iptv/countries/nl.m3u' },
      { name: 'Sweden — All',          url: 'https://iptv-org.github.io/iptv/countries/se.m3u' },
      { name: 'Poland — All',          url: 'https://iptv-org.github.io/iptv/countries/pl.m3u' },
      { name: 'Portugal — All',        url: 'https://iptv-org.github.io/iptv/countries/pt.m3u' },
      { name: 'Romania — All',         url: 'https://iptv-org.github.io/iptv/countries/ro.m3u' },
      { name: 'Greece — All',          url: 'https://iptv-org.github.io/iptv/countries/gr.m3u' },
    ],
  },
  {
    region: '🌎 Latin America',
    sources: [
      { name: 'Brazil — All',          url: 'https://iptv-org.github.io/iptv/countries/br.m3u' },
      { name: 'Mexico — All',          url: 'https://iptv-org.github.io/iptv/countries/mx.m3u' },
      { name: 'Argentina — All',       url: 'https://iptv-org.github.io/iptv/countries/ar.m3u' },
      { name: 'Chile — All',           url: 'https://iptv-org.github.io/iptv/countries/cl.m3u' },
      { name: 'Colombia — All',        url: 'https://iptv-org.github.io/iptv/countries/co.m3u' },
      { name: 'Peru — All',            url: 'https://iptv-org.github.io/iptv/countries/pe.m3u' },
    ],
  },
  {
    region: '🌏 Asia & Pacific',
    sources: [
      { name: 'India — All',           url: 'https://iptv-org.github.io/iptv/countries/in.m3u' },
      { name: 'Japan — All',           url: 'https://iptv-org.github.io/iptv/countries/jp.m3u' },
      { name: 'South Korea — All',     url: 'https://iptv-org.github.io/iptv/countries/kr.m3u' },
      { name: 'China — All',           url: 'https://iptv-org.github.io/iptv/countries/cn.m3u' },
      { name: 'Australia — All',       url: 'https://iptv-org.github.io/iptv/countries/au.m3u' },
      { name: 'Indonesia — All',       url: 'https://iptv-org.github.io/iptv/countries/id.m3u' },
      { name: 'Philippines — All',     url: 'https://iptv-org.github.io/iptv/countries/ph.m3u' },
      { name: 'Thailand — All',        url: 'https://iptv-org.github.io/iptv/countries/th.m3u' },
    ],
  },
  {
    region: '🌍 Middle East & Africa',
    sources: [
      { name: 'Turkey — All',          url: 'https://iptv-org.github.io/iptv/countries/tr.m3u' },
      { name: 'Saudi Arabia — All',    url: 'https://iptv-org.github.io/iptv/countries/sa.m3u' },
      { name: 'UAE — All',             url: 'https://iptv-org.github.io/iptv/countries/ae.m3u' },
      { name: 'Egypt — All',           url: 'https://iptv-org.github.io/iptv/countries/eg.m3u' },
      { name: 'South Africa — All',    url: 'https://iptv-org.github.io/iptv/countries/za.m3u' },
      { name: 'Nigeria — All',         url: 'https://iptv-org.github.io/iptv/countries/ng.m3u' },
    ],
  },
  {
    region: '🎬 Special Collections',
    sources: [
      { name: 'News — English',        url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_zz_news_en.m3u8' },
      { name: 'News — Spanish',        url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_zz_news_es.m3u8' },
      { name: 'News — Arabic',         url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_zz_news_ar.m3u8' },
      { name: 'Documentaries — EN',    url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_zz_documentaries_en.m3u8' },
      { name: 'Movies',                url: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_zz_movies.m3u8' },
    ],
  },
];
