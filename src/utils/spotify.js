// Spotify API utilities — refresh token flow (Zach's account, read-only)

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const API_BASE       = 'https://api.spotify.com/v1'

// ─── localStorage keys ────────────────────────────────────────────────────────
const KEY_ACCESS  = 'spotify_access_token'
const KEY_EXPIRY  = 'spotify_token_expiry'
const KEY_REFRESH = 'spotify_refresh_token'

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(clientId, refreshToken) {
  const body = new URLSearchParams({
    grant_type:    'refresh_token',
    refresh_token: refreshToken,
    client_id:     clientId,
  })

  const res  = await fetch(TOKEN_ENDPOINT, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Token refresh failed')

  storeTokens(data)
  return data
}

// ─── Token storage helpers ────────────────────────────────────────────────────

export function storeTokens({ access_token, expires_in, refresh_token }) {
  localStorage.setItem(KEY_ACCESS, access_token)
  localStorage.setItem(KEY_EXPIRY, Date.now() + expires_in * 1000)
  if (refresh_token) localStorage.setItem(KEY_REFRESH, refresh_token)
}

export function getStoredRefreshToken() {
  return localStorage.getItem(KEY_REFRESH)
}

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(KEY_ACCESS),
    expiry:      Number(localStorage.getItem(KEY_EXPIRY) || 0),
  }
}

export function isTokenExpired(expiry) {
  return Date.now() >= expiry - 60_000 // refresh 60s early
}

// ─── Currently Playing ────────────────────────────────────────────────────────

export async function getRecentlyPlayed(accessToken) {
  const res = await fetch(`${API_BASE}/me/player/recently-played?limit=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) throw new Error(`Spotify recently-played error: ${res.status}`)

  const data = await res.json()
  const item = data?.items?.[0]?.track
  if (!item) throw new Error('No recently played tracks')

  return {
    track:     item.name,
    artist:    item.artists.map(a => a.name).join(', '),
    album:     item.album.name,
    imageUrl:  item.album.images?.[1]?.url ?? item.album.images?.[0]?.url ?? null,
    isPlaying: false,
    isRecent:  true,
    trackUrl:  item.external_urls?.spotify ?? null,
  }
}

export async function getCurrentlyPlaying(accessToken) {
  const res = await fetch(`${API_BASE}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  // 204 = nothing playing
  if (res.status === 204 || res.status === 205) return null
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)

  const data = await res.json()
  if (!data?.item) return null

  return {
    track:     data.item.name,
    artist:    data.item.artists.map(a => a.name).join(', '),
    album:     data.item.album.name,
    imageUrl:  data.item.album.images?.[1]?.url ?? data.item.album.images?.[0]?.url ?? null,
    isPlaying: data.is_playing,
    trackUrl:  data.item.external_urls?.spotify ?? null,
  }
}
