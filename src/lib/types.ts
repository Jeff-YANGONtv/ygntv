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
  telegramPostUrl?: string;
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
  telegramPostUrl?: string;
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

export type BlogReactionType = 'love' | 'like' | 'haha' | 'angry';

export interface CommentAuthor {
  id: number | string;
  display_name: string;
  avatar_url?: string | null;
}

export interface BlogComment {
  id: number | string;
  parent_id?: number | string | null;
  body: string;
  created_at?: string | null;
  user: CommentAuthor;
  replies?: BlogComment[];
}

export interface BlogInteractions {
  reaction_counts: Record<BlogReactionType, number>;
  comment_count: number;
  comments: BlogComment[];
  comments_meta?: { current_page: number; last_page: number; total: number };
  reaction?: BlogReactionType | null;
  comment?: BlogComment;
}

export interface PublicProfile {
  id: number | string;
  display_name: string;
  avatar_url?: string | null;
  member_since?: string | null;
}

export interface SocialLink {
  id: number | string;
  name: string;
  icon: string;
  url: string;
  display_order?: number;
  is_active?: boolean;
}

export interface AdBanner {
  id: number | string;
  name: string;
  type: 'banner' | 'link' | string;
  content: string;
  link_url?: string | null;
  position: string;
  display_order?: number;
  is_active?: boolean;
}

export interface TvEntitlement {
  active: boolean;
  plan_key: string | null;
  plan_label: string | null;
  valid_from: string | null;
  valid_until: string | null;
}

export interface TvProfileData {
  user: { id?: number | string; uid?: string | null; name?: string; email?: string; role?: string; created_at?: string | null };
  profile: { display_name?: string | null; avatar_url?: string | null; preferences?: Record<string, unknown> | null };
  entitlement: TvEntitlement;
  wallet?: TvWalletSummary;
}

export interface TvWalletSummary {
  mode: 'premium' | 'prepaid';
  balance_points: number | null;
  code_redeem_available: boolean;
  premium_valid_until?: string | null;
}

export interface TvCardRedemption {
  card_type: 'points' | 'premium_time';
  credited_points?: number;
  balance_points?: number;
  premium_plan_key?: string;
  premium_months?: number;
  premium_valid_until?: string;
}

export interface TvPlaybackAccess {
  access: 'premium' | 'prepaid_unlock' | 'purchase_required';
  content_type: 'movie' | 'episode';
  content_id: number;
  title: string;
  price_points: number;
  balance_points: number | null;
  unlock_expires_at: string | null;
}

export interface TvPlaybackPayload {
  content_type: 'movie' | 'episode';
  content_id: number;
  title: string;
  season_id?: number | null;
  show_id?: number | null;
  show_title?: string | null;
  streaming_links: string[];
  download_links: string[];
  access: TvPlaybackAccess;
}

export interface TvPrepaidPurchase {
  already_unlocked: boolean;
  balance_points: number;
  unlock_expires_at: string;
  content: { content_type: 'movie' | 'episode'; content_id: number; title: string; price_points: number };
}

export interface TvWalletUnlock {
  content_type: 'movie' | 'episode';
  content_id: number;
  price_points: number;
  unlocked_at: string;
  expires_at: string;
}

export interface TvWalletActivityEntry {
  id: number;
  type: 'prepaid_redemption' | 'content_unlock' | 'admin_adjustment' | string;
  points_delta: number;
  balance_after: number;
  title: string;
  description: string;
  content_type: 'movie' | 'episode' | null;
  content_id: number | null;
  unlock_expires_at: string | null;
  created_at: string | null;
}

export interface TvWalletActivityHistory {
  mode: 'premium' | 'prepaid';
  entries: TvWalletActivityEntry[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number; has_more: boolean };
}

export interface UserNotification {
  id: number | string;
  title: string;
  message: string;
  type?: string | null;
  link_url?: string | null;
  created_at?: string | null;
  read_at?: string | null;
}

export interface TvNotificationFeed {
  notifications: UserNotification[];
  unread_count: number;
}

export interface PaymentOrder {
  id: number | string;
  reference?: string;
  purpose?: string;
  plan_key?: string | null;
  amount_ks?: number;
  status?: string;
  upload_expires_at?: string | null;
  receipt_uploaded_at?: string | null;
  receipt_reference?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  created_at?: string | null;
}

export interface PremiumPlan {
  id?: number | string;
  key: string;
  label: string;
  amount_ks: number;
  access_months: number;
}

export interface PaymentAccount {
  id: number | string;
  name: string;
  account_name?: string | null;
  description?: string | null;
  phone_number?: string | null;
  account_number?: string | null;
  qr_image_url?: string | null;
  is_active?: boolean;
}

export interface ContactAudienceChannel {
  key: string;
  label: string;
  telegram_url?: string | null;
  viber_url?: string | null;
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
