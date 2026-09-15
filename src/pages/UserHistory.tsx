import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, Film, History, MessageCircle, ReceiptText } from 'lucide-react';
import { getPaymentOrders, getTvCommentHistory, getTvWatchHistory, mediaUrl } from '../lib/api';
import { useAuth } from '../lib/auth';
import { blogPath, mediaDetailPath } from '../lib/paths';
import type { PaymentOrder, TvCommentHistoryEntry, TvWatchHistoryEntry } from '../lib/types';
import '../styles/user-history.css';

type HistoryTab = 'watch' | 'purchases' | 'comments';

function formatDate(value?: string | null): string {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
function watchPath(entry: TvWatchHistoryEntry): string { return mediaDetailPath({ kind: entry.content.kind === 'movie' ? 'movie' : 'series', slug: entry.content.slug }); }
function watchProgress(entry: TvWatchHistoryEntry): string {
  if (entry.completed) return 'Completed';
  if (!entry.duration_seconds) return 'Watched';
  return `${Math.min(100, Math.round((entry.position_seconds / entry.duration_seconds) * 100))}% watched`;
}
function orderLabel(order: PaymentOrder): string { return order.plan_key || order.purpose || 'Membership purchase'; }

export function UserHistoryPage() {
  const { token, signOut } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeTab: HistoryTab = params.get('tab') === 'purchases' ? 'purchases' : params.get('tab') === 'comments' ? 'comments' : 'watch';
  const [watchHistory, setWatchHistory] = useState<TvWatchHistoryEntry[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [commentHistory, setCommentHistory] = useState<TvCommentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.allSettled([getTvWatchHistory(), getPaymentOrders(), getTvCommentHistory()]).then(([watchResult, orderResult, commentResult]) => {
      if (!active) return;
      const results = [watchResult, orderResult, commentResult];
      if (results.some((result) => result.status === 'rejected' && (result.reason as { response?: { status?: number } })?.response?.status === 401)) {
        signOut(); navigate('/auth', { replace: true }); return;
      }
      if (watchResult.status === 'fulfilled') setWatchHistory(watchResult.value.data);
      if (orderResult.status === 'fulfilled') setOrders(orderResult.value.data);
      if (commentResult.status === 'fulfilled') setCommentHistory(commentResult.value.data);
      if (results.every((result) => result.status === 'rejected')) setError('Your history is temporarily unavailable. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, signOut, token]);

  if (!token) return <Navigate to="/auth" replace />;
  const setTab = (tab: HistoryTab) => setParams(tab === 'watch' ? {} : { tab });

  return <section className="user-history-page container">
    <header className="user-history-heading"><span className="eyebrow">Your account</span><h1>User History</h1><p>Your watch, purchase, and comment activity in one private place.</p></header>
    <div className="user-history-tabs" role="tablist" aria-label="User history categories">
      <button className={activeTab === 'watch' ? 'user-history-tab user-history-tab--active' : 'user-history-tab'} type="button" role="tab" aria-selected={activeTab === 'watch'} onClick={() => setTab('watch')}><Film size={16} />Watch History</button>
      <button className={activeTab === 'purchases' ? 'user-history-tab user-history-tab--active' : 'user-history-tab'} type="button" role="tab" aria-selected={activeTab === 'purchases'} onClick={() => setTab('purchases')}><ReceiptText size={16} />Purchase &amp; Membership History</button>
      <button className={activeTab === 'comments' ? 'user-history-tab user-history-tab--active' : 'user-history-tab'} type="button" role="tab" aria-selected={activeTab === 'comments'} onClick={() => setTab('comments')}><MessageCircle size={16} />Comment History</button>
    </div>
    {error && <div className="profile-alert" role="alert"><AlertCircle size={17} />{error}</div>}
    {loading ? <div className="profile-loading" role="status">Loading your history…</div> : <section className="user-history-panel">
      {activeTab === 'watch' && (watchHistory.length ? <div className="watch-history-list">{watchHistory.map((entry) => <Link className="watch-history-card" key={entry.id} to={watchPath(entry)}><img src={mediaUrl(entry.content.poster)} alt="" /><div><span className="eyebrow">{entry.content.kind === 'movie' ? 'Movie' : 'Episode'} · {formatDate(entry.last_watched_at)}</span><h2>{entry.content.title}</h2><p><Clock3 size={14} />{watchProgress(entry)}</p></div></Link>)}</div> : <EmptyHistory icon={Film} title="No Watch History yet" copy="Titles you watch will appear here." />)}
      {activeTab === 'purchases' && (orders.length ? <div className="wallet-activity-list">{orders.map((order) => <article className="wallet-activity-row" key={order.id}><div className="wallet-activity-icon wallet-activity-icon--credit"><ReceiptText size={17} /></div><div className="wallet-activity-main"><strong>{orderLabel(order)}</strong><span>Reference: {order.reference || 'Pending'}</span><small>{formatDate(order.created_at)}{order.reviewed_at ? ` · Reviewed ${formatDate(order.reviewed_at)}` : ''}</small></div><div className="wallet-activity-points"><strong>{order.amount_ks ? `${order.amount_ks.toLocaleString()} Ks` : 'Membership'}</strong><span>{order.status || 'Pending'}</span></div></article>)}</div> : <EmptyHistory icon={ReceiptText} title="No Purchase History yet" copy="Your membership purchases and payment records will appear here." />)}
      {activeTab === 'comments' && (commentHistory.length ? <div className="comment-history-list">{commentHistory.map((comment) => <Link className="comment-history-card" key={comment.id} to={`${blogPath(comment.blog)}#comment-${comment.id}`}><span className="eyebrow">{comment.parent_id ? 'Reply' : 'Comment'} · {formatDate(comment.created_at)}</span><h2>{comment.blog.title}</h2><p>{comment.body}</p><span className={comment.is_visible ? 'comment-history-state' : 'comment-history-state comment-history-state--hidden'}><CheckCircle2 size={13} />{comment.is_visible ? 'Visible' : 'Under review'}</span></Link>)}</div> : <EmptyHistory icon={MessageCircle} title="No Comment History yet" copy="Your Blog comments and replies will appear here." />)}
    </section>}
  </section>;
}
function EmptyHistory({ icon: Icon, title, copy }: { icon: typeof History; title: string; copy: string }) { return <div className="user-history-empty"><Icon size={27} /><strong>{title}</strong><p>{copy}</p></div>; }
