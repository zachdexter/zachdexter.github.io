// useSpotifyNowPlaying — reads Zach's refresh token from env, polls every 30s
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  refreshAccessToken,
  getCurrentlyPlaying,
  getRecentlyPlayed,
  getStoredTokens,
  getStoredRefreshToken,
  isTokenExpired,
} from '../utils/spotify'

const CLIENT_ID     = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REFRESH_TOKEN = import.meta.env.VITE_SPOTIFY_REFRESH_TOKEN
const POLL_MS       = 30_000

export function useSpotifyNowPlaying() {
  const [nowPlaying, setNowPlaying] = useState(null)
  const pollRef  = useRef(null)
  const tokenRef = useRef({ accessToken: null, expiry: 0 })

  const fetchNowPlaying = useCallback(async () => {
    let { accessToken, expiry } = tokenRef.current

    if (!accessToken || isTokenExpired(expiry)) {
      try {
        const refreshToken = getStoredRefreshToken() || REFRESH_TOKEN
      await refreshAccessToken(CLIENT_ID, refreshToken)
        const stored     = getStoredTokens()
        tokenRef.current = stored
        accessToken      = stored.accessToken
      } catch (err) {
        console.error('[Spotify] Token refresh failed:', err)
        return
      }
    }

    try {
      const track = await getCurrentlyPlaying(accessToken)
      if (track) {
        setNowPlaying(track)
      } else {
        try {
          const recent = await getRecentlyPlayed(accessToken)
          setNowPlaying(recent)
        } catch (err) {
          console.error('[Spotify] Recently played fetch failed:', err)
          setNowPlaying(null)
        }
      }
    } catch (err) {
      console.error('[Spotify] Now playing fetch failed:', err)
      // leave state unchanged — will retry on next poll
    }
  }, [])

  useEffect(() => {
    if (!REFRESH_TOKEN) return // no token in env → show nothing

    fetchNowPlaying()
    pollRef.current = setInterval(fetchNowPlaying, POLL_MS)

    return () => clearInterval(pollRef.current)
  }, [fetchNowPlaying])

  return { nowPlaying }
}
