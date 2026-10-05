import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Play, Download } from 'lucide-react';
import infoData from '../data/info.json';
import Breadcrumb from '../components/Breadcrumb';
import { MovieDownloadModal } from '../components/DownloadModal';

export default function MovieDetail() {
  const { id } = useParams();
  const item = infoData.movies.find(m => m.id === id);
  const [showDownload, setShowDownload] = useState(false);

  if (!item) return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Movie not found.</div>;

  return (
    <div className="page-enter">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Movies', href: '/movies' }, { label: item.title }]} />

      {/* Banner */}
      <div style={{
        position: 'relative', width: '100%', borderRadius: '1rem', overflow: 'hidden', marginBottom: '2rem',
        aspectRatio: window.innerWidth < 768 ? '16/9' : '21/9', maxHeight: 420,
      }}>
        <img src={item.bannerImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,18,1) 0%, rgba(13,13,18,0.3) 70%, transparent 100%)' }} />
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', alignItems: 'flex-start' }}>
          <img
            src={item.coverImage}
            alt={item.title}
            style={{
              width: 'clamp(100px, 18vw, 180px)', aspectRatio: '2/3', objectFit: 'cover',
              borderRadius: 12, flexShrink: 0, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)', lineHeight: 1.2, marginBottom: '0.5rem' }}>
              {item.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={14} fill="#FFD166" color="#FFD166" />
                <span style={{ color: '#FFD166', fontWeight: 700, fontSize: '0.9rem' }}>{item.rating}</span>
              </div>
              <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 20, background: 'rgba(255,107,157,0.15)', color: '#FF6B9D', border: '1px solid rgba(255,107,157,0.3)' }}>
                {item.status}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.releaseYear}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.duration}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.ageRating}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '0.75rem' }}>
              {item.genre?.map(g => (
                <span key={g} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{g}</span>
              ))}
            </div>

            {item.director && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1rem' }}>Director: <span style={{ color: 'var(--text-secondary)' }}>{item.director}</span></p>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to={`/player/movie/${id}`} style={{
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

      {showDownload && <MovieDownloadModal movieInfo={item} onClose={() => setShowDownload(false)} />}
    </div>
  );
}
