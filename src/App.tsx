import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { SiteSeo } from './components/SiteSeo';

const Home = lazy(() => import('./pages/Home').then(({ Home }) => ({ default: Home })));
const CatalogPage = lazy(() => import('./pages/Catalog').then(({ CatalogPage }) => ({ default: CatalogPage })));
const MediaDetail = lazy(() => import('./pages/MediaDetail').then(({ MediaDetail }) => ({ default: MediaDetail })));
const WatchPage = lazy(() => import('./pages/MediaDetail').then(({ WatchPage }) => ({ default: WatchPage })));
const BlogPage = lazy(() => import('./pages/Editorial').then(({ BlogPage }) => ({ default: BlogPage })));
const BlogDetail = lazy(() => import('./pages/Editorial').then(({ BlogDetail }) => ({ default: BlogDetail })));
const ContactPage = lazy(() => import('./pages/Editorial').then(({ ContactPage }) => ({ default: ContactPage })));
const LinksPage = lazy(() => import('./pages/Editorial').then(({ LinksPage }) => ({ default: LinksPage })));
const ProfilePage = lazy(() => import('./pages/Profile').then(({ ProfilePage }) => ({ default: ProfilePage })));
const UserHistoryPage = lazy(() => import('./pages/UserHistory').then(({ UserHistoryPage }) => ({ default: UserHistoryPage })));
const SubscriptionPage = lazy(() => import('./pages/Subscription').then(({ SubscriptionPage }) => ({ default: SubscriptionPage })));
const PublicProfilePage = lazy(() => import('./pages/PublicProfile').then(({ PublicProfilePage }) => ({ default: PublicProfilePage })));
const AuthForm = lazy(() => import('./lib/auth').then(({ AuthForm }) => ({ default: AuthForm })));

function AppLoadingFallback() {
  return <main className="app-loading" aria-live="polite"><span className="app-loading__brand">YANGON <strong>TV</strong></span><span className="app-loading__message">Loading Yangon TV…</span></main>;
}

export default function App() {
  return <BrowserRouter><SiteSeo /><Suspense fallback={<AppLoadingFallback />}><Routes><Route element={<AppLayout />}><Route path="/" element={<Home />} /><Route path="/auth" element={<div className="auth-page"><AuthForm /></div>} /><Route path="/movies" element={<CatalogPage kind="movie" />} /><Route path="/movies/:slug" element={<MediaDetail kind="movie" />} /><Route path="/movies/:slug/watch" element={<WatchPage kind="movie" />} /><Route path="/series" element={<CatalogPage kind="series" />} /><Route path="/series/:slug" element={<MediaDetail kind="series" />} /><Route path="/series/:slug/watch" element={<WatchPage kind="series" />} /><Route path="/blog" element={<BlogPage />} /><Route path="/blog/:postRef/:slug" element={<BlogDetail />} /><Route path="/blog/:slug" element={<BlogDetail />} /><Route path="/links" element={<LinksPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/history" element={<UserHistoryPage />} /><Route path="/profiles/:id" element={<PublicProfilePage />} /><Route path="/subscription" element={<SubscriptionPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></Suspense></BrowserRouter>;
}
