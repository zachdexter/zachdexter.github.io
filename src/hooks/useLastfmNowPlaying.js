// useLastfmNowPlaying — polls Last.fm every 30s, no OAuth needed
import { useState, useEffect, useRef, useCallback } from 'react'
import { getLastfmNowPlaying } from '../utils/lastfm'

const API_KEY  = import.meta.env.VITE_LASTFM_API_KEY
const USERNAME = import.meta.env.VITE_LASTFM_USERNAME || 'sumitpoz'
const POLL_MS  = 30_000
const MAX_FAILURES = 3

export function useLastfmNowPlaying() {
  const [nowPlaying, setNowPlaying] = useState(null)
  const pollRef    = useRef(null)
  const failureRef = useRef(0)

  const fetchNowPlaying = useCallback(async () => {
    if (failureRef.current >= MAX_FAILURES) return

    try {
      const track = await getLastfmNowPlaying(API_KEY, USERNAME)
      failureRef.current = 0
      setNowPlaying(track)
    } catch (err) {
      failureRef.current += 1
      console.error('[Last.fm] Fetch failed:', err)
      // leave state unchanged — will retry unless MAX_FAILURES reached
    }
  }, [])

  useEffect(() => {
    if (!API_KEY) return // no key in env → show nothing

    fetchNowPlaying()
    pollRef.current = setInterval(fetchNowPlaying, POLL_MS)

    return () => clearInterval(pollRef.current)
  }, [fetchNowPlaying])

  return { nowPlaying }
}
