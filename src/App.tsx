import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { Home } from './pages/Home';
import { CatalogPage } from './pages/Catalog';
import { MediaDetail, WatchPage } from './pages/MediaDetail';
import { AboutPage, BlogDetail, BlogPage, ContactPage, LinksPage } from './pages/Editorial';
import { ProfilePage } from './pages/Profile';
import { SubscriptionPage } from './pages/Subscription';
import { PublicProfilePage } from './pages/PublicProfile';
import { AuthForm } from './lib/auth';

export default function App() {
  return <BrowserRouter><Routes><Route element={<AppLayout />}><Route path="/" element={<Home />} /><Route path="/auth" element={<div className="auth-page"><AuthForm /></div>} /><Route path="/movies" element={<CatalogPage kind="movie" />} /><Route path="/movies/:slug" element={<MediaDetail kind="movie" />} /><Route path="/movies/:slug/watch" element={<WatchPage kind="movie" />} /><Route path="/series" element={<CatalogPage kind="series" />} /><Route path="/series/:slug" element={<MediaDetail kind="series" />} /><Route path="/series/:slug/watch" element={<WatchPage kind="series" />} /><Route path="/blog" element={<BlogPage />} /><Route path="/blog/:slug" element={<BlogDetail />} /><Route path="/links" element={<LinksPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/about" element={<AboutPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/profiles/:id" element={<PublicProfilePage />} /><Route path="/subscription" element={<SubscriptionPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes></BrowserRouter>;
}
