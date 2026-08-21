import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Clapperboard, Crown, Facebook, Film, Home, Info, Mail, Menu, Music2, Newspaper, Search, Send, UserRound, X } from 'lucide-react';
import { Logo } from '../components/ui/Primitives';
import { getSocials } from '../lib/api';
import { AuthDialog, useAuth } from '../lib/auth';
import type { SocialLink } from '../lib/types';

const navigation = [
  { label: 'Premium', to: '/subscription', icon: Crown },
  { label: 'Contact Us', to: '/contact', icon: Mail },
  { label: 'About Us', to: '/about', icon: Info },
];

const mobileNavigation = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Movies', to: '/movies', icon: Film },
  { label: 'Series', to: '/series', icon: Clapperboard },
  { label: 'Blog', to: '/blog', icon: Newspaper },
];

export function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const { user } = useAuth();
  const isHomePage = location.pathname === '/';
  const accountLabel = user ? (user.name?.trim() || user.email?.split('@')[0] || 'Account') : 'Sign In / Sign Up';
  const drawerSocials = socials.filter((social) => /facebook|tiktok|music|telegram|send/i.test(`${social.name} ${social.icon} ${social.url}`));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    getSocials().then((items) => { if (active) setSocials(items.filter((item) => item.is_active !== false)); }).catch(() => { if (active) setSocials([]); });
    return () => { active = false; };
  }, []);


  return <div className="app-shell">
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="Primary navigation">
          <NavLink to={user ? '/profile' : '/auth'} className={({ isActive }) => isActive ? 'nav-link nav-link--account nav-link--active' : 'nav-link nav-link--account'}><UserRound size={16} />{accountLabel}</NavLink>
          {navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link nav-link--menu nav-link--active' : 'nav-link nav-link--menu'}><Icon size={16} />{label}</NavLink>)}
        </nav>
        <div className="header-actions"><Link to="/movies" className="icon-button" aria-label="Search movies"><Search size={19} /></Link></div>
      </div>
    </header>
    {menuOpen && <><button className="drawer-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} /><aside className="mobile-drawer" aria-label="Website menu"><div className="mobile-drawer__top"><span className="profile-card-label">Welcome To Yangon TV</span><button className="icon-button" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu"><X size={20} /></button></div><nav className="mobile-drawer__nav"><NavLink to={user ? '/profile' : '/auth'} className={({ isActive }) => isActive ? 'mobile-drawer__link mobile-drawer__account mobile-drawer__link--active' : 'mobile-drawer__link mobile-drawer__account'}><UserRound size={18} />{accountLabel}</NavLink>{navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'mobile-drawer__link mobile-drawer__link--active' : 'mobile-drawer__link'}><Icon size={18} />{label}</NavLink>)}</nav>{drawerSocials.length > 0 && <div className="mobile-drawer__socials"><span className="profile-card-label">Follow Yangon TV</span>{drawerSocials.map((social) => { const Icon = socialIcon(social); return <a className="mobile-drawer__social" href={social.url} key={social.id} target="_blank" rel="noopener noreferrer"><Icon size={17} /><span>{social.name}</span></a>; })}</div>}</aside></>}
    <main><Outlet /></main>
    <footer className={`site-footer ${isHomePage ? 'site-footer--minimal' : ''}`}>{!isHomePage && <div className="container footer-grid"><div><Logo /><p className="footer-copy">Stories worth staying up for. Discover movies, series, recaps, and the people behind them.</p></div><div><span className="footer-label">Explore</span><Link to="/movies">Movies</Link><Link to="/series">Series</Link><Link to="/blog">Blog</Link></div><div><span className="footer-label">Yangon TV</span><Link to="/about">About us</Link><Link to="/links">Useful links</Link><a href="mailto:hello@yangontv.com">Contact</a></div></div>}<div className="container footer-bottom"><span>© 2026 Yangon TV. Made for Myanmar audiences.</span><span>All content is for entertainment purposes.</span></div></footer>
    <AuthDialog />
    <div className="mobile-bottom-nav">{mobileNavigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'mobile-nav-link mobile-nav-link--active' : 'mobile-nav-link'} end={to === '/'}><Icon size={18} /><span>{label}</span></NavLink>)}<button className={menuOpen ? 'mobile-nav-link mobile-nav-link--active mobile-nav-link--menu' : 'mobile-nav-link mobile-nav-link--menu'} type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={18} /><span>Menu</span></button></div>
  </div>;
}

function socialIcon(social: SocialLink) {
  const value = `${social.name} ${social.icon} ${social.url}`.toLowerCase();
  if (value.includes('facebook')) return Facebook;
  if (value.includes('tiktok') || value.includes('music')) return Music2;
  return Send;
}
