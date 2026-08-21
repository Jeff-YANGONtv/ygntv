import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, CalendarDays, Clapperboard, Film, Home, Info, Link2, Menu, Newspaper, Search, UserRound, X } from 'lucide-react';
import { Logo } from '../components/ui/Primitives';
import { getBlogs } from '../lib/api';
import { AuthDialog, useAuth } from '../lib/auth';
import type { BlogPost } from '../lib/types';

const navigation = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Movies', to: '/movies', icon: Film },
  { label: 'Series', to: '/series', icon: Clapperboard },
  { label: 'Links', to: '/links', icon: Link2 },
  { label: 'Blog', to: '/blog', icon: Newspaper },
  { label: 'About us', to: '/about', icon: Info },
];

export function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [latestBlog, setLatestBlog] = useState<BlogPost | null>(null);
  const [hasNewBlog, setHasNewBlog] = useState(false);
  const { user } = useAuth();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let mounted = true;
    const storageKey = 'yangon-tv-last-seen-blog';

    const refreshBlogNotification = async () => {
      try {
        const page = await getBlogs({ page: 1 });
        const newest = [...page.data].sort((left, right) => {
          const leftTime = Date.parse(left.date) || 0;
          const rightTime = Date.parse(right.date) || 0;
          return rightTime - leftTime;
        })[0];
        if (!mounted || !newest) return;

        const newestKey = String(newest.id || newest.slug || newest.date);
        const seenKey = window.localStorage.getItem(storageKey);
        if (!seenKey) {
          window.localStorage.setItem(storageKey, newestKey);
          setHasNewBlog(false);
        } else {
          setHasNewBlog(seenKey !== newestKey);
        }
        setLatestBlog(newest);
      } catch {
        // Keep the bell quiet when the public blog API is unavailable.
      }
    };

    refreshBlogNotification();
    const intervalId = window.setInterval(refreshBlogNotification, 60_000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  function toggleNotice() {
    const nextOpen = !noticeOpen;
    setNoticeOpen(nextOpen);
    if (nextOpen && latestBlog) {
      window.localStorage.setItem('yangon-tv-last-seen-blog', String(latestBlog.id || latestBlog.slug || latestBlog.date));
      setHasNewBlog(false);
    }
  }

  return <div className="app-shell">
    <header className="site-header">
      <div className="container header-inner">
        <button className="icon-button menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu" aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        <Logo />
        <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="Primary navigation">
          {navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'} end={to === '/'}><Icon size={16} />{label}</NavLink>)}
          <NavLink to={user ? '/profile' : '/auth'} className={({ isActive }) => isActive ? 'nav-link nav-link--active nav-link--account' : 'nav-link nav-link--account'}><UserRound size={16} />{user ? 'User profile' : 'Sign in'}</NavLink>
        </nav>
        <div className="header-actions"><Link to="/movies" className="icon-button" aria-label="Search movies"><Search size={19} /></Link><button className="icon-button notification-button" onClick={toggleNotice} aria-label={latestBlog ? 'Open blog notifications' : 'No new blog notifications'}><Bell size={19} />{hasNewBlog && <span />}</button></div>
      </div>
    </header>
    {noticeOpen && latestBlog && <div className="notice-popover"><strong>New blog post</strong><p>{latestBlog.title}</p><Link className="text-link" to={latestBlog.slug ? `/blog/${latestBlog.slug}` : '/blog'} onClick={() => setNoticeOpen(false)}><CalendarDays size={14} /> Read the latest story</Link></div>}
    <main><Outlet /></main>
    <footer className={`site-footer ${isHomePage ? 'site-footer--minimal' : ''}`}>{!isHomePage && <div className="container footer-grid"><div><Logo /><p className="footer-copy">Stories worth staying up for. Discover movies, series, recaps, and the people behind them.</p></div><div><span className="footer-label">Explore</span><Link to="/movies">Movies</Link><Link to="/series">Series</Link><Link to="/blog">Blog</Link></div><div><span className="footer-label">Yangon TV</span><Link to="/about">About us</Link><Link to="/links">Useful links</Link><a href="mailto:hello@yangontv.com">Contact</a></div></div>}<div className="container footer-bottom"><span>© 2026 Yangon TV. Made for Myanmar audiences.</span><span>All content is for entertainment purposes.</span></div></footer>
    <AuthDialog />
    <div className="mobile-bottom-nav">{navigation.slice(0, 5).map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'mobile-nav-link mobile-nav-link--active' : 'mobile-nav-link'} end={to === '/'}><Icon size={18} /><span>{label}</span></NavLink>)}</div>
  </div>;
}
