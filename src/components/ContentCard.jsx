import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';

export default function ContentCard({ item }) {
  const { toggleWatchlist, isInWatchlist, history } = useUser();
  const { addToast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const href = item.type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`;
  const inWatchlist = isInWatchlist(item.id);

  // Get progress
  let progressPct = 0;
  if (item.type === 'anime' && history?.[item.id]) {
    const keys = Object.keys(history[item.id]);
    if (keys.length > 0) {
      const last = history[item.id][keys[keys.length - 1]];
      progressPct = (last?.progress || 0) * 100;
    }
  } else if (item.type === 'movie' && history?.[item.id]?.movie) {
    progressPct = (history[item.id].movie.progress || 0) * 100;
  }

  const handleWatchlist = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(item);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 600);
    addToast(
      isInWatchlist(item.id) ? `Removed from watchlist` : `Added to watchlist`,
      isInWatchlist(item.id) ? 'info' : 'success'
    );
  }, [item, toggleWatchlist, isInWatchlist, addToast]);

  return (
    <Link
      to={href}
      className="content-card block rounded-xl overflow-hidden cursor-pointer relative group"
      style={{ background: 'var(--bg-card)', display: 'block', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
    >
      {/* Poster area */}
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: '#1C1C28' }}>
        {!imgError ? (
          <img
            src={item.coverImage}
            alt={item.title}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1C1C28, #272738)', color: '#55556A', fontSize: 12,
          }}>
            {item.title}
          </div>
        )}

        {/* Status badge */}
        {item.isNewRelease && (
          <div style={{
            position: 'absolute', top: 6, left: 6, zIndex: 15,
            background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
            color: 'white', fontSize: 9, fontWeight: 700,
            padding: '2px 8px', borderRadius: 20, letterSpacing: '0.05em',
          }}>
            NEW
          </div>
        )}

        {/* Heart / watchlist button */}
        <button
          onClick={handleWatchlist}
          style={{
            position: 'absolute', top: 6, right: 6, zIndex: 15,
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(13,13,18,0.7)',
            border: `1px solid ${inWatchlist ? '#FF6B9D' : 'rgba(255,255,255,0.15)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(8px)',
            transform: heartAnim ? 'scale(1.3)' : 'scale(1)',
            transition: 'transform 0.3s ease, border-color 0.2s',
          }}
          aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Heart
            size={13}
            color={inWatchlist ? '#FF6B9D' : '#8888AA'}
            fill={inWatchlist ? '#FF6B9D' : 'none'}
          />
        </button>

        {/* Progress bar */}
        {progressPct > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
            background: 'rgba(255,255,255,0.15)', zIndex: 25,
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6C63FF, #FF6B9D)',
              borderRadius: '0 2px 2px 0',
            }} />
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-2.5">
        <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)', fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}>
          {item.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <div className="flex items-center gap-0.5">
            <Star size={10} fill="#FFD166" color="#FFD166" />
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{item.rating}</span>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.releaseYear}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5" style={{ maxHeight: 32, overflow: 'hidden' }}>
          {item.genre?.slice(0, 2).map(g => (
            <span key={g} style={{
              fontSize: 10, padding: '1px 7px', borderRadius: 20,
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', whiteSpace: 'nowrap',
            }}>
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
