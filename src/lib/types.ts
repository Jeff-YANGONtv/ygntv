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
  description: string;
  poster: string;
  backdrop: string;
  featured?: boolean;
  badge?: string;
  seasons?: number;
  episodes?: number;
}

export interface Episode {
  id: number | string;
  number: number;
  title: string;
  duration: string;
  thumbnail: string;
  available?: boolean;
}

export interface Season {
  id: number | string;
  number: number;
  title: string;
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
