export async function parseM3U(url) {
  try {
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    const text = await response.text();
    return parseM3UText(text);
  } catch (err) {
    console.error('Failed to fetch M3U:', err);
    return [];
  }
}

export function parseM3UText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const channels = [];
  let current = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF')) {
      current = {};
      // Extract name
      const nameMatch = line.match(/,(.+)$/);
      current.name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      // Extract group
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      current.group = groupMatch ? groupMatch[1] : 'Uncategorized';
      // Extract logo
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      current.logo = logoMatch ? logoMatch[1] : '';
      // Extract tvg-id for EPG
      const idMatch = line.match(/tvg-id="([^"]*)"/i);
      current.tvgId = idMatch ? idMatch[1] : '';
    } else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
      current.url = line;
      if (current.name) channels.push({ ...current });
      current = {};
    }
  }
  return channels;
}
