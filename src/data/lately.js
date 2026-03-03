// ── EDIT LATELY CONTENT HERE ─────────────────────────────────────────────────
// Drop images into public/assets/lately/ and update paths below.
// Set image: null to show a placeholder until you add one.

export const LATELY_DATA = {
  cassette: {
    // Spotify placeholder — will be wired to API later
    track:  'Track Title',
    artist: 'Artist Name',
    album:  'Album Name',
  },
  tv: {
    title:  'Severance',
    type:   'TV Show',
    status: 'Currently Watching',
    image:  null,  // e.g. '/assets/lately/tv.jpg'
  },
  book: {
    title:  'The Pragmatic Programmer',
    author: 'Andrew Hunt & David Thomas',
    status: 'Currently Reading',
    image:  null,  // e.g. '/assets/lately/book.jpg'
  },
  photos: [
    { src: null, caption: 'coming soon' },
    { src: null, caption: 'coming soon' },
    { src: null, caption: 'coming soon' },
    { src: null, caption: 'coming soon' },
  ],
  game: {
    title:    'Stardew Valley',
    platform: 'PC',
    status:   'Currently Playing',
    image:    null,  // e.g. '/assets/lately/game.jpg'
  },
}
