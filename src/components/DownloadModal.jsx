import { useState } from 'react';
import { X, Download, Check, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const safeName = (str = '') => String(str).replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const linkOrNA = (v) => (v && v !== '#' ? v : 'Not available');

async function createEpisodeZip(episode, type = 'dubbed') {
  const zip = new JSZip();
  const title = safeName(episode.title);
  const folder = zip.folder(`EP${episode.episodeNumber}_${title}`);

  const subUrl = episode.subtitles?.[0]?.url;
  if (subUrl && subUrl !== '#') {
    try {
      const r = await fetch(subUrl);
      if (r.ok) folder.file('subtitle_EN.vtt', await r.blob());
    } catch {}
  }

  const links = episode.downloadLinks || {};
  folder.file('README.txt',
    `EP${episode.episodeNumber} — ${episode.title}\n` +
    `Type: ${type === 'dubbed' ? 'Dubbed' : 'Subbed'}\n` +
    `Duration: ${episode.duration}\n` +
    `Source: Anijelia — Your World of Anime & Cinema\n\n` +
    `Video (1080p): ${linkOrNA(links.dubbed_1080p)}\n` +
    `Video (720p): ${linkOrNA(links.dubbed_720p)}`
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `Anijelia_EP${episode.episodeNumber}_${title}_${type}.zip`);
}

async function createMultiEpisodeZip(episodes, animeTitle, season) {
  const zip = new JSZip();
  const mainFolder = zip.folder(`Anijelia_${safeName(animeTitle)}_S${season}`);

  for (const ep of episodes) {
    const links = ep.downloadLinks || {};
    const epFolder = mainFolder.folder(`EP${String(ep.episodeNumber).padStart(2, '0')}_${safeName(ep.title)}`);
    epFolder.file('README.txt',
      `EP${ep.episodeNumber} — ${ep.title}\n` +
      `Duration: ${ep.duration}\n` +
      `Source: Anijelia — Your World of Anime & Cinema\n\n` +
      `Video (1080p): ${linkOrNA(links.dubbed_1080p)}\n` +
      `Video (720p): ${linkOrNA(links.dubbed_720p)}`
    );
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `Anijelia_${safeName(animeTitle)}_S${season}.zip`);
}

// Single episode download (from player)
export function PlayerDownloadModal({ episode, isMovie, movieInfo, onClose }) {
  const [state, setState] = useState('idle'); // idle | loading | done
  const [type, setType] = useState(null);

  const handleDownload = async (dlType) => {
    setState('loading');
    setType(dlType);
    try {
      if (isMovie) {
        const zip = new JSZip();
        zip.file('README.txt',
          `${movieInfo?.title}\nType: ${dlType}\nSource: Anijelia — Your World of Anime & Cinema`
        );
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `Anijelia_${safeName(movieInfo?.title || 'Movie')}_${dlType}.zip`);
      } else {
        await createEpisodeZip(episode, dlType);
      }
      setState('done');
      setTimeout(() => { setState('idle'); setType(null); }, 2000);
    } catch {
      setState('idle');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '1.5rem', maxWidth: 400, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
            {isMovie ? `Download Movie` : `Download EP${episode?.episodeNumber} — ${episode?.title}`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['dubbed', 'subbed'].map(dlType => (
            <button
              key={dlType}
              onClick={() => handleDownload(dlType)}
              disabled={state === 'loading'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: 12,
                border: `1px solid ${state === 'done' && type === dlType ? '#22c55e' : 'var(--border)'}`,
                background: state === 'done' && type === dlType ? 'rgba(34,197,94,0.1)' : 'var(--bg-elevated)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {dlType === 'dubbed' ? 'Download Dubbed' : 'Download with Subtitles'}
                </div>
                
              </div>
              {state === 'loading' && type === dlType ? (
                <Loader2 size={18} color="#6C63FF" className="animate-spin" />
              ) : state === 'done' && type === dlType ? (
                <Check size={18} color="#22c55e" />
              ) : (
                <Download size={18} color="#6C63FF" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pre-watch multi-episode download modal (series detail page)
export function SeriesDownloadModal({ animeInfo, episodes, season = 1, onClose }) {
  const selectedSeason = season;
  const [selectedEps, setSelectedEps] = useState(new Set());
  const [state, setState] = useState('idle');

  const toggleEp = (epNum) => {
    setSelectedEps(prev => {
      const next = new Set(prev);
      if (next.has(epNum)) next.delete(epNum);
      else next.add(epNum);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEps.size === episodes.length) setSelectedEps(new Set());
    else setSelectedEps(new Set(episodes.map(e => e.episodeNumber)));
  };

  const handleDownload = async () => {
    if (selectedEps.size === 0) return;
    setState('loading');
    try {
      const toDownload = episodes.filter(e => selectedEps.has(e.episodeNumber));
      await createMultiEpisodeZip(toDownload, animeInfo.title, selectedSeason);
      setState('done');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '1.5rem', maxWidth: 520, width: '100%',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Download Episodes</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          {animeInfo?.title} — Season {selectedSeason}
        </p>

        {/* Select all */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <button onClick={toggleAll} style={{ background: 'none', border: 'none', color: '#6C63FF', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>
            {selectedEps.size === episodes.length ? 'Deselect All' : 'Select All'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedEps.size} selected</span>
        </div>

        {/* Episode list */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
          {episodes.map(ep => (
            <div key={ep.episodeNumber}
              onClick={() => toggleEp(ep.episodeNumber)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                marginBottom: 6,
                background: selectedEps.has(ep.episodeNumber) ? 'rgba(108,99,255,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${selectedEps.has(ep.episodeNumber) ? '#6C63FF' : 'var(--border)'}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: selectedEps.has(ep.episodeNumber) ? 'linear-gradient(135deg, #6C63FF, #FF6B9D)' : 'var(--bg-card)',
                border: `1px solid ${selectedEps.has(ep.episodeNumber) ? 'transparent' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selectedEps.has(ep.episodeNumber) && <Check size={12} color="white" />}
              </div>
              <img src={ep.thumbnail} alt="" style={{ width: 56, height: 38, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  EP{ep.episodeNumber} — {ep.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ep.duration}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleDownload}
          disabled={selectedEps.size === 0 || state === 'loading'}
          style={{
            marginTop: '1rem', padding: '12px', borderRadius: 12,
            background: selectedEps.size === 0 ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
            color: selectedEps.size === 0 ? 'var(--text-muted)' : 'white',
            border: 'none', fontWeight: 700, cursor: selectedEps.size === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.9rem',
          }}
        >
          {state === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Preparing...</> :
           state === 'done' ? <><Check size={16} /> Downloaded!</> :
           <><Download size={16} /> Download {selectedEps.size} Episode{selectedEps.size !== 1 ? 's' : ''} as ZIP</>}
        </button>
      </div>
    </div>
  );
}

// Movie download modal
export function MovieDownloadModal({ movieInfo, onClose }) {
  const [state, setState] = useState('idle');

  const handleDownload = async () => {
    setState('loading');
    try {
      const zip = new JSZip();
      zip.file('README.txt',
        `${movieInfo?.title}\nType: Dubbed\nSource: Anijelia — Your World of Anime & Cinema`
      );
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `Anijelia_${safeName(movieInfo?.title || 'Movie')}.zip`);
      setState('done');
      setTimeout(() => setState('idle'), 2000);
    } catch { setState('idle'); }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '1.5rem', maxWidth: 380, width: '100%',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Download Movie</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        <button
          onClick={handleDownload}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
            color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {state === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Preparing...</> :
           state === 'done' ? <><Check size={16} /> Downloaded!</> :
           <><Download size={16} /> Download Movie (ZIP)</>}
        </button>
      </div>
    </div>
  );
}
