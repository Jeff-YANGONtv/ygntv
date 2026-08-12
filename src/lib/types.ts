export type MediaKind = 'movie' | 'series';

export interface MediaItem {
  id: number | string;
  slug: string;
  title: string;
  originalTitle?: string;
  kind: MediaKind;
  year: string;
  rating: number;
  runtime?: string;
  genres: string[];
  casts?: string[];
  synopsis?: string;
  description: string;
  poster: string;
  backdrop: string;
  streamingLinks: string[];
  downloadLinks: string[];
  featured?: boolean;
  badge?: string;
  seasons?: Season[];
  seasonCount?: number;
  episodes?: number;
}

export interface Episode {
  id: number | string;
  number: number;
  title: string;
  duration?: string;
  thumbnail?: string;
  review?: string;
  streamingLinks: string[];
  downloadLinks: string[];
  available?: boolean;
}

export interface Season {
  id: number | string;
  number: number;
  title: string;
  year?: string;
  review?: string;
  episodes: Episode[];
}

export interface BlogPost {
  id: number | string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  author: string;
  image: string;
  readTime: string;
  content: string;
  featured?: boolean;
}

export interface SocialLink {
  id: number | string;
  name: string;
  icon: string;
  url: string;
  display_order?: number;
  is_active?: boolean;
}

export interface ApiPage<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  total: number;
}

export interface ApiErrorState {
  message: string;
  retry?: () => void;
}
