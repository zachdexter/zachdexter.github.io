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
    title:       'The Rookie',
    type:        'TV Show',
    status:      'Currently Watching',
    image:       './assets/lately/tv.png',  // e.g. '/assets/lately/tv.jpg'
    description: 'Been keeping up with this show for a while, love that episodes are back to coming out weekly.',
  },
  book: {
    title:       'Run',
    author:      'Blake Crouch',
    // progress:    35,   // percentage 0–100
    image:       './assets/lately/book.png',  // e.g. '/assets/lately/book.jpg'
    description: 'Recently finished "Dark Matter" by the same author, really loved it so trying out another one of his titles, so far pretty good!',
  },
  photos: [
    { src: './assets/lately/photo4.JPG',  caption: 'Girlfriend recently came to visit for a week! This picture is from us climbing the Sydney Harbour Bridge, would highly recommend doing this if you\'re ever in Sydney.', date: '03/10/26', location: 'Sydney, Australia' },
    { src: './assets/lately/photo1.jpeg', caption: 'Recent trip with some friends to New Zealand! The landscape everywhere was beautiful, felt like I was living in a Windows homescreen.', date: '02/01/26', location: 'Queenstown, New Zealand' },
    { src: './assets/lately/photo2.jpeg', caption: 'Australia Day in Sydney! Picture is from the harbor just outside of the Opera House, pretty cool light show and fireworks.', date: '01/26/26', location: 'Sydney, Australia' },
    { src: './assets/lately/photo3.JPG',  caption: 'Hello Sydney!', date: '01/02/26', location: 'Sydney, Australia' },
  ],
  game: {
    title:       'Nothing rn :( ',
    platform:    null,
    status:      'Currently Playing',
    image:       null,  // e.g. '/assets/lately/game.jpg'
    description: 'Haven\'t been playing anything recently although I\'ve been looking for a good game to get into.',
  },
}
