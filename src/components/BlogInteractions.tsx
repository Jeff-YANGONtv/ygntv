import { useEffect, useState } from 'react';
import { Angry, Facebook, Heart, Laugh, LoaderCircle, MessageCircle, Music2, Send, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBlogInteractions, getCurrentBlogReaction, postBlogComment, saveBlogReaction } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { BlogInteractions as BlogInteractionsData, BlogReactionType } from '../lib/types';

const reactions: Array<{ type: BlogReactionType; label: string; icon: typeof Heart }> = [
  { type: 'love', label: 'Love', icon: Heart },
  { type: 'like', label: 'Like', icon: ThumbsUp },
  { type: 'haha', label: 'Haha', icon: Laugh },
  { type: 'angry', label: 'Angry', icon: Angry },
];

function formatCommentDate(value?: string | null): string {
  if (!value) return 'Just now';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just now' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function BlogInteractions({ blogId, slug, title }: { blogId: number | string; slug: string; title: string }) {
  const { user, openAuth } = useAuth();
  const [data, setData] = useState<BlogInteractionsData | null>(null);
  const [reaction, setReaction] = useState<BlogReactionType | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingReaction, setSavingReaction] = useState<BlogReactionType | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getBlogInteractions(blogId)
      .then(async (next) => {
        if (!mounted) return;
        setData(next);
        if (user) {
          try {
            const current = await getCurrentBlogReaction(blogId);
            if (mounted) setReaction(current);
          } catch {
            if (mounted) setReaction(null);
          }
        } else setReaction(null);
      })
      .catch(() => { if (mounted) setFeedback('Blog interactions are temporarily unavailable.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [blogId, user]);

  const signInForInteraction = () => openAuth('login', `/blog/${slug}`);

  const handleReaction = async (type: BlogReactionType) => {
    if (!user) return signInForInteraction();
    setSavingReaction(type);
    setFeedback('');
    try {
      const next = await saveBlogReaction(blogId, type);
      setData((current) => current ? { ...current, ...next, comments: current.comments } : next);
      setReaction(next.reaction || type);
    } catch {
      setFeedback('Your reaction could not be saved. Please try again.');
    } finally {
      setSavingReaction(null);
    }
  };

  const handleComment = async () => {
    const body = comment.trim();
    if (!user) return signInForInteraction();
    if (!body) return;
    setPostingComment(true);
    setFeedback('');
    try {
      const next = await postBlogComment(blogId, body);
      setData((current) => current
        ? { ...current, ...next, comments: next.comment ? [...current.comments, next.comment] : current.comments }
        : { ...next, comments: next.comment ? [next.comment] : [] });
      setComment('');
    } catch {
      setFeedback('Your comment could not be posted. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const articleUrl = typeof window === 'undefined' ? `https://ygntv.vercel.app/blog/${slug}` : window.location.href;
  const shareText = `Read “${title}” on Yangon TV`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
  const shareToTikTok = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: articleUrl });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(articleUrl);
      setFeedback('Link copied. Open TikTok and paste it into your post.');
    } catch {
      setFeedback('TikTok sharing is not available in this browser.');
    }
  };

  return <section className="blog-interactions" aria-label="Blog interactions">
    <div className="blog-interactions-heading"><div><span className="eyebrow">Community</span><h2>Join the conversation</h2></div><span className="blog-comment-total"><MessageCircle size={15} /> {data?.comment_count ?? 0}</span></div>
    <div className="reaction-row">{reactions.map(({ type, label, icon: Icon }) => <button className={reaction === type ? `reaction-button reaction-button--${type} reaction-button--selected` : `reaction-button reaction-button--${type}`} type="button" key={type} onClick={() => handleReaction(type)} disabled={Boolean(savingReaction)} aria-pressed={reaction === type}><Icon size={16} fill={reaction === type ? 'currentColor' : 'none'} /><span>{label}</span><b>{data?.reaction_counts?.[type] ?? 0}</b></button>)}</div>
    <div className="blog-share-row"><span>Share post</span><div><a className="share-button share-button--telegram" href={telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram"><Send size={17} />Telegram</a><a className="share-button share-button--facebook" href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook"><Facebook size={17} />Facebook</a><button className="share-button share-button--tiktok" type="button" onClick={shareToTikTok} aria-label="Share to TikTok"><Music2 size={17} />TikTok</button></div></div>
    <div className="comment-composer"><div className="comment-composer-heading"><h3>Comments</h3>{!user && <button type="button" onClick={signInForInteraction}>Sign in to comment</button>}</div><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} disabled={!user || postingComment} placeholder={user ? 'Write a comment…' : 'Sign in to write a comment'} aria-label="Write a comment" /><div className="comment-composer-footer"><small>{comment.length}/1000</small><button className="button button--primary" type="button" onClick={handleComment} disabled={!user || !comment.trim() || postingComment}>{postingComment ? <><LoaderCircle className="spin" size={15} /> Posting…</> : 'Post comment'}</button></div></div>
    {feedback && <p className="blog-interaction-feedback" role="status">{feedback}</p>}
    {loading ? <div className="profile-loading"><LoaderCircle className="spin" size={17} /> Loading discussion…</div> : <div className="comment-list">{data?.comments.length ? data.comments.map((item) => <article className="comment-item" key={item.id}><Link className="comment-author-avatar" to={`/profiles/${item.user.id}`} aria-label={`Open ${item.user.display_name}'s profile`}>{item.user.avatar_url ? <img src={item.user.avatar_url} alt="" /> : item.user.display_name.slice(0, 1).toUpperCase()}</Link><div><div className="comment-author-line"><Link to={`/profiles/${item.user.id}`}>{item.user.display_name}</Link><span>{formatCommentDate(item.created_at)}</span></div><p>{item.body}</p></div></article>) : <div className="profile-empty">No comments yet. Be the first to join the conversation.</div>}</div>}
  </section>;
}
