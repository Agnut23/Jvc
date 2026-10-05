import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Download, ArrowLeft, Clock } from 'lucide-react';
import infoData from '../data/info.json';
import moviesData from '../data/movies/movies.json';
import Breadcrumb from '../components/Breadcrumb';
import VideoPlayer from '../components/VideoPlayer';
import { PlayerDownloadModal } from '../components/DownloadModal';
import { useUser } from '../context/UserContext';

function importEpisodes(id, season) {
  const map = {
    'solo-leveling-1': () => import('../data/anime/solo-leveling/season-1/episodes.json'),
    'demon-slayer-1': () => import('../data/anime/demon-slayer/season-1/episodes.json'),
    'demon-slayer-2': () => import('../data/anime/demon-slayer/season-2/episodes.json'),
    'death-note-1': () => import('../data/anime/death-note/season-1/episodes.json'),
  };
  return map[`${id}-${season}`]?.() || Promise.resolve({ default: { episodes: [] } });
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Player() {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const season = parseInt(searchParams.get('season') || '1');
  const episodeNum = parseInt(searchParams.get('episode') || '1');
  const isMovie = type === 'movie';

  const { updateProgress, getProgress } = useUser();
  const [episodes, setEpisodes] = useState([]);
  const [showDownload, setShowDownload] = useState(false);
  const [resumeTime, setResumeTime] = useState(null);
  const [seekTo, setSeekTo] = useState(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const progressKey = isMovie ? 'movie' : `s${season}-e${episodeNum}`;
  const dismissTimer = useRef(null);

  const info = isMovie
    ? infoData.movies.find(m => m.id === id)
    : infoData.anime.find(a => a.id === id);

  const movieData = isMovie ? moviesData.movies.find(m => m.id === id) : null;

  const currentEpisode = isMovie ? null : episodes.find(e => e.episodeNumber === episodeNum);
  const videoId = isMovie ? movieData?.youtubeVideoId : currentEpisode?.youtubeVideoId;
  const subtitles = isMovie ? movieData?.subtitles : currentEpisode?.subtitles;

  useEffect(() => {
    if (!isMovie) {
      importEpisodes(id, season).then(m => setEpisodes(m.default?.episodes || []));
    }
  }, [id, season, isMovie]);

  // Check resume history
  useEffect(() => {
    const saved = getProgress(id, progressKey);
    if (saved && saved.progress > 0.05 && saved.currentTime > 10) {
      setResumeTime(saved.currentTime);
      setShowResumeBanner(true);
      dismissTimer.current = setTimeout(() => {
        setShowResumeBanner(false);
      }, 8000);
    }
    return () => clearTimeout(dismissTimer.current);
  }, [id, progressKey]);

  const handleResume = () => {
    setSeekTo(resumeTime);
    setShowResumeBanner(false);
    clearTimeout(dismissTimer.current);
  };

  const handleStartOver = () => {
    setSeekTo(0);
    setShowResumeBanner(false);
    clearTimeout(dismissTimer.current);
  };

  const handleProgress = useCallback((currentTime, duration) => {
    if (duration > 0) {
      updateProgress(id, progressKey, currentTime, duration);
    }
  }, [id, progressKey, updateProgress]);

  if (!info) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Content not found.</div>;

  const breadcrumbs = isMovie
    ? [{ label: 'Home', href: '/' }, { label: 'Movies', href: '/movies' }, { label: info.title, href: `/movie/${id}` }, { label: 'Player' }]
    : [{ label: 'Home', href: '/' }, { label: 'Series', href: '/series' }, { label: info.title, href: `/series/${id}` }, { label: `S${season} E${episodeNum}` }];

  return (
    <div className="page-enter" style={{ width: '100%' }}>
      <Breadcrumb items={breadcrumbs} />

      {/* Resume banner */}
      {showResumeBanner && resumeTime && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: 12, marginBottom: '1rem',
          background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)',
          flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
            <Clock size={16} color="#6C63FF" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Resume from <span style={{ color: '#6C63FF' }}>{formatTime(resumeTime)}</span>?
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleResume} style={{
              padding: '6px 16px', borderRadius: 8, background: '#6C63FF', color: 'white',
              border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            }}>Resume</button>
            <button onClick={handleStartOver} style={{
              padding: '6px 16px', borderRadius: 8, background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            }}>Start Over</button>
          </div>
        </div>
      )}

      {/* Player layout */}
      <div
        className="player-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: !isMovie && episodes.length > 0 ? 'minmax(0, 1fr) 300px' : '1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Player + info */}
        <div style={{ minWidth: 0 }}>
          {videoId ? (
            <VideoPlayer
              videoId={videoId}
              subtitles={subtitles || []}
              onProgress={handleProgress}
              seekTo={seekTo}
            />
          ) : (
            <div style={{
              aspectRatio: '16/9', borderRadius: 12, background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', fontSize: '0.9rem',
            }}>
              Video not available
            </div>
          )}

          {/* Episode title below player */}
          <div style={{ marginTop: '1rem' }}>
            <h1 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', marginBottom: 4 }}>
              {isMovie ? info?.title : `${info?.title} — S${season} E${episodeNum}: ${currentEpisode?.title || ''}`}
            </h1>
            {!isMovie && currentEpisode && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentEpisode.duration}</p>
            )}
            {isMovie && info.duration && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{info.duration}</p>
            )}
          </div>

          {/* Download button below player */}
          <button
            onClick={() => setShowDownload(true)}
            style={{
              marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', cursor: 'pointer', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6C63FF'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <Download size={16} style={{ color: '#6C63FF' }} />
            {isMovie ? 'Download Movie' : 'Download Episode'}
          </button>
        </div>

        {/* Episode sidebar */}
        {!isMovie && episodes.length > 0 && (
          <div style={{ minWidth: 0, maxHeight: '80vh', overflowY: 'auto' }} className="hide-scrollbar">
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Season {season} Episodes
            </div>
            {episodes.map(ep => (
              <Link
                key={ep.episodeNumber}
                to={`/player/anime/${id}?season=${season}&episode=${ep.episodeNumber}`}
                style={{
                  display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 10, marginBottom: 6,
                  background: ep.episodeNumber === episodeNum ? 'rgba(108,99,255,0.15)' : 'var(--bg-card)',
                  border: `1px solid ${ep.episodeNumber === episodeNum ? '#6C63FF' : 'var(--border)'}`,
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (ep.episodeNumber !== episodeNum) { e.currentTarget.style.borderColor = '#6C63FF4A'; e.currentTarget.style.background = 'var(--bg-elevated)'; } }}
                onMouseLeave={e => { if (ep.episodeNumber !== episodeNum) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; } }}
              >
                <img src={ep.thumbnail} alt="" style={{ width: 70, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#6C63FF', fontWeight: 700, marginBottom: 1 }}>EP {ep.episodeNumber}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ep.duration}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showDownload && (
        <PlayerDownloadModal
          episode={currentEpisode}
          isMovie={isMovie}
          movieInfo={info}
          onClose={() => setShowDownload(false)}
        />
      )}
    </div>
  );
}
