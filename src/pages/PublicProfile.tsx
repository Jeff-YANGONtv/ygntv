import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getPublicProfile } from '../lib/api';
import type { PublicProfile } from '../lib/types';

function dateLabel(value?: string | null): string {
  if (!value) return 'Member date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Member date unavailable' : `Member since ${new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date)}`;
}

export function PublicProfilePage() {
  const { id = '' } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getPublicProfile(id).then((next) => { if (mounted) setProfile(next); }).catch(() => { if (mounted) setError(true); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="container page-loading"><div className="profile-loading">Loading profile…</div></div>;
  if (error || !profile) return <div className="container page-state"><div className="profile-empty">This profile is unavailable.</div></div>;
  return <section className="public-profile-page container"><Link className="back-link" to="/blog"><ArrowLeft size={15} /> Back to Blog</Link><article className="public-profile-card"><div className="public-profile-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <UserRound size={34} />}</div><div><span className="eyebrow">Yangon TV member</span><h1>{profile.display_name}</h1><p><CalendarDays size={15} /> {dateLabel(profile.member_since)}</p></div></article></section>;
}
