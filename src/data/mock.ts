import type { BlogPost, MediaItem, Season } from '../lib/types';

const image = (id: string, width = 1200, height = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const movies: MediaItem[] = [
  {
    id: 1, slug: 'the-last-moon', title: 'The Last Moon', kind: 'movie', year: '2024', rating: 8.7,
    runtime: '2h 08m', genres: ['Drama', 'Romance'], description: 'Two strangers meet beneath a city that never sleeps and discover one last reason to stay hopeful.',
    poster: image('photo-1489599849927-2ee91cede3ba', 700, 1000), backdrop: image('photo-1489599849927-2ee91cede3ba'), featured: true, badge: 'Featured',
  },
  {
    id: 2, slug: 'midnight-in-yangon', title: 'Midnight in Yangon', kind: 'movie', year: '2024', rating: 8.2,
    runtime: '1h 52m', genres: ['Thriller', 'Mystery'], description: 'A radio host follows a trail of anonymous calls across the city before dawn.',
    poster: image('photo-1519608487953-e999c86e7455', 700, 1000), backdrop: image('photo-1519608487953-e999c86e7455'), badge: 'New',
  },
  {
    id: 3, slug: 'river-of-dreams', title: 'River of Dreams', kind: 'movie', year: '2023', rating: 8.1,
    runtime: '2h 15m', genres: ['Adventure', 'Drama'], description: 'A young cartographer returns home to redraw the map of a changing river valley.',
    poster: image('photo-1470770841072-f978cf4d019e', 700, 1000), backdrop: image('photo-1470770841072-f978cf4d019e'),
  },
  {
    id: 4, slug: 'monsoon-notes', title: 'Monsoon Notes', kind: 'movie', year: '2023', rating: 7.8,
    runtime: '1h 44m', genres: ['Music', 'Romance'], description: 'A forgotten cassette tape brings an old band back together for one impossible show.',
    poster: image('photo-1493225457124-a3eb161ffa5f', 700, 1000), backdrop: image('photo-1493225457124-a3eb161ffa5f'),
  },
  {
    id: 5, slug: 'glass-house', title: 'Glass House', kind: 'movie', year: '2022', rating: 7.6,
    runtime: '1h 39m', genres: ['Crime', 'Drama'], description: 'A family business begins to crack when its quietest member starts asking questions.',
    poster: image('photo-1518709268805-4e9042af9f23', 700, 1000), backdrop: image('photo-1518709268805-4e9042af9f23'),
  },
  {
    id: 6, slug: 'golden-hour', title: 'Golden Hour', kind: 'movie', year: '2021', rating: 7.4,
    runtime: '1h 47m', genres: ['Family', 'Drama'], description: 'A photographer learns to see her hometown differently through the eyes of her younger brother.',
    poster: image('photo-1531058020387-3be344556be6', 700, 1000), backdrop: image('photo-1531058020387-3be344556be6'),
  },
];

export const series: MediaItem[] = [
  {
    id: 101, slug: 'after-the-rain', title: 'After the Rain', kind: 'series', year: '2024', rating: 9.1,
    seasons: 2, episodes: 16, genres: ['Drama', 'Mystery'], description: 'When the rain stops, a quiet neighborhood begins to reveal the secrets it kept underwater.',
    poster: image('photo-1511497584788-876760111969', 700, 1000), backdrop: image('photo-1511497584788-876760111969'), featured: true, badge: 'Top 10',
  },
  {
    id: 102, slug: 'neon-district', title: 'Neon District', kind: 'series', year: '2023', rating: 8.8,
    seasons: 1, episodes: 8, genres: ['Crime', 'Thriller'], description: 'Three friends build an underground newsroom in the brightest corner of the city.',
    poster: image('photo-1519608487953-e999c86e7455', 700, 1000), backdrop: image('photo-1519608487953-e999c86e7455'), badge: 'New season',
  },
  {
    id: 103, slug: 'paper-planes', title: 'Paper Planes', kind: 'series', year: '2022', rating: 8.4,
    seasons: 3, episodes: 24, genres: ['Comedy', 'Romance'], description: 'A group of office friends turn everyday problems into stories worth remembering.',
    poster: image('photo-1517248135467-4c7edcad34c4', 700, 1000), backdrop: image('photo-1517248135467-4c7edcad34c4'),
  },
  {
    id: 104, slug: 'the-quiet-room', title: 'The Quiet Room', kind: 'series', year: '2021', rating: 8.0,
    seasons: 1, episodes: 10, genres: ['Psychological', 'Drama'], description: 'Every patient has a story, but the therapist may be hiding the most important one.',
    poster: image('photo-1500530855697-b586d89ba3ee', 700, 1000), backdrop: image('photo-1500530855697-b586d89ba3ee'),
  },
];

export const blogs: BlogPost[] = [
  {
    id: 201, slug: 'five-films-to-watch-this-weekend', title: 'Five films to watch this weekend', excerpt: 'A handpicked watchlist for late nights, slow mornings, and everything in between.', date: 'Aug 08, 2024', category: 'Recommendations', author: 'Yangon TV Editorial', readTime: '4 min read',
    image: image('photo-1485846234645-a62644f84728'), featured: true,
    content: 'The best watchlists are not built around a single mood. This week, we are moving from intimate dramas to city-sized mysteries, with five stories that all leave a little room for wonder.\n\nStart with The Last Moon if you want something tender and cinematic. Midnight in Yangon is the late-night pick: tense, atmospheric, and full of small details that reward a second viewing.\n\nWhatever you choose, make the night yours — turn down the lights, put your phone away, and give the story a little space.',
  },
  {
    id: 202, slug: 'inside-the-art-of-a-good-recap', title: 'Inside the art of a good recap', excerpt: 'Why the best recaps do more than tell you what happened — they help you see the story again.', date: 'Aug 02, 2024', category: 'Culture', author: 'Mya Thiri', readTime: '6 min read', image: image('photo-1516321318423-f06f85e504b3'),
    content: 'A thoughtful recap is a conversation starter. It catches the emotional beats, leaves room for interpretation, and helps a story travel further than its final frame.',
  },
  {
    id: 203, slug: 'the-new-language-of-series', title: 'The new language of series', excerpt: 'From cliffhangers to quiet finales, episodic storytelling is changing how we gather around stories.', date: 'Jul 26, 2024', category: 'Essays', author: 'Yangon TV Editorial', readTime: '5 min read', image: image('photo-1542206395-9feb3edaa68d'),
    content: 'Series have become a shared rhythm. We watch in chapters, talk between episodes, and carry characters with us through the week. That space between moments is part of the story too.',
  },
];

export const seasons: Season[] = [
  {
    id: 1, number: 1, title: 'Season one', episodes: [
      { id: 1, number: 1, title: 'The water remembers', duration: '48m', thumbnail: image('photo-1500530855697-b586d89ba3ee', 520, 300) },
      { id: 2, number: 2, title: 'A house of open doors', duration: '52m', thumbnail: image('photo-1511497584788-876760111969', 520, 300) },
      { id: 3, number: 3, title: 'Signals in the dark', duration: '45m', thumbnail: image('photo-1519608487953-e999c86e7455', 520, 300) },
      { id: 4, number: 4, title: 'The shape of silence', duration: '54m', thumbnail: image('photo-1470770841072-f978cf4d019e', 520, 300) },
    ],
  },
  {
    id: 2, number: 2, title: 'Season two', episodes: [
      { id: 5, number: 1, title: 'The road home', duration: '51m', thumbnail: image('photo-1500534623283-312aade485b7', 520, 300), available: false },
      { id: 6, number: 2, title: 'A city in the clouds', duration: '50m', thumbnail: image('photo-1500534314209-a25ddb2bd429', 520, 300), available: false },
    ],
  },
];

export const genres = ['All', 'Drama', 'Thriller', 'Romance', 'Comedy', 'Adventure', 'Mystery'];
