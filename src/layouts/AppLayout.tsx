import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clapperboard, Crown, Film, History, Home, LogOut, Mail, Menu, Newspaper, Send, UserRound, X } from 'lucide-react';
import { FaFacebookF, FaTelegram, FaTiktok } from 'react-icons/fa6';
import { Logo } from '../components/ui/Primitives';
import { getAds, getSocials, getTvNotifications, markAllTvNotificationsRead, markTvNotificationRead } from '../lib/api';
import { AuthDialog, useAuth } from '../lib/auth';
import type { AdBanner, SocialLink, TvNotificationFeed, UserNotification } from '../lib/types';
import '../styles/drawer-menu.css';
import '../styles/subscription-menu.css';
import '../styles/mobile-typography.css';

const navigation = [
  { label: 'Contact Us', to: '/contact', icon: Mail },
];

const mobileNavigation = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Movies', to: '/movies', icon: Film },
  { label: 'Series', to: '/series', icon: Clapperboard },
  { label: 'Blog', to: '/blog', icon: Newspaper },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [marqueeAnnouncements, setMarqueeAnnouncements] = useState<AdBanner[]>([]);
  const { user, signOut } = useAuth();
  const isHomePage = location.pathname === '/';
  const accountLabel = user ? (user.name?.trim() || user.email?.split('@')[0] || 'Account') : 'User Profile';
  const accountPath = user ? '/profile' : '/auth';
  const historyPath = user ? '/profile#billing' : '/auth';
  const drawerSocials = socials.filter((social) => /facebook|tiktok|music|telegram|send/i.test(`${social.name} ${social.icon} ${social.url}`));
  const marqueeText = marqueeAnnouncements.map((announcement) => announcement.content.trim()).filter(Boolean);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    Promise.all([getSocials(), getAds('header_marquee')])
      .then(([nextSocials, nextMarquee]) => {
        if (!active) return;
        setSocials(nextSocials.filter((item) => item.is_active !== false));
        setMarqueeAnnouncements(nextMarquee.filter((item) => item.is_active !== false));
      })
      .catch(() => {
        if (!active) return;
        setSocials([]);
        setMarqueeAnnouncements([]);
      });
    return () => { active = false; };
  }, []);


  return <div className="app-shell">
    <header className="site-header">
      {marqueeText.length > 0 && <div className="header-marquee" aria-label="Latest Yangon TV announcements"><div className="container header-marquee__viewport"><div className="header-marquee__track"><span>{marqueeText.map((text) => `✦ ${text}`).join('     ')}</span><span aria-hidden="true">{marqueeText.map((text) => `✦ ${text}`).join('     ')}</span></div></div></div>}
      <div className="container header-inner">
        <Logo />
        <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="Primary navigation">
          <NavLink to={accountPath} className={({ isActive }) => isActive ? 'nav-link nav-link--account nav-link--active' : 'nav-link nav-link--account'}><UserRound size={16} />{accountLabel}</NavLink>
          <NavLink to="/subscription" className={({ isActive }) => isActive ? 'nav-link nav-link--menu nav-link--active' : 'nav-link nav-link--menu'}><Crown size={16} />Subscription</NavLink>
          {navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link nav-link--menu nav-link--active' : 'nav-link nav-link--menu'}><Icon size={16} />{label}</NavLink>)}
        </nav>
        <div className="header-actions">{user && <NotificationBell />}</div>
      </div>
    </header>
    {menuOpen && <><button className="drawer-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} /><aside className="mobile-drawer" aria-label="Website menu"><div className="mobile-drawer__top"><span className="profile-card-label">Welcome To Yangon TV</span><button className="icon-button" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu"><X size={20} /></button></div><nav className="mobile-drawer__nav"><NavLink to={accountPath} className={({ isActive }) => isActive ? 'mobile-drawer__link mobile-drawer__account mobile-drawer__link--active' : 'mobile-drawer__link mobile-drawer__account'}><UserRound size={18} />{accountLabel}</NavLink><NavLink to={historyPath} className={({ isActive }) => isActive ? 'mobile-drawer__link mobile-drawer__link--active' : 'mobile-drawer__link'}><History size={18} />User History</NavLink><NavLink to="/subscription" className={({ isActive }) => isActive ? 'mobile-drawer__link mobile-drawer__link--active' : 'mobile-drawer__link'}><Crown size={18} />Subscription</NavLink>{navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'mobile-drawer__link mobile-drawer__link--active' : 'mobile-drawer__link'}><Icon size={18} />{label}</NavLink>)}</nav>{drawerSocials.length > 0 && <div className="mobile-drawer__socials"><span className="profile-card-label">Follow Us</span>{drawerSocials.map((social) => { const Icon = socialIcon(social); return <a className="mobile-drawer__social" href={social.url} key={social.id} target="_blank" rel="noopener noreferrer"><Icon size={17} className={`mobile-drawer__social-icon mobile-drawer__social-icon--${socialIconName(social)}`} /><span>{social.name}</span></a>; })}</div>}{user && <button className="mobile-drawer__logout" type="button" onClick={() => { signOut(); navigate('/auth', { replace: true }); }}><LogOut size={18} />Log Out</button>}</aside></>}
    <main><Outlet /></main>
    <footer className={`site-footer ${isHomePage ? 'site-footer--minimal' : ''}`}>{!isHomePage && <div className="container footer-grid"><div><Logo /><p className="footer-copy">Stories worth staying up for. Discover movies, series, recaps, and the people behind them.</p></div><div><span className="footer-label">Explore</span><Link to="/movies">Movies</Link><Link to="/series">Series</Link><Link to="/blog">Blog</Link></div><div><span className="footer-label">Yangon TV</span><Link to="/links">Useful links</Link><a href="mailto:hello@yangontv.com">Contact</a></div></div>}<div className="container footer-bottom"><span>© 2026 Yangon TV. Made for Myanmar audiences.</span><span>All content is for entertainment purposes.</span></div></footer>
    <AuthDialog />
    <div className="mobile-bottom-nav">{mobileNavigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'mobile-nav-link mobile-nav-link--active' : 'mobile-nav-link'} end={to === '/'}><Icon size={18} /><span>{label}</span></NavLink>)}<button className={menuOpen ? 'mobile-nav-link mobile-nav-link--active mobile-nav-link--menu' : 'mobile-nav-link mobile-nav-link--menu'} type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={18} /><span>Menu</span></button></div>
  </div>;
}

function socialIcon(social: SocialLink) {
  const name = socialIconName(social);
  if (name === 'facebook') return FaFacebookF;
  if (name === 'tiktok') return FaTiktok;
  if (name === 'telegram') return FaTelegram;
  return Send;
}

function socialIconName(social: SocialLink): 'facebook' | 'tiktok' | 'telegram' | 'other' {
  const value = `${social.name} ${social.icon} ${social.url}`.toLowerCase();
  if (value.includes('facebook')) return 'facebook';
  if (value.includes('tiktok') || value.includes('music')) return 'tiktok';
  if (value.includes('telegram') || value.includes('t.me')) return 'telegram';
  return 'other';
}

function NotificationBell() {
  const [feed, setFeed] = useState<TvNotificationFeed>({ notifications: [], unread_count: 0 });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = () => getTvNotifications().then((next) => { if (active) setFeed(next); }).catch(() => { if (active) setFeed({ notifications: [], unread_count: 0 }); });
    refresh();
    const timer = window.setInterval(refresh, 45000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function markRead(notification: UserNotification) {
    if (notification.read_at || busy) return;
    setBusy(true);
    try {
      setFeed(await markTvNotificationRead(notification.id));
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    if (!feed.unread_count || busy) return;
    setBusy(true);
    try {
      setFeed(await markAllTvNotificationsRead());
    } finally {
      setBusy(false);
    }
  }

  return <div className="header-notifications">
    <button className={open ? 'icon-button notification-bell notification-bell--open' : 'icon-button notification-bell'} type="button" aria-label={feed.unread_count ? `${feed.unread_count} unread notifications` : 'Notifications'} aria-expanded={open} aria-controls="header-notification-panel" onClick={() => setOpen((value) => !value)}><Bell size={19} />{feed.unread_count > 0 && <span className="notification-badge" aria-hidden="true">{feed.unread_count > 9 ? '9+' : feed.unread_count}</span>}</button>
    {open && <section className="notification-popover" id="header-notification-panel" aria-label="Notifications"><div className="notification-popover__heading"><div><span className="eyebrow">Your account</span><strong>Notifications</strong></div>{feed.unread_count > 0 && <button type="button" className="notification-mark-all" onClick={markAllRead} disabled={busy}><CheckCheck size={15} />Mark all read</button>}</div><div className="notification-list">{feed.notifications.length ? feed.notifications.map((notification) => <article className={notification.read_at ? 'notification-item' : 'notification-item notification-item--unread'} key={notification.id}><button type="button" className="notification-item__content" onClick={() => markRead(notification)} disabled={busy || Boolean(notification.read_at)}><strong>{notification.title}</strong><p>{notification.message}</p><small>{notification.read_at ? 'Read' : 'New'}</small></button>{notification.link_url && <a href={notification.link_url} target={notification.link_url.startsWith('http') ? '_blank' : undefined} rel={notification.link_url.startsWith('http') ? 'noreferrer' : undefined} onClick={() => markRead(notification)}>Open</a>}</article>) : <p className="notification-empty">You do not have any active notifications.</p>}</div></section>}
  </div>;
}
