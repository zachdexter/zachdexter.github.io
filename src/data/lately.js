// ── EDIT LATELY CONTENT HERE ─────────────────────────────────────────────────
// Drop images into public/assets/lately/ and update paths below.
// Set image: null to show a placeholder until you add one.

export const LATELY_DATA = {
  cassette: {
    // Spotify placeholder — will be wired to API later
    track:       'Track Title',
    artist:      'Artist Name',
    album:       'Album Name',
    image:       null,  // e.g. '/assets/lately/music.jpg'
    description: '',
  },
  tv: {
    title:       'Severance',
    type:        'TV Show',
    status:      'Currently Watching',
    image:       null,  // e.g. '/assets/lately/tv.jpg'
    description: '',
  },
  book: {
    title:       'The Pragmatic Programmer',
    author:      'Andrew Hunt & David Thomas',
    progress:    35,   // percentage 0–100
    image:       null,  // e.g. '/assets/lately/book.jpg'
    description: '',
  },
  photos: [
    { src: null, caption: 'coming soon' },
    { src: null, caption: 'coming soon' },
    { src: null, caption: 'coming soon' },
    { src: null, caption: 'coming soon' },
  ],
  game: {
    title:       'Stardew Valley',
    platform:    'PC',
    status:      'Currently Playing',
    image:       null,  // e.g. '/assets/lately/game.jpg'
    description: '',
  },
}
