import axios from 'axios';
import type { AdBanner, ApiPage, BlogInteractions, BlogPost, BlogReactionType, ContactAudienceChannel, Episode, MediaItem, PaymentAccount, PaymentOrder, PremiumPlan, PublicProfile, Season, SocialLink, TvCardRedemption, TvCommentHistoryEntry, TvNotificationFeed, TvPlaybackPayload, TvPrepaidPurchase, TvProfileData, TvWalletActivityHistory, TvWalletSummary, TvWalletUnlock, TvWatchHistoryEntry, UserNotification } from './types';
import { publicMediaSlug } from './paths';

const remoteApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://khaki-yak-457838.hostingersite.com/api';
const isVercelWebsite = typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app');
const apiBaseUrl = isVercelWebsite ? '/api' : remoteApiBaseUrl;
export const mediaBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL || 'https://khaki-yak-457838.hostingersite.com';

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

export function mediaUrl(value?: string | null, fallback = ''): string {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;
  return `${mediaBaseUrl.replace(/\/$/, '')}/${value.replace(/^\//, '')}`;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function getContactAudiences(): Promise<ContactAudienceChannel[]> {
  const response = await api.get('/public/contact-audiences');
  const data = unwrap<unknown>(response.data);
  return Array.isArray(data) ? data as ContactAudienceChannel[] : [];
}

export async function getAds(position?: string): Promise<AdBanner[]> {
  const response = await api.get('/public/ads', { params: position ? { position } : undefined });
  const data = unwrap<unknown>(response.data);
  return Array.isArray(data) ? data as AdBanner[] : [];
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return stringArray(parsed);
  } catch {
    // Laravel JSON columns are normally decoded by the API; keep plain URLs supported too.
  }
  return [value.trim()];
}

function castNames(value: unknown): string[] {
  if (!Array.isArray(value)) return stringArray(value);
  return value.map((entry) => {
    if (typeof entry === 'string') return entry.trim();
    if (entry && typeof entry === 'object') {
      const item = entry as Record<string, unknown>;
      return String(item.name ?? item.original_name ?? item.character ?? '').trim();
    }
    return '';
  }).filter(Boolean);
}

function numericValue(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeEpisode(raw: unknown, index: number): Episode {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const title = String(source.title ?? source.name ?? `Episode ${index + 1}`);
  const number = numericValue(source.number ?? source.episode_number ?? title.match(/\d+/)?.[0], index + 1);
  return {
    id: (source.id as number | string | undefined) ?? `${number}-${title}`,
    number,
    title,
    duration: source.duration ? String(source.duration) : undefined,
    thumbnail: source.thumbnail ? String(source.thumbnail) : undefined,
    review: source.review ? String(source.review) : undefined,
    streamingLinks: stringArray(source.streamingLinks ?? source.streaming_links ?? source.stream_url ?? source.stream),
    downloadLinks: stringArray(source.downloadLinks ?? source.download_links ?? source.download_url ?? source.download),
    telegramPostUrl: typeof (source.telegramPostUrl ?? source.telegram_post_url) === 'string'
      ? String(source.telegramPostUrl ?? source.telegram_post_url).trim() || undefined
      : undefined,
    available: source.available == null ? true : Boolean(source.available),
  };
}

function normalizeSeason(raw: unknown, index: number): Season {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const title = String(source.title ?? source.name ?? `Season ${index + 1}`);
  const number = numericValue(source.number ?? source.season_number ?? title.match(/\d+/)?.[0], index + 1);
  const rawEpisodes = Array.isArray(source.episodes) ? source.episodes : [];
  return {
    id: (source.id as number | string | undefined) ?? `${number}-${title}`,
    number,
    title,
    year: source.year ? String(source.year) : undefined,
    review: source.review ? String(source.review) : undefined,
    episodes: rawEpisodes.map((episode, episodeIndex) => normalizeEpisode(episode, episodeIndex)),
  };
}

export function normalizeMediaItem(raw: unknown, fallbackKind: 'movie' | 'series'): MediaItem {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const releaseDate = String(source.release_date ?? source.date ?? '');
  const title = String(source.title ?? source.name ?? 'Untitled');
  const poster = String(source.poster ?? source.poster_url ?? source.poster_path ?? '');
  const backdrop = String(source.backdrop ?? source.backdrop_url ?? source.backdrop_path ?? poster);
  const synopsis = String(source.synopsis ?? source.review ?? source.description ?? '');
  const kind = source.kind === 'series' || source.kind === 'movie' ? source.kind : fallbackKind;
  const rating = Number(source.rating ?? source.vote_average ?? 0);
  const genres = stringArray(source.genres);
  const credits = source.credits && typeof source.credits === 'object' ? source.credits as Record<string, unknown> : undefined;
  const casts = castNames(source.casts ?? source.cast ?? source.cast_members ?? credits?.cast);
  const streamingLinks = stringArray(source.streamingLinks ?? source.streaming_links ?? source.stream_url ?? source.stream);
  const downloadLinks = stringArray(source.downloadLinks ?? source.download_links ?? source.download_url ?? source.download);
  const telegramPostUrl = typeof (source.telegramPostUrl ?? source.telegram_post_url) === 'string'
    ? String(source.telegramPostUrl ?? source.telegram_post_url).trim() || undefined
    : undefined;
  const rawSeasons = Array.isArray(source.seasons) ? source.seasons : [];
  const seasons = rawSeasons.map((season, seasonIndex) => normalizeSeason(season, seasonIndex));
  const seasonFallback = seasons.length || (Array.isArray(source.seasons) ? 0 : numericValue(source.seasons, 0));
  const episodeFallback = seasons.length ? seasons.reduce((total, season) => total + season.episodes.length, 0) : numericValue(source.episodes, 0);
  const seasonCount = numericValue(source.season_count ?? source.seasonCount, seasonFallback);
  const episodeCount = numericValue(source.episode_count ?? source.episodeCount, episodeFallback);

  return {
    id: (source.id as number | string | undefined) ?? title,
    slug: String(source.slug ?? ''),
    title,
    originalTitle: source.originalTitle ? String(source.originalTitle) : undefined,
    kind,
    year: String(source.year ?? (releaseDate ? releaseDate.slice(0, 4) : '')),
    rating: Number.isFinite(rating) ? rating : 0,
    runtime: source.runtime ? String(source.runtime) : undefined,
    genres,
    casts,
    synopsis,
    description: String(source.description ?? synopsis),
    poster,
    backdrop,
    streamingLinks,
    downloadLinks,
    telegramPostUrl,
    featured: Boolean(source.featured),
    badge: source.badge ? String(source.badge) : undefined,
    seasons: seasons.length ? seasons : undefined,
    seasonCount,
    episodes: episodeCount,
  };
}

function normalizePage(page: ApiPage<MediaItem>, kind: 'movie' | 'series'): ApiPage<MediaItem> {
  return { ...page, data: page.data.map((entry) => normalizeMediaItem(entry, kind)) };
}

function pageFrom<T>(payload: unknown, page: number): ApiPage<T> {
  const root = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
  const nested = root?.data && typeof root.data === 'object' && !Array.isArray(root.data)
    ? root.data as Record<string, unknown>
    : null;
  const rows = Array.isArray(payload)
    ? payload as T[]
    : Array.isArray(root?.data)
      ? root.data as T[]
      : nested && Array.isArray(nested.data)
        ? nested.data as T[]
        : root && Array.isArray(root.items)
          ? root.items as T[]
          : [];
  const meta = (root?.meta && typeof root.meta === 'object'
    ? root.meta
    : nested?.meta && typeof nested.meta === 'object'
      ? nested.meta
      : root) as Record<string, unknown> | null;
  return {
    data: rows,
    currentPage: Number(meta?.current_page || meta?.currentPage || page),
    lastPage: Number(meta?.last_page || meta?.lastPage || 1),
    total: Number(meta?.total || rows.length),
  };
}

export async function getMovies(params: { page?: number; search?: string; genre?: string } = {}): Promise<ApiPage<MediaItem>> {
  const page = params.page || 1;
  const response = await api.get('/movies', { params: { page, search: params.search, genre: params.genre } });
  return normalizePage(pageFrom<MediaItem>(response.data, page), 'movie');
}

export async function getSeries(params: { page?: number; search?: string; genre?: string } = {}): Promise<ApiPage<MediaItem>> {
  const page = params.page || 1;
  const response = await api.get('/shows', { params: { page, search: params.search, genre: params.genre } });
  return normalizePage(pageFrom<MediaItem>(response.data, page), 'series');
}

export async function getMediaBySlug(kind: 'movie' | 'series', slug: string): Promise<MediaItem | null> {
  try {
    const response = await api.get(`/${kind === 'movie' ? 'movies' : 'shows'}/slug/${slug}`);
    const raw = unwrap<unknown>(response.data);
    if (raw) return normalizeMediaItem(raw, kind);
  } catch {
    // Clean public URLs omit the backend-generated suffix, so resolve them against live catalog data below.
  }

  const loader = kind === 'movie' ? getMovies : getSeries;
  const firstPage = await loader({ page: 1 });
  const matchingFirstPage = firstPage.data.find((item) => publicMediaSlug(item.slug) === slug);
  if (matchingFirstPage) return matchingFirstPage;

  for (let page = 2; page <= firstPage.lastPage; page += 1) {
    const result = await loader({ page });
    const match = result.data.find((item) => publicMediaSlug(item.slug) === slug);
    if (match) return match;
  }

  return null;
}

export async function getBlogs(params: { page?: number; search?: string } = {}): Promise<ApiPage<BlogPost>> {
  const page = params.page || 1;
  const response = await api.get('/public/blogs', { params: { page, search: params.search } });
  return pageFrom<BlogPost>(response.data, page);
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const response = await api.get(`/public/blogs/${slug}`);
  return unwrap<BlogPost | null>(response.data) || null;
}

export async function getBlogInteractions(blogId: number | string): Promise<BlogInteractions> {
  const response = await api.get(`/public/blogs/${blogId}/interactions`);
  return unwrap<BlogInteractions>(response.data);
}

export async function getCurrentBlogReaction(blogId: number | string): Promise<BlogReactionType | null> {
  const response = await api.get(`/blog-interactions/${blogId}`);
  const data = unwrap<{ reaction?: BlogReactionType | null }>(response.data);
  return data.reaction || null;
}

export async function saveBlogReaction(blogId: number | string, type: BlogReactionType): Promise<BlogInteractions> {
  const response = await api.put(`/blog-interactions/${blogId}/reaction`, { type });
  return unwrap<BlogInteractions>(response.data);
}

export async function postBlogComment(blogId: number | string, body: string, parentCommentId?: number | string | null): Promise<BlogInteractions> {
  const response = await api.post(`/blog-interactions/${blogId}/comments`, { body, parent_comment_id: parentCommentId ?? null });
  return unwrap<BlogInteractions>(response.data);
}

export async function getPublicProfile(userId: number | string): Promise<PublicProfile> {
  const response = await api.get(`/public/profiles/${userId}`);
  return unwrap<PublicProfile>(response.data);
}

export async function getSocials(): Promise<SocialLink[]> {
  const response = await api.get('/socials');
  const rows = unwrap<SocialLink[] | null>(response.data);
  return Array.isArray(rows) ? rows : [];
}

export async function getTvProfile(): Promise<TvProfileData> {
  const response = await api.get('/tv/profile');
  return unwrap<TvProfileData>(response.data);
}

export async function getTvWallet(): Promise<TvWalletSummary> {
  const response = await api.get('/tv/wallet');
  return unwrap<TvWalletSummary>(response.data);
}

export async function redeemPrepaidCode(code: string): Promise<TvCardRedemption> {
  const response = await api.post('/tv/wallet/redeem', { code });
  return unwrap<TvCardRedemption>(response.data);
}

export async function purchasePrepaidUnlock(contentType: 'movie' | 'episode', contentId: number): Promise<TvPrepaidPurchase> {
  const response = await api.post('/tv/wallet/purchases', { content_type: contentType, content_id: contentId });
  return unwrap<TvPrepaidPurchase>(response.data);
}

export async function getTvWalletUnlocks(): Promise<TvWalletUnlock[]> {
  const response = await api.get('/tv/wallet/unlocks');
  const data = unwrap<unknown>(response.data);
  return Array.isArray(data) ? data as TvWalletUnlock[] : [];
}

export async function getTvWalletActivity(page = 1): Promise<TvWalletActivityHistory> {
  const response = await api.get('/tv/wallet/activity', { params: { page } });
  return unwrap<TvWalletActivityHistory>(response.data);
}

export async function getTvWatchHistory(page = 1): Promise<ApiPage<TvWatchHistoryEntry>> {
  const response = await api.get('/tv/library/history', { params: { page } });
  return pageFrom<TvWatchHistoryEntry>(response.data, page);
}

export async function saveTvViewingProgress(payload: { content_type: 'movie' | 'episode'; content_id: number; position_seconds: number; duration_seconds?: number; completed?: boolean }): Promise<void> {
  await api.put('/tv/library/progress', payload);
}

export async function getTvCommentHistory(page = 1): Promise<ApiPage<TvCommentHistoryEntry>> {
  const response = await api.get('/tv/history/comments', { params: { page } });
  return pageFrom<TvCommentHistoryEntry>(response.data, page);
}

export async function getTvPlayback(contentType: 'movie' | 'episode', contentId: number): Promise<TvPlaybackPayload> {
  const endpoint = contentType === 'movie' ? `/tv/playback/movies/${contentId}` : `/tv/playback/episodes/${contentId}`;
  const response = await api.get(endpoint);
  return unwrap<TvPlaybackPayload>(response.data);
}

function notificationFeed(value: unknown): TvNotificationFeed {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const rows = Array.isArray(source.notifications) ? source.notifications : [];
  const notifications = rows.flatMap((entry): UserNotification[] => {
    if (!entry || typeof entry !== 'object') return [];
    const notification = entry as Record<string, unknown>;
    const id = notification.id;
    const title = typeof notification.title === 'string' ? notification.title.trim() : '';
    const message = typeof notification.message === 'string' ? notification.message.trim() : '';
    if ((typeof id !== 'string' && typeof id !== 'number') || !title || !message) return [];
    return [{
      id,
      title,
      message,
      type: typeof notification.type === 'string' ? notification.type : null,
      link_url: typeof notification.link_url === 'string' ? notification.link_url : null,
      created_at: typeof notification.created_at === 'string' ? notification.created_at : null,
      read_at: typeof notification.read_at === 'string' ? notification.read_at : null,
    }];
  });
  const unreadCount = Number(source.unread_count);
  return { notifications, unread_count: Number.isFinite(unreadCount) && unreadCount >= 0 ? unreadCount : notifications.filter((notification) => !notification.read_at).length };
}

export async function getTvNotifications(): Promise<TvNotificationFeed> {
  const response = await api.get('/tv/notifications');
  return notificationFeed(unwrap<unknown>(response.data));
}

export async function markTvNotificationRead(notificationId: number | string): Promise<TvNotificationFeed> {
  const response = await api.post(`/tv/notifications/${notificationId}/read`);
  return notificationFeed(unwrap<unknown>(response.data));
}

export async function markAllTvNotificationsRead(): Promise<TvNotificationFeed> {
  const response = await api.post('/tv/notifications/read-all');
  return notificationFeed(unwrap<unknown>(response.data));
}

export async function getPaymentOrders(): Promise<ApiPage<PaymentOrder>> {
  const response = await api.get('/tv/payment-orders', { params: { page: 1 } });
  return pageFrom<PaymentOrder>(response.data, 1);
}

export async function getPremiumPlans(): Promise<PremiumPlan[]> {
  const response = await api.get('/tv/premium-plans');
  const raw = unwrap<unknown>(response.data);
  const rows = Array.isArray(raw) ? raw : [];
  return rows.flatMap((entry): PremiumPlan[] => {
    if (!entry || typeof entry !== 'object') return [];
    const plan = entry as Record<string, unknown>;
    const key = String(plan.key ?? '').trim();
    const label = String(plan.label ?? '').trim();
    const amountKs = Number(plan.amount_ks);
    const accessMonths = Number(plan.access_months);
    if (!key || !label || !Number.isFinite(amountKs) || !Number.isFinite(accessMonths)) return [];
    return [{ id: typeof plan.id === 'string' || typeof plan.id === 'number' ? plan.id : undefined, key, label, amount_ks: amountKs, access_months: accessMonths }];
  });
}

export async function getPublicPaymentAccounts(): Promise<PaymentAccount[]> {
  const response = await api.get('/public/payment-accounts');
  const raw = unwrap<unknown>(response.data);
  const rows = Array.isArray(raw) ? raw : [];
  return rows.flatMap((entry): PaymentAccount[] => {
    if (!entry || typeof entry !== 'object') return [];
    const account = entry as Record<string, unknown>;
    const id = account.id;
    const name = String(account.name ?? '').trim();
    if ((typeof id !== 'string' && typeof id !== 'number') || !name) return [];
    return [{
      id,
      name,
      account_name: typeof account.account_name === 'string' ? account.account_name : null,
      description: typeof account.description === 'string' ? account.description : null,
      phone_number: typeof account.phone_number === 'string' ? account.phone_number : null,
      account_number: typeof account.account_number === 'string' ? account.account_number : null,
      qr_image_url: typeof account.qr_image_url === 'string' ? account.qr_image_url : null,
      is_active: account.is_active == null ? true : Boolean(account.is_active),
    }];
  });
}

export async function createPaymentOrder(paymentAccountId: number | string, planKey: string): Promise<PaymentOrder> {
  const response = await api.post('/tv/payment-orders', { payment_account_id: paymentAccountId, plan_key: planKey });
  const payload = unwrap<unknown>(response.data);
  const order = payload && typeof payload === 'object' && 'order' in payload
    ? (payload as { order: PaymentOrder }).order
    : payload as PaymentOrder;
  if (!order || (typeof order.id !== 'string' && typeof order.id !== 'number')) throw new Error('The payment order response was incomplete.');
  return order;
}

export async function submitOrderReceipt(orderId: number | string, receipt: File, receiptReference?: string): Promise<PaymentOrder> {
  const body = new FormData();
  body.append('receipt', receipt);
  if (receiptReference?.trim()) body.append('receipt_reference', receiptReference.trim());
  const response = await api.post(`/tv/payment-orders/${orderId}/submit-receipt`, body);
  return unwrap<PaymentOrder>(response.data);
}
