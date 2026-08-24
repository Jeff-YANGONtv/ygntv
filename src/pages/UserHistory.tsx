import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock3, Film, History, MessageCircle, WalletCards } from 'lucide-react';
import { getTvCommentHistory, getTvWalletActivity, getTvWatchHistory, mediaUrl } from '../lib/api';
import { useAuth } from '../lib/auth';
import { blogPath, mediaDetailPath } from '../lib/paths';
import type { TvCommentHistoryEntry, TvWalletActivityHistory, TvWatchHistoryEntry } from '../lib/types';
import '../styles/user-history.css';

type HistoryTab = 'watch' | 'balance' | 'comments';

function formatDate(value?: string | null): string {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function watchPath(entry: TvWatchHistoryEntry): string {
  return mediaDetailPath({ kind: entry.content.kind === 'movie' ? 'movie' : 'series', slug: entry.content.slug });
}

function watchProgress(entry: TvWatchHistoryEntry): string {
  if (entry.completed) return 'Completed';
  if (!entry.duration_seconds) return 'Watched';
  return `${Math.min(100, Math.round((entry.position_seconds / entry.duration_seconds) * 100))}% watched`;
}

export function UserHistoryPage() {
  const { token, signOut } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeTab: HistoryTab = params.get('tab') === 'balance' ? 'balance' : params.get('tab') === 'comments' ? 'comments' : 'watch';
  const [watchHistory, setWatchHistory] = useState<TvWatchHistoryEntry[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<TvWalletActivityHistory | null>(null);
  const [commentHistory, setCommentHistory] = useState<TvCommentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.allSettled([getTvWatchHistory(), getTvWalletActivity(), getTvCommentHistory()])
      .then(([watchResult, balanceResult, commentResult]) => {
        if (!active) return;
        const unauthorised = [watchResult, balanceResult, commentResult].some((result) => result.status === 'rejected' && (result.reason as { response?: { status?: number } })?.response?.status === 401);
        if (unauthorised) {
          signOut();
          navigate('/auth', { replace: true });
          return;
        }
        if (watchResult.status === 'fulfilled') setWatchHistory(watchResult.value.data);
        if (balanceResult.status === 'fulfilled') setBalanceHistory(balanceResult.value);
        if (commentResult.status === 'fulfilled') setCommentHistory(commentResult.value.data);
        if ([watchResult, balanceResult, commentResult].every((result) => result.status === 'rejected')) setError('Your history is temporarily unavailable. Please try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, signOut, token]);

  if (!token) return <Navigate to="/auth" replace />;

  const setTab = (tab: HistoryTab) => setParams(tab === 'watch' ? {} : { tab });

  return <section className="user-history-page container">
    <header className="user-history-heading"><span className="eyebrow">Your account</span><h1>User History</h1><p>Your watch, balance, and comment activity in one private place.</p></header>
    <div className="user-history-tabs" role="tablist" aria-label="User history categories">
      <button className={activeTab === 'watch' ? 'user-history-tab user-history-tab--active' : 'user-history-tab'} type="button" role="tab" aria-selected={activeTab === 'watch'} onClick={() => setTab('watch')}><Film size={16} />Watch History</button>
      <button className={activeTab === 'balance' ? 'user-history-tab user-history-tab--active' : 'user-history-tab'} type="button" role="tab" aria-selected={activeTab === 'balance'} onClick={() => setTab('balance')}><WalletCards size={16} />Balance History</button>
      <button className={activeTab === 'comments' ? 'user-history-tab user-history-tab--active' : 'user-history-tab'} type="button" role="tab" aria-selected={activeTab === 'comments'} onClick={() => setTab('comments')}><MessageCircle size={16} />Comment History</button>
    </div>
    {error && <div className="profile-alert" role="alert"><AlertCircle size={17} />{error}</div>}
    {loading ? <div className="profile-loading" role="status">Loading your history…</div> : <section className="user-history-panel">
      {activeTab === 'watch' && <>{watchHistory.length ? <div className="watch-history-list">{watchHistory.map((entry) => <Link className="watch-history-card" key={entry.id} to={watchPath(entry)}><img src={mediaUrl(entry.content.poster)} alt="" /><div><span className="eyebrow">{entry.content.kind === 'movie' ? 'Movie' : 'Episode'} · {formatDate(entry.last_watched_at)}</span><h2>{entry.content.title}</h2><p><Clock3 size={14} />{watchProgress(entry)}</p></div></Link>)}</div> : <EmptyHistory icon={Film} title="No Watch History yet" copy="Titles you watch will appear here." />}</>}
      {activeTab === 'balance' && <>{balanceHistory?.mode === 'premium' ? <EmptyHistory icon={WalletCards} title="No Balance History for Lifetime" copy="Lifetime access does not use a Point balance." /> : balanceHistory?.entries.length ? <div className="wallet-activity-list">{balanceHistory.entries.map((entry) => { const isCredit = entry.points_delta > 0; return <article className="wallet-activity-row" key={entry.id}><div className={isCredit ? 'wallet-activity-icon wallet-activity-icon--credit' : 'wallet-activity-icon wallet-activity-icon--debit'}>{isCredit ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</div><div className="wallet-activity-main"><strong>{entry.title}</strong><span>{entry.description}</span><small>{formatDate(entry.created_at)}</small></div><div className="wallet-activity-points"><strong className={isCredit ? 'wallet-points wallet-points--credit' : 'wallet-points wallet-points--debit'}>{isCredit ? '+' : ''}{entry.points_delta.toLocaleString()} Points</strong><span>Balance: {entry.balance_after.toLocaleString()}</span></div></article>; })}</div> : <EmptyHistory icon={WalletCards} title="No Balance History yet" copy="Point balance changes will appear here." />}</>}
      {activeTab === 'comments' && <>{commentHistory.length ? <div className="comment-history-list">{commentHistory.map((comment) => <Link className="comment-history-card" key={comment.id} to={`${blogPath(comment.blog)}#comment-${comment.id}`}><span className="eyebrow">{comment.parent_id ? 'Reply' : 'Comment'} · {formatDate(comment.created_at)}</span><h2>{comment.blog.title}</h2><p>{comment.body}</p><span className={comment.is_visible ? 'comment-history-state' : 'comment-history-state comment-history-state--hidden'}><CheckCircle2 size={13} />{comment.is_visible ? 'Visible' : 'Under review'}</span></Link>)}</div> : <EmptyHistory icon={MessageCircle} title="No Comment History yet" copy="Your Blog comments and replies will appear here." />}</>}
    </section>}
  </section>;
}

function EmptyHistory({ icon: Icon, title, copy }: { icon: typeof History; title: string; copy: string }) {
  return <div className="user-history-empty"><Icon size={27} /><strong>{title}</strong><p>{copy}</p></div>;
}
