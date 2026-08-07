import React, { useState, useEffect, useRef } from 'react';
import { 
  Home as HomeIcon, 
  Film, 
  Tv, 
  BookOpen, 
  Info, 
  Link as LinkIcon, 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  ExternalLink, 
  X
} from 'lucide-react';
import axios from 'axios';

// API Base URL (Hostinger backend API)
const API_BASE = 'https://khaki-yak-457838.hostingersite.com/api';

const GENRES = [
  'All',
  'Action',
  'Comedy',
  'Crime',
  'Drama',
  'Fantasy',
  'History',
  'Horror',
  'Romance',
  'Science',
  'War',
  'Adventure'
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'series' | 'blog' | 'about' | 'links'>('home');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [movies, setMovies] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [socials, setSocials] = useState<any[]>([]);

  const genreScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedGenre]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'home' || activeTab === 'movies') {
        const res = await axios.get(`${API_BASE}/movies`);
        const data = res.data?.data || res.data || [];
        setMovies(Array.isArray(data) ? data : []);
      }
      if (activeTab === 'home' || activeTab === 'series') {
        const res = await axios.get(`${API_BASE}/shows`);
        const data = res.data?.data || res.data || [];
        setShows(Array.isArray(data) ? data : []);
      }
      if (activeTab === 'blog') {
        const res = await axios.get(`${API_BASE}/public/blogs`);
        const data = res.data?.data || res.data || [];
        setBlogs(Array.isArray(data) ? data : []);
      }
      if (activeTab === 'links') {
        const res = await axios.get(`${API_BASE}/socials`);
        const data = res.data?.data || res.data || [];
        setSocials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('API Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollGenres = (direction: 'left' | 'right') => {
    if (genreScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      genreScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredMovies = movies.filter(m => {
    return selectedGenre === 'All' || (m.genre && m.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
  });

  const filteredShows = shows.filter(s => {
    return selectedGenre === 'All' || (s.genre && s.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-24">
      {/* Header Scrollable Genre Tabs (Visible for Movies & Series pages) */}
      {(activeTab === 'movies' || activeTab === 'series' || activeTab === 'home') && (
        <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur border-b border-neutral-900 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center space-x-2">
            <button onClick={() => scrollGenres('left')} className="p-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hidden md:block">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div ref={genreScrollRef} className="flex space-x-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedGenre === genre
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            <button onClick={() => scrollGenres('right')} className="p-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hidden md:block">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-red-600"></div>
          </div>
        )}

        {/* HOME PAGE */}
        {!loading && activeTab === 'home' && (
          <div className="space-y-8">
            {/* Hero Featured Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-neutral-900 to-neutral-800 p-6 md:p-12 shadow-2xl border border-neutral-800">
              <div className="max-w-xl space-y-4">
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider">Trending Now</span>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Yangon TV Ultimate Streaming</h1>
                <p className="text-neutral-400 text-sm md:text-base">Explore thousands of movies, TV series, anime, and exclusive content with high performance streaming.</p>
                <div className="flex space-x-3 pt-2">
                  <button onClick={() => setActiveTab('movies')} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center space-x-2 transition shadow-lg shadow-red-600/30">
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Movies</span>
                  </button>
                  <button onClick={() => setActiveTab('series')} className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl font-semibold transition border border-neutral-700">
                    Browse Series
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Movies Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Featured Movies</h2>
                <button onClick={() => setActiveTab('movies')} className="text-red-500 hover:text-red-400 text-sm font-medium flex items-center">
                  See All <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMovies.slice(0, 10).map((movie) => (
                  <div key={movie.id} onClick={() => setSelectedItem(movie)} className="group cursor-pointer bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-red-600/50 transition duration-300">
                    <div className="aspect-[2/3] relative overflow-hidden bg-neutral-800">
                      <img src={movie.poster || movie.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                        <span className="bg-red-600 text-white p-2 rounded-full shadow-lg"><Play className="w-4 h-4 fill-current" /></span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                      <p className="text-xs text-neutral-400 mt-1">{movie.release_year || '2026'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Series Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Popular Series</h2>
                <button onClick={() => setActiveTab('series')} className="text-red-500 hover:text-red-400 text-sm font-medium flex items-center">
                  See All <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredShows.slice(0, 10).map((show) => (
                  <div key={show.id} onClick={() => setSelectedItem(show)} className="group cursor-pointer bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-red-600/50 transition duration-300">
                    <div className="aspect-[2/3] relative overflow-hidden bg-neutral-800">
                      <img src={show.poster || show.thumbnail || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500'} alt={show.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                        <span className="bg-red-600 text-white p-2 rounded-full shadow-lg"><Play className="w-4 h-4 fill-current" /></span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm truncate">{show.title}</h3>
                      <p className="text-xs text-neutral-400 mt-1">Series • {show.seasons_count || '1'} Season</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MOVIES PAGE */}
        {!loading && activeTab === 'movies' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Movies Library</h1>
              <p className="text-sm text-neutral-400">Showing {selectedGenre} movies</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMovies.map((movie) => (
                <div key={movie.id} onClick={() => setSelectedItem(movie)} className="group cursor-pointer bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-red-600/50 transition duration-300">
                  <div className="aspect-[2/3] relative overflow-hidden bg-neutral-800">
                    <img src={movie.poster || movie.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{movie.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{movie.genre || selectedGenre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERIES PAGE */}
        {!loading && activeTab === 'series' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">TV Series Library</h1>
              <p className="text-sm text-neutral-400">Showing {selectedGenre} series</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredShows.map((show) => (
                <div key={show.id} onClick={() => setSelectedItem(show)} className="group cursor-pointer bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-red-600/50 transition duration-300">
                  <div className="aspect-[2/3] relative overflow-hidden bg-neutral-800">
                    <img src={show.poster || show.thumbnail || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500'} alt={show.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{show.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{show.genre || selectedGenre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOG PAGE */}
        {!loading && activeTab === 'blog' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold">Yangon TV Blog & News</h1>
            <div className="space-y-4">
              {blogs.length === 0 ? (
                <p className="text-neutral-400 text-center py-10">No blog posts available right now.</p>
              ) : (
                blogs.map((blog) => (
                  <div key={blog.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
                    <span className="text-xs text-red-500 font-semibold">{blog.published_at || 'Recent'}</span>
                    <h2 className="text-xl font-bold">{blog.title}</h2>
                    <p className="text-neutral-400 text-sm leading-relaxed">{blog.excerpt || blog.content?.substring(0, 150)}...</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABOUT US PAGE */}
        {!loading && activeTab === 'about' && (
          <div className="max-w-2xl mx-auto space-y-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <h1 className="text-3xl font-extrabold text-red-600">About Yangon TV</h1>
            <p className="text-neutral-300 leading-relaxed">
              Yangon TV is a modern, high-performance streaming platform built to deliver top-tier entertainment experiences. Similar to Netflix, we bring you an extensive collection of movies, TV series, and exclusive content with lightning-fast streaming speeds and seamless navigation across all your devices.
            </p>
            <div className="border-t border-neutral-800 pt-4 text-sm text-neutral-400">
              <p>Powered by Laravel Backend API & React Frontend.</p>
              <p className="mt-1">© 2026 Yangon TV. All rights reserved.</p>
            </div>
          </div>
        )}

        {/* LINKS PAGE (FOLLOW US & CONTACT US) */}
        {!loading && activeTab === 'links' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h1 className="text-2xl font-bold">Connect With Us</h1>
              <p className="text-sm text-neutral-400">Follow our social channels and get in touch with support.</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-red-500">FOLLOW US</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {socials.map((social) => (
                  <a key={social.id} href={social.url || '#'} target="_blank" rel="noopener noreferrer" className="bg-neutral-900 border border-neutral-800 hover:border-red-600/50 p-4 rounded-xl flex items-center justify-between transition">
                    <span className="font-medium">{social.name || 'Social Media'}</span>
                    <ExternalLink className="w-4 h-4 text-neutral-400" />
                  </a>
                ))}
                {socials.length === 0 && (
                  <>
                    <a href="https://facebook.com" target="_blank" rel="noreferrer" className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between hover:border-red-500 transition">
                      <span>Facebook Official</span>
                      <ExternalLink className="w-4 h-4 text-neutral-400" />
                    </a>
                    <a href="https://telegram.org" target="_blank" rel="noreferrer" className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex items-center justify-between hover:border-red-500 transition">
                      <span>Telegram Channel</span>
                      <ExternalLink className="w-4 h-4 text-neutral-400" />
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <h2 className="text-lg font-semibold text-red-500">CONTACT US</h2>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
                <p className="text-sm text-neutral-300">Have questions or partnership inquiries? Drop us a message.</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Your Name" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600" />
                  <input type="email" placeholder="Your Email" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600" />
                  <textarea placeholder="Your Message" rows={4} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"></textarea>
                  <button onClick={() => alert('Message sent successfully!')} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-red-600/30">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-neutral-800 hover:bg-neutral-700 p-2 rounded-full text-white z-10 transition">
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full bg-neutral-800 relative">
              <img src={selectedItem.poster || selectedItem.thumbnail || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800'} alt={selectedItem.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold">{selectedItem.title}</h2>
              <div className="flex items-center space-x-3 text-xs text-neutral-400">
                <span className="bg-red-600/20 text-red-500 font-semibold px-2 py-0.5 rounded">{selectedItem.genre || 'Drama'}</span>
                <span>{selectedItem.release_year || '2026'}</span>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">{selectedItem.description || selectedItem.synopsis || 'No description available for this title.'}</p>
              <button onClick={() => alert('Starting video stream...')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-red-600/30">
                <Play className="w-5 h-5 fill-current" />
                <span>Play Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM STICKY NAVIGATION BAR (WITH PAGE ICONS AS REQUESTED) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-900 py-2 px-4 shadow-2xl">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'home' ? 'text-red-500 font-semibold' : 'text-neutral-400 hover:text-white'}`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('movies')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'movies' ? 'text-red-500 font-semibold' : 'text-neutral-400 hover:text-white'}`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px]">Movies</span>
          </button>

          <button 
            onClick={() => setActiveTab('series')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'series' ? 'text-red-500 font-semibold' : 'text-neutral-400 hover:text-white'}`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-[10px]">Series</span>
          </button>

          <button 
            onClick={() => setActiveTab('blog')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'blog' ? 'text-red-500 font-semibold' : 'text-neutral-400 hover:text-white'}`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px]">Blog</span>
          </button>

          <button 
            onClick={() => setActiveTab('about')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'about' ? 'text-red-500 font-semibold' : 'text-neutral-400 hover:text-white'}`}
          >
            <Info className="w-5 h-5" />
            <span className="text-[10px]">About</span>
          </button>

          <button 
            onClick={() => setActiveTab('links')}
            className={`flex flex-col items-center space-y-1 transition ${activeTab === 'links' ? 'text-red-500 font-semibold' : 'text-neutral-400 hover:text-white'}`}
          >
            <LinkIcon className="w-5 h-5" />
            <span className="text-[10px]">Links</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
