import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Heart, Clock, Star } from 'lucide-react';
import { useUser } from '../context/UserContext';
import ContentCard from '../components/ContentCard';
import infoData from '../data/info.json';

const allContent = [...infoData.anime, ...infoData.movies];

export default function Profile() {
  const { watchlist, history, removeHistory } = useUser();
  const [tab, setTab] = useState('watchlist');

  const historyEntries = [];
  Object.entries(history).forEach(([id, keys]) => {
    Object.entries(keys).forEach(([key, data]) => {
      const item = allContent.find(c => c.id === id);
      if (item) historyEntries.push({ item, id, key, ...data });
    });
  });
  historyEntries.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));

  const tabs = [
    { id: 'watchlist', label: 'Watchlist', icon: <Heart size={16} /> },
    { id: 'history', label: 'History', icon: <Clock size={16} /> },
  ];

  return (
    <div className="page-enter">
      {/* Profile header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.25rem',
        padding: '1.5rem', borderRadius: 16, background: 'var(--bg-card)',
        border: '1px solid var(--border)', marginBottom: '2rem',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <User size={28} color="white" />
        </div>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Guest User</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
            {watchlist.length} in watchlist • {historyEntries.length} watched
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', overflowX: 'auto' }} className="hide-scrollbar">
        {tabs.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 20, fontSize: '0.875rem', fontWeight: 600,
              border: tab === t.id ? 'none' : '1px solid var(--border)',
              background: tab === t.id ? 'linear-gradient(135deg, #6C63FF, #FF6B9D)' : 'var(--bg-elevated)',
              color: tab === t.id ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Watchlist */}
      {tab === 'watchlist' && (
        watchlist.length > 0 ? (
          <div className="card-grid">
            {watchlist.map(item => <ContentCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <Heart size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Your watchlist is empty</h2>
            <p>Click the heart icon on any title to add it here.</p>
          </div>
        )
      )}

      {/* Watch History */}
      {tab === 'history' && (
        historyEntries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historyEntries.map(entry => {
              const href = entry.item.type === 'movie'
                ? `/player/movie/${entry.id}`
                : `/player/anime/${entry.id}?season=${entry.key.split('-')[0]?.replace('s', '') || 1}&episode=${entry.key.split('-')[1]?.replace('e', '') || 1}`;
              return (
                <div key={`${entry.id}-${entry.key}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)',
                }}>
                  <img src={entry.item.coverImage} alt="" style={{ width: 50, height: 75, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 2 }}>{entry.item.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {entry.key === 'movie' ? 'Movie' : `S${entry.key.split('-')[0]?.replace('s', '')} E${entry.key.split('-')[1]?.replace('e', '')}`} • {Math.round(entry.progress * 100)}% watched
                    </div>
                    <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${entry.progress * 100}%`, background: 'linear-gradient(90deg, #6C63FF, #FF6B9D)', borderRadius: 2 }} />
                    </div>
                  </div>
                  <Link to={href} style={{
                    padding: '8px 16px', borderRadius: 8, background: '#6C63FF', color: 'white',
                    fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', flexShrink: 0,
                  }}>
                    Continue
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <Clock size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No watch history yet</h2>
            <p>Start watching something to see it here.</p>
          </div>
        )
      )}
    </div>
  );
}
