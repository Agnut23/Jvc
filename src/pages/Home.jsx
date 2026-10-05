import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, Zap, Flame, Tv, Film, Home as HomeIcon, X, Clock } from 'lucide-react';
import infoData from '../data/info.json';
import Segment from '../components/Segment';
import ContentCard from '../components/ContentCard';
import { useUser } from '../context/UserContext';

const allContent = [...infoData.anime, ...infoData.movies];

// Returns a random subset of `count` items from `arr` — different every page load
function randomPick(arr, count) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function HeroCarousel() {
  const [slides] = useState(() => randomPick(allContent, 6));
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next');
  const autoTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const goTo = useCallback((index, dir = 'next') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 350);
  }, [animating]);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length, 'next');
  }, [current, slides.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + slides.length) % slides.length, 'prev');
  }, [current, slides.length, goTo]);

  useEffect(() => {
    autoTimer.current = setInterval(next, 6000);
    return () => clearInterval(autoTimer.current);
  }, [next]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchStartX.current = null; touchEndX.current = null;
    clearInterval(autoTimer.current);
  };

  const item = slides[current];
  if (!item) return null;
  const href = item.type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`;
  const watchHref = item.type === 'movie'
    ? `/player/movie/${item.id}`
    : `/player/anime/${item.id}?season=1&episode=1`;

  return (
    <div
      className="relative w-full overflow-hidden mb-8 md:mb-10 select-none"
      style={{ borderRadius: '1rem', minHeight: 'clamp(260px, 45vw, 520px)', maxHeight: 520, cursor: 'grab' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slide image */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: animating ? 0 : 1,
        transform: animating ? `translateX(${direction === 'next' ? '-3%' : '3%'})` : 'translateX(0)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}>
        <img
          src={item.bannerImage || item.coverImage}
          alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(13,13,18,1) 0%, rgba(13,13,18,0.7) 45%, rgba(13,13,18,0.15) 100%)',
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'flex-end',
        height: '100%', minHeight: 'clamp(260px, 45vw, 520px)',
        padding: 'clamp(20px, 4vw, 48px)',
        opacity: animating ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}>
        <div style={{ maxWidth: '38rem', width: '100%' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: item.type === 'movie' ? 'rgba(255,107,157,0.2)' : 'rgba(108,99,255,0.2)',
            border: `1px solid ${item.type === 'movie' ? 'rgba(255,107,157,0.4)' : 'rgba(108,99,255,0.4)'}`,
            color: item.type === 'movie' ? '#FF6B9D' : '#6C63FF',
            borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, marginBottom: 10,
          }}>
            {item.type === 'movie' ? ' Movie' : ' Anime'} • {item.releaseYear}
          </div>

          <h1 style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 900, color: '#F0F0FF',
            fontSize: 'clamp(1.4rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: '0.5rem',
          }}>
            {item.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={13} fill="#FFD166" color="#FFD166" />
              <span style={{ color: '#FFD166', fontSize: 13, fontWeight: 700 }}>{item.rating}</span>
            </div>
            {item.genre?.slice(0, 2).map(g => (
              <span key={g} style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: '#8888AA' }}>{g}</span>
            ))}
          </div>

          <p style={{
            color: '#8888AA', fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)', marginBottom: '1.2rem', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {item.description}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to={watchHref} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
              color: 'white', borderRadius: 12, fontWeight: 700,
              padding: 'clamp(8px, 1.5vw, 12px) clamp(18px, 3vw, 28px)',
              fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)', textDecoration: 'none',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Play size={14} fill="white" /> Watch Now
            </Link>
            <Link to={href} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#F0F0FF', borderRadius: 12, fontWeight: 700,
              padding: 'clamp(8px, 1.5vw, 12px) clamp(18px, 3vw, 28px)',
              fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)', textDecoration: 'none',
            }}>
              More Info
            </Link>
          </div>
        </div>
      </div>

      {/* Left arrow */}
      <button onClick={() => { prev(); clearInterval(autoTimer.current); }}
        style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, background: 'rgba(13,13,18,0.6)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.7)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,13,18,0.6)'}
        aria-label="Previous"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
      </button>

      {/* Right arrow */}
      <button onClick={() => { next(); clearInterval(autoTimer.current); }}
        style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, background: 'rgba(13,13,18,0.6)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.7)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,13,18,0.6)'}
        aria-label="Next"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      {/* Dot indicators */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, display: 'flex', gap: 6, alignItems: 'center',
      }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i, i > current ? 'next' : 'prev')}
            style={{
              width: i === current ? 24 : 8, height: 8, borderRadius: 4,
              background: i === current ? 'linear-gradient(90deg, #6C63FF, #FF6B9D)' : 'rgba(255,255,255,0.3)',
              border: 'none', cursor: 'pointer', transition: 'width 0.3s ease, background 0.3s ease', padding: 0,
            }} aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 20,
        background: 'rgba(13,13,18,0.7)', backdropFilter: 'blur(8px)',
        borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: '#8888AA',
      }}>
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}

function ContinueWatching() {
  const { history, removeHistory } = useUser();
  const entries = [];

  Object.entries(history).forEach(([id, keys]) => {
    Object.entries(keys).forEach(([key, data]) => {
      const item = allContent.find(c => c.id === id);
      if (item && data.progress > 0.05) {
        entries.push({ item, id, key, ...data });
      }
    });
  });

  entries.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));

  if (entries.length === 0) return null;

  return (
    <Segment title="Continue Watching" icon={<Clock size={18} />}>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }} className="hide-scrollbar">
        {entries.slice(0, 8).map(entry => {
          const href = entry.item.type === 'movie'
            ? `/player/movie/${entry.id}`
            : `/player/anime/${entry.id}?season=${entry.key.split('-')[0]?.replace('s', '')}&episode=${entry.key.split('-')[1]?.replace('e', '')}`;

          return (
            <div key={`${entry.id}-${entry.key}`} style={{ position: 'relative', flexShrink: 0, width: 160 }}>
              <Link to={href} style={{ display: 'block', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-card)' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                  <img src={entry.item.bannerImage || entry.item.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
                    <div style={{ height: '100%', width: `${entry.progress * 100}%`, background: 'linear-gradient(90deg, #6C63FF, #FF6B9D)' }} />
                  </div>
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.item.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{Math.round(entry.progress * 100)}% watched</div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); removeHistory(entry.id, entry.key); }}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(13,13,18,0.8)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Remove from continue watching"
              >
                <X size={12} color="white" />
              </button>
            </div>
          );
        })}
      </div>
    </Segment>
  );
}

export default function Home() {
  // Each section shows up to 6 randomly picked items, reshuffled on every page load
  const recommended  = useState(() => randomPick(allContent, 6))[0];
  const newReleases  = useState(() => randomPick(allContent.filter(i => i.isNewRelease), 6))[0];
  const mostWatching = useState(() => randomPick(allContent.filter(i => i.isMostWatching), 6))[0];
  const animeList    = useState(() => randomPick(infoData.anime, 6))[0];
  const movieList    = useState(() => randomPick(infoData.movies, 6))[0];

  return (
    <div className="page-enter">
      <HeroCarousel />
      <ContinueWatching />

      {/* Featured — random mix of all content */}
      <Segment title="Featured" icon={<Zap size={18} />}>
        <div className="card-grid">
          {recommended.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      </Segment>

      <Segment title="New Releases" icon={<Flame size={18} />} viewAllLink="/new-releases">
        <div className="card-grid">
          {newReleases.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      </Segment>

      <Segment title="Popular" icon={<Flame size={18} />} viewAllLink="/most-watching">
        <div className="card-grid">
          {mostWatching.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      </Segment>

      <Segment title="Anime Series" icon={<Tv size={18} />} viewAllLink="/series">
        <div className="card-grid">
          {animeList.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      </Segment>

      <Segment title="Movies" icon={<Film size={18} />} viewAllLink="/movies">
        <div className="card-grid">
          {movieList.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      </Segment>
    </div>
  );
}
