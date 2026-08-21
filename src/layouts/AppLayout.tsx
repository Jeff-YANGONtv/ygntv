import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Clapperboard, Crown, Film, Home, Info, Link2, Menu, Newspaper, Search, UserRound, X } from 'lucide-react';
import { Logo } from '../components/ui/Primitives';
import { AuthDialog, useAuth } from '../lib/auth';

const navigation = [
  { label: 'Premium', to: '/subscription', icon: Crown },
  { label: 'Links', to: '/links', icon: Link2 },
  { label: 'About Us', to: '/about', icon: Info },
];

const mobileNavigation = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Movies', to: '/movies', icon: Film },
  { label: 'Series', to: '/series', icon: Clapperboard },
  { label: 'Blog', to: '/blog', icon: Newspaper },
  { label: 'About Us', to: '/about', icon: Info },
];

export function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, [location.pathname]);


  return <div className="app-shell">
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="Primary navigation">
          <NavLink to={user ? '/profile' : '/auth'} className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}><UserRound size={16} />{user ? 'User Profile' : 'Sign In / Sign Up'}</NavLink>
          {navigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}><Icon size={16} />{label}</NavLink>)}
        </nav>
        <div className="header-actions"><Link to="/movies" className="icon-button" aria-label="Search movies"><Search size={19} /></Link><button className="icon-button menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation menu" aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
      </div>
    </header>
    <main><Outlet /></main>
    <footer className={`site-footer ${isHomePage ? 'site-footer--minimal' : ''}`}>{!isHomePage && <div className="container footer-grid"><div><Logo /><p className="footer-copy">Stories worth staying up for. Discover movies, series, recaps, and the people behind them.</p></div><div><span className="footer-label">Explore</span><Link to="/movies">Movies</Link><Link to="/series">Series</Link><Link to="/blog">Blog</Link></div><div><span className="footer-label">Yangon TV</span><Link to="/about">About us</Link><Link to="/links">Useful links</Link><a href="mailto:hello@yangontv.com">Contact</a></div></div>}<div className="container footer-bottom"><span>© 2026 Yangon TV. Made for Myanmar audiences.</span><span>All content is for entertainment purposes.</span></div></footer>
    <AuthDialog />
    <div className="mobile-bottom-nav">{mobileNavigation.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'mobile-nav-link mobile-nav-link--active' : 'mobile-nav-link'} end={to === '/'}><Icon size={18} /><span>{label}</span></NavLink>)}</div>
  </div>;
}
