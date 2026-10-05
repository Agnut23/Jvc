import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Play, Download, Check } from 'lucide-react';
import infoData from '../data/info.json';
import Breadcrumb from '../components/Breadcrumb';
import { SeriesDownloadModal } from '../components/DownloadModal';
import { useUser } from '../context/UserContext';

function importSeasons(id) {
  const map = {
    'solo-leveling': () => import('../data/anime/solo-leveling/seasons.json'),
    'demon-slayer': () => import('../data/anime/demon-slayer/seasons.json'),
    'death-note':    () => import('../data/anime/death-note/seasons.json'),
  };
  return map[id]?.() || Promise.resolve({ default: { seasons: [] } });
}

function importEpisodes(id, season) {
  const map = {
    'solo-leveling-1': () => import('../data/anime/solo-leveling/season-1/episodes.json'),
    'demon-slayer-1': () => import('../data/anime/demon-slayer/season-1/episodes.json'),
     'demon-slayer-2': () => import('../data/anime/demon-slayer/season-2/episodes.json'),
    'death-note-1':    () => import('../data/anime/death-note/season-1/episodes.json'),
  };
  return map[`${id}-${season}`]?.() || Promise.resolve({ default: { episodes: [] } });
}

export default function SeriesDetail() {
  const { id } = useParams();
  const item = infoData.anime.find(a => a.id === id);
  const { history } = useUser();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    importSeasons(id).then(m => setSeasons(m.default?.seasons || []));
  }, [id]);

  useEffect(() => {
    importEpisodes(id, selectedSeason).then(m => setEpisodes(m.default?.episodes || []));
  }, [id, selectedSeason]);

  if (!item) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Series not found.</div>;

  const getEpProgress = (epNum) => {
    const key = `s${selectedSeason}-e${epNum}`;
    return history?.[id]?.[key] || null;
  };

  return (
    <div className="page-enter">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Series', href: '/series' }, { label: item.title }]} />

      {/* Banner */}
      <div style={{
        position: 'relative', width: '100%', borderRadius: '1rem', overflow: 'hidden', marginBottom: '2rem',
        aspectRatio: window.innerWidth < 768 ? '16/9' : '21/9', maxHeight: 420,
      }}>
        <img src={item.bannerImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,18,1) 0%, rgba(13,13,18,0.3) 70%, transparent 100%)' }} />
      </div>

      {/* Info section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Poster */}
          <img
            src={item.coverImage}
            alt={item.title}
            style={{
              width: 'clamp(100px, 18vw, 180px)', aspectRatio: '2/3', objectFit: 'cover',
              borderRadius: 12, flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          />
          {/* Text info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              {item.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={14} fill="#FFD166" color="#FFD166" />
                <span style={{ color: '#FFD166', fontWeight: 700, fontSize: '0.9rem' }}>{item.rating}</span>
              </div>
              <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.3)' }}>
                {item.status}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.releaseYear}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.ageRating}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
              {item.genre?.map(g => (
                <span key={g} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{g}</span>
              ))}
            </div>

            {item.studio && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1rem' }}>Studio: <span style={{ color: 'var(--text-secondary)' }}>{item.studio}</span></p>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to={`/player/anime/${id}?season=1&episode=1`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
                color: 'white', borderRadius: 12, fontWeight: 700, padding: '10px 22px',
                fontSize: '0.9rem', textDecoration: 'none',
              }}>
                <Play size={16} fill="white" /> Watch Now
              </Link>
              <button onClick={() => setShowDownload(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', borderRadius: 12, fontWeight: 600, padding: '10px 20px',
                fontSize: '0.9rem', cursor: 'pointer',
              }}>
                <Download size={16} color="#6C63FF" /> Download
              </button>
            </div>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)', lineHeight: 1.7 }}>
          {item.description}
        </p>
      </div>

      {/* Season tabs */}
      {seasons.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {seasons.map(s => (
            <button key={s.seasonNumber}
              onClick={() => setSelectedSeason(s.seasonNumber)}
              style={{
                flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: selectedSeason === s.seasonNumber ? 'none' : '1px solid var(--border)',
                background: selectedSeason === s.seasonNumber ? 'linear-gradient(135deg, #6C63FF, #FF6B9D)' : 'var(--bg-elevated)',
                color: selectedSeason === s.seasonNumber ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>
              {s.title || `Season ${s.seasonNumber}`}
            </button>
          ))}
        </div>
      )}

      {/* Episode grid */}
      {episodes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '0.75rem' }}>
          {episodes.map(ep => {
            const progress = getEpProgress(ep.episodeNumber);
            const pct = (progress?.progress || 0) * 100;
            const watched = pct > 90;
            return (
              <Link
                key={ep.episodeNumber}
                to={`/player/anime/${id}?season=${selectedSeason}&episode=${ep.episodeNumber}`}
                style={{
                  display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 12,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  textDecoration: 'none', transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
              >
                <div style={{ position: 'relative', flexShrink: 0, width: 100, aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={ep.thumbnail} alt={ep.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  {watched && (
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color="white" />
                    </div>
                  )}
                  {pct > 0 && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6C63FF, #FF6B9D)' }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6C63FF', marginBottom: 2 }}>EP: {ep.episodeNumber}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{ep.duration}</div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Episodes for this season coming soon.
        </div>
      )}

      {showDownload && (
        <SeriesDownloadModal
          animeInfo={item}
          episodes={episodes}
          season={selectedSeason}
          onClose={() => setShowDownload(false)}
        />
      )}
    </div>
  );
}
