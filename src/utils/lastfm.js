// Last.fm API utilities — read-only, no OAuth required
const API_BASE = 'https://ws.audioscrobbler.com/2.0/'

export async function getLastfmNowPlaying(apiKey, username) {
  const url = `${API_BASE}?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Last.fm API error: ${res.status}`)

  const data = await res.json()
  const track = data?.recenttracks?.track?.[0]
  if (!track) throw new Error('No recent tracks found')

  const isPlaying = track['@attr']?.nowplaying === 'true'

  return {
    track:    track.name,
    artist:   track.artist['#text'],
    album:    track.album['#text'],
    imageUrl: track.image?.find(i => i.size === 'medium')?.['#text'] || null,
    isPlaying,
    isRecent: !isPlaying,
    trackUrl: track.url || null,
  }
}
