import { useEffect, useState } from 'react'
import { fetchContentJson, contentImageUrl } from '../lib/contentClient'

const EMPTY_DATA = {
  cassette: {},
  tv: {},
  book: {},
  photos: [],
  game: {},
}

function withImageUrls(raw) {
  return {
    cassette: raw.cassette,
    tv: { ...raw.tv, image: contentImageUrl('lately', raw.tv?.image) },
    book: { ...raw.book, image: contentImageUrl('lately', raw.book?.image) },
    game: { ...raw.game, image: contentImageUrl('lately', raw.game?.image) },
    photos: (raw.photos || []).map(p => ({ ...p, src: contentImageUrl('lately', p.image) })),
  }
}

export function useLatelyData() {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchContentJson('lately.json')
      .then(raw => { if (!cancelled) setData(withImageUrls(raw)) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}
