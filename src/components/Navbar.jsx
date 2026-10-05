import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Zap, Flame, Tv, Film, User, Flag, Sun, Moon, Search, Menu, X } from 'lucide-react';
import { SITE } from '../config/site.js';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useDebounce } from '../hooks/useDebounce';
import infoData from '../data/info.json';
import MobileNav from './MobileNav';

const navLinks = [
  { to: '/', label: 'Home', icon: <Home size={17} /> },
  { to: '/new-releases', label: 'New', icon: <Zap size={17} /> },
  { to: '/most-watching', label: 'Popular', icon: <Flame size={17} /> },
  { to: '/series', label: 'Series', icon: <Tv size={17} /> },
  { to: '/movies', label: 'Movies', icon: <Film size={17} /> },
];

const allContent = [...infoData.anime, ...infoData.movies];

export default function Navbar({ onReport }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { watchlist } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [themeRotate, setThemeRotate] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const results = debouncedQuery.length > 1
    ? allContent.filter(item =>
        item.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        item.genre?.some(g => g.toLowerCase().includes(debouncedQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  useEffect(() => {
    if (searchOpen) { inputRef.current?.focus(); setShowResults(true); }
    else { setSearchQuery(''); setShowResults(false); }
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleThemeToggle = () => {
    setThemeRotate(true);
    toggleTheme();
    setTimeout(() => setThemeRotate(false), 400);
  };

  const handleResultClick = (item) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(item.type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 997,
        background: 'rgba(13,13,18,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.3s',
      }}>
        <div className="max-w-screen-2xl mx-auto h-full flex items-center px-4 sm:px-6 lg:px-8" style={{ gap: '0.5rem' }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span className="font-cinzel font-black gradient-text"
              style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', letterSpacing: '-0.02em' }}>
              {SITE.name}
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-0.5 ml-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500,
                  color: location.pathname === link.to ? '#6C63FF' : 'var(--text-secondary)',
                  background: location.pathname === link.to ? 'rgba(108,99,255,0.12)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Right controls */}
          <div className="ml-auto flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              {searchOpen ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search anime, movies..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
                    onKeyDown={handleSearchSubmit}
                    style={{
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: '7px 14px', fontSize: '0.85rem',
                      color: 'var(--text-primary)', outline: 'none',
                      minWidth: 'min(240px, 45vw)', maxWidth: '280px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#6C63FF'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setSearchOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, padding: 6, display: 'flex' }}>
                  <Search size={19} />
                </button>
              )}

              {/* Live results dropdown */}
              {showResults && results.length > 0 && searchOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  minWidth: 300, background: 'rgba(19,19,27,0.98)',
                  border: '1px solid var(--border)', borderRadius: 14,
                  overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)', zIndex: 100,
                  animation: 'slideDown 0.2s ease',
                }}>
                  {results.map(item => (
                    <div key={item.id}
                      onClick={() => handleResultClick(item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <img src={item.coverImage} alt="" style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                          {item.genre?.slice(0, 2).map(g => (
                            <span key={g} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{g}</span>
                          ))}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: item.type === 'movie' ? '#FF6B9D' : '#6C63FF', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0 }}>
                        {item.type}
                      </span>
                    </div>
                  ))}
                  <Link to={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    style={{
                      display: 'block', padding: '10px 14px', textAlign: 'center',
                      fontSize: '0.8rem', color: '#6C63FF', fontWeight: 600,
                    }}>
                    View all results →
                  </Link>
                </div>
              )}
            </div>

            {/* Profile with watchlist badge */}
            <Link to="/profile" style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: 6, color: location.pathname === '/profile' ? '#6C63FF' : 'var(--text-secondary)', borderRadius: 8 }}>
              <User size={19} />
              {watchlist.length > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#FF6B9D', color: 'white',
                  fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {watchlist.length}
                </span>
              )}
            </Link>

            {/* Report */}
            <button onClick={onReport} className="hidden lg:flex" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, padding: 6 }}>
              <Flag size={19} />
            </button>

            {/* Theme toggle */}
            <button onClick={handleThemeToggle} style={{
              background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 6,
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
              transform: themeRotate ? 'rotate(360deg)' : 'rotate(0deg)',
              transition: 'transform 0.4s ease',
            }}>
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Hamburger */}
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, padding: 6, display: 'flex' }}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} onReport={onReport} />
    </>
  );
}
