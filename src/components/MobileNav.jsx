import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Zap, Flame, Tv, Film, User, Flag, X, Sun, Moon } from 'lucide-react';
import { SITE } from '../config/site.js';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { to: '/', label: 'Home', icon: <Home size={20} /> },
  { to: '/new-releases', label: 'New Releases', icon: <Zap size={20} /> },
  { to: '/most-watching', label: 'Popular', icon: <Flame size={20} /> },
  { to: '/series', label: 'Series', icon: <Tv size={20} /> },
  { to: '/movies', label: 'Movies', icon: <Film size={20} /> },
  { to: '/profile', label: 'Profile', icon: <User size={20} /> },
];

export default function MobileNav({ open, onClose, onReport }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 999,
        width: 280, maxWidth: '85vw',
        background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontFamily: 'Cinzel, serif', fontWeight: 900,
            fontSize: '1.3rem',
            background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {SITE.name}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: 8, padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {/* Links */}
        <nav style={{ flex: 1, padding: '0.75rem 0.75rem' }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px', borderRadius: 12,
                fontSize: '1rem', fontWeight: 500,
                color: location.pathname === link.to ? '#6C63FF' : 'var(--text-primary)',
                background: location.pathname === link.to ? 'rgba(108,99,255,0.12)' : 'transparent',
                minHeight: 48, transition: 'background 0.2s',
                textDecoration: 'none', marginBottom: 4,
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          {/* Report */}
          <button
            onClick={() => { onClose(); onReport(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px', borderRadius: 12,
              fontSize: '1rem', fontWeight: 500,
              color: 'var(--text-primary)', background: 'transparent',
              minHeight: 48, width: '100%', border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'background 0.2s', marginBottom: 4,
            }}
          >
            <Flag size={20} />
            Report / Contact
          </button>
        </nav>

        {/* Theme toggle */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12, width: '100%',
              background: 'var(--bg-elevated)', border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem', fontWeight: 500,
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
            {SITE.tagline}
          </p>
        </div>
      </div>
    </>
  );
}
