import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, Captions, Loader2
} from 'lucide-react';

// Returns an 11-character YouTube video ID, or null if the input isn't one.
// Accepts a full URL (watch / youtu.be / embed) or a bare ID.
function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(url) ? url : null;
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ videoId, subtitles = [], onProgress, seekTo: externalSeekTo }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const progressRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const firstPlayRef = useRef(true);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initCover, setInitCover] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progressHovered, setProgressHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverX, setHoverX] = useState(0);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [subCues, setSubCues] = useState([]);
  const [currentSubText, setCurrentSubText] = useState('');
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const [speed, setSpeed] = useState(1);

  const youtubeId = extractYoutubeId(videoId);

  // Load YouTube API (once) and create the player
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === 'function') previous();
        initPlayer();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }
    return () => {
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ready && youtubeId && playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(youtubeId);
    }
  }, [youtubeId, ready]);

  // External seek (for resume)
  useEffect(() => {
    if (externalSeekTo !== undefined && externalSeekTo !== null && ready && playerRef.current) {
      playerRef.current.seekTo(externalSeekTo, true);
    }
  }, [externalSeekTo, ready]);

  function initPlayer() {
    if (!document.getElementById('yt-player')) return;
    playerRef.current = new window.YT.Player('yt-player', {
      videoId: youtubeId,
      playerVars: {
        autoplay: 1,
        mute: 1,       // muted autoplay is allowed by all browsers — we unmute once playing
        controls: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        fs: 0,
        disablekb: 1,
        enablejsapi: 1,
        origin: window.location.origin,
        playsinline: 1,
        color: 'white',
      },
      events: {
        onReady: (e) => {
          setReady(true);
          setLoading(false);
          e.target.mute();
          e.target.playVideo();
          setDuration(e.target.getDuration());
        },
        onStateChange: (e) => {
          const YT = window.YT;
          setPlaying(e.data === YT.PlayerState.PLAYING);
          setLoading(e.data === YT.PlayerState.BUFFERING);
          if (e.data === YT.PlayerState.PLAYING) {
            setInitCover(false);
            // Unmute and restore volume only on the very first autoplay
            if (firstPlayRef.current) {
              firstPlayRef.current = false;
              playerRef.current?.unMute();
              playerRef.current?.setVolume(80);
              setMuted(false);
            }
            setDuration(playerRef.current?.getDuration() || 0);
          }
        },
      }
    });
  }

  const qualityMap = {
    highres: '4K', hd2160: '4K', hd1440: '1440p',
    hd1080: '1080p', hd720: '720p', large: '480p',
    medium: '360p', small: '240p', tiny: '144p', auto: 'Auto',
  };

  // Parse VTT timestamp "00:01:23.456" → seconds
  function vttTimeToSec(t) {
    const parts = t.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts[0] * 60 + parts[1];
  }

  // Parse VTT file text into cue array [{start, end, text}]
  function parseVTT(text) {
    const cues = [];
    const blocks = text.replace(/\r\n/g, '\n').split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      const timeLine = lines.find(l => l.includes('-->'));
      if (!timeLine) continue;
      const [start, end] = timeLine.split('-->').map(s => vttTimeToSec(s.trim().split(' ')[0]));
      const text = lines.slice(lines.indexOf(timeLine) + 1)
        .join(' ').replace(/<[^>]+>/g, '').trim();
      if (text) cues.push({ start, end, text });
    }
    return cues;
  }

  // Fetch and parse VTT when subtitle language is selected
  useEffect(() => {
    if (!selectedSub) { setSubCues([]); setCurrentSubText(''); return; }
    const sub = subtitles.find(s => s.language === selectedSub);
    if (!sub?.url || sub.url === '#') { setSubCues([]); return; }
    fetch(sub.url)
      .then(r => { if (!r.ok) throw new Error('subtitle fetch failed'); return r.text(); })
      .then(text => setSubCues(parseVTT(text)))
      .catch(() => setSubCues([]));
  }, [selectedSub, subtitles]);

  // Match subtitle cue to current playback time
  useEffect(() => {
    if (!subCues.length) { setCurrentSubText(''); return; }
    const cue = subCues.find(c => currentTime >= c.start && currentTime <= c.end);
    setCurrentSubText(cue?.text || '');
  }, [currentTime, subCues]);
  useEffect(() => {
    progressTimerRef.current = setInterval(() => {
      if (playerRef.current && playing && !isDraggingRef.current) {
        const ct = playerRef.current.getCurrentTime?.() || 0;
        const dur = playerRef.current.getDuration?.() || 0;
        setCurrentTime(ct);
        if (dur > 0) setDuration(dur);
        if (onProgress) onProgress(ct, dur);
        // Read actual quality directly from player instead of relying on event
        const q = playerRef.current.getPlaybackQuality?.();
        if (q) setCurrentQuality(qualityMap[q] || q.toUpperCase());
      }
    }, 1000);
    return () => clearInterval(progressTimerRef.current);
  }, [playing, onProgress]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    if (playing) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 5000);
    }
  }, [playing]);

  useEffect(() => { resetControlsTimer(); }, [playing]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (!playerRef.current) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); handlePlayPause(); break;
        case 'ArrowLeft': e.preventDefault(); handleSeekRelative(-10); break;
        case 'ArrowRight': e.preventDefault(); handleSeekRelative(10); break;
        case 'ArrowUp': e.preventDefault(); handleVolumeChange({ target: { value: Math.min(100, volume + 10) } }); break;
        case 'ArrowDown': e.preventDefault(); handleVolumeChange({ target: { value: Math.max(0, volume - 10) } }); break;
        case 'f': case 'F': e.preventDefault(); handleFullscreen(); break;
        case 'm': case 'M': e.preventDefault(); handleMute(); break;
        case 'c': case 'C': e.preventDefault(); setSelectedSub(s => s ? null : subtitles[0]?.language || null); break;
        default:
          if (e.key >= '1' && e.key <= '9') {
            const pct = parseInt(e.key) / 10;
            const t = pct * duration;
            playerRef.current.seekTo(t, true);
            setCurrentTime(t);
          }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, volume, duration, subtitles]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
    resetControlsTimer();
  };

  const handleSeekRelative = (delta) => {
    if (!playerRef.current) return;
    const t = Math.max(0, Math.min(duration, currentTime + delta));
    playerRef.current.seekTo(t, true);
    setCurrentTime(t);
  };

  const handleVolumeChange = (e) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    playerRef.current?.setVolume(v);
  };

  const handleMute = () => {
    if (!playerRef.current) return;
    if (muted) { playerRef.current.unMute(); playerRef.current.setVolume(volume || 50); setMuted(false); }
    else { playerRef.current.mute(); setMuted(true); }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.({ navigationUI: 'hide' })
        .then(() => {
          // Force controls visible for 6s on fullscreen entry
          setShowControls(true);
          clearTimeout(controlsTimerRef.current);
          controlsTimerRef.current = setTimeout(() => {
            if (playing) setShowControls(false);
          }, 6000);
        })
        .catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleSpeed = (s) => {
    setSpeed(s);
    playerRef.current?.setPlaybackRate(s);
    setShowSpeedMenu(false);
  };

  // Progress bar interactions
  const getSeekTimeFromEvent = (e) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pct * duration;
  };

  const handleProgressMouseDown = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    const t = getSeekTimeFromEvent(e);
    setCurrentTime(t);
    playerRef.current?.seekTo(t, true);
  };

  const handleProgressMouseMove = (e) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      setHoverX(x);
      setHoverTime(getSeekTimeFromEvent(e));
    }
    if (isDraggingRef.current) {
      const t = getSeekTimeFromEvent(e);
      setCurrentTime(t);
      playerRef.current?.seekTo(t, true);
    }
  };

  const handleProgressMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleProgressTouchStart = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    const t = getSeekTimeFromEvent(e);
    setCurrentTime(t);
    playerRef.current?.seekTo(t, true);
  };

  const handleProgressTouchMove = (e) => {
    e.preventDefault();
    if (!isDraggingRef.current) return;
    const t = getSeekTimeFromEvent(e);
    setCurrentTime(t);
    playerRef.current?.seekTo(t, true);
    const rect = progressRef.current?.getBoundingClientRect();
    if (rect) setHoverX(e.touches[0].clientX - rect.left);
    setHoverTime(t);
  };

  const handleProgressTouchEnd = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setHoverTime(null);
  };

  useEffect(() => {
    const onMouseUp = () => { isDraggingRef.current = false; setIsDragging(false); };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, []);

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  const closeAllMenus = () => {
    setShowSubMenu(false);
    setShowSpeedMenu(false);
  };

  const menuStyle = {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    right: 0,
    background: 'rgba(13,13,18,0.97)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    overflow: 'hidden auto',
    minWidth: 150,
    maxHeight: 220,
    zIndex: 50,
    boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(12px)',
    maxWidth: 'calc(100vw - 32px)',
    animation: 'slideDown 0.2s ease',
  };

  const menuItemStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 16px', cursor: 'pointer', fontSize: 13,
    background: active ? 'rgba(108,99,255,0.2)' : 'transparent',
    color: active ? '#6C63FF' : '#F0F0FF',
    transition: 'background 0.15s',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  });

  const ctrlBtn = {
    minWidth: 40, minHeight: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', cursor: 'pointer',
    borderRadius: 8, color: 'white', padding: '4px',
    transition: 'background 0.15s',
    flexShrink: 0,
  };

  if (!youtubeId) {
    return (
      <div style={{
        aspectRatio: '16/9', borderRadius: 12, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '0.9rem',
      }}>
        Video not available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="player-wrapper"
      style={{ userSelect: 'none' }}
      onMouseMove={resetControlsTimer}
      onClick={closeAllMenus}
    >
      {/* YouTube player mount point */}
      <div id="yt-player" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Black cover until playback starts (avoids a flash of the embed's own thumbnail) */}
      {initCover && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 35,
          background: '#000',
        }} />
      )}

      {/* Click interceptor above the iframe — all interaction goes through the custom controls */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 21, cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          if (!showControls && playing) {
            resetControlsTimer();
          } else {
            handlePlayPause();
            resetControlsTimer();
          }
        }}
      />

      {/* End screen: shown once the video has finished */}
      {!playing && duration > 0 && currentTime >= duration - 1 && (
        <div style={{
          position: 'absolute', inset: 0,
          zIndex: 24, pointerEvents: 'auto', background: '#000',
        }} onClick={handlePlayPause} />
      )}



      {/* Loading spinner — above everything */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <Loader2 size={40} color="#6C63FF" className="animate-spin" />
        </div>
      )}

      {/* Subtitle overlay — shows current cue text above controls */}
      {selectedSub && currentSubText && (
        <div style={{
          position: 'absolute', bottom: 70, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 29, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.75)',
          color: '#fff', padding: '4px 16px',
          borderRadius: 6, fontSize: '1rem',
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          maxWidth: '85%', textAlign: 'center',
          lineHeight: 1.5, whiteSpace: 'pre-line',
        }}>
          {currentSubText}
        </div>
      )}

      {/* Controls overlay — highest z-index, above the click interceptor */}
      <div
        className="absolute inset-0 flex flex-col justify-end transition-opacity duration-300"
        style={{
          zIndex: 30,
          opacity: (!playing || showControls) ? 1 : 0,
          background: (!playing || showControls)
            ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.5) 100%)'
            : 'transparent',
          pointerEvents: (!playing || showControls) ? 'auto' : 'none',
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseMove={resetControlsTimer}
      >
        {/* Spacer — clicks here handled by the interceptor div below the controls */}
        <div style={{ flex: 1 }} />

        {/* Progress bar */}
        <div style={{ padding: '0 12px 4px' }}>
          {hoverTime !== null && (
            <div style={{
              position: 'absolute',
              bottom: 60,
              left: Math.max(30, Math.min(hoverX + 12, (containerRef.current?.offsetWidth || 200) - 60)),
              background: 'rgba(0,0,0,0.9)',
              color: 'white', fontSize: 11, fontWeight: 600,
              padding: '3px 8px', borderRadius: 6, pointerEvents: 'none', zIndex: 60,
            }}>
              {formatTime(hoverTime)}
            </div>
          )}
          <div
            ref={progressRef}
            style={{
              position: 'relative', cursor: 'pointer',
              height: progressHovered || isDragging ? 6 : 4,
              transition: 'height 0.15s ease', borderRadius: 3,
              background: 'rgba(255,255,255,0.2)',
              padding: '8px 0', margin: '-8px 0', boxSizing: 'content-box',
            }}
            onMouseEnter={() => setProgressHovered(true)}
            onMouseLeave={() => { setProgressHovered(false); setHoverTime(null); }}
            onMouseMove={handleProgressMouseMove}
            onMouseDown={handleProgressMouseDown}
            onMouseUp={handleProgressMouseUp}
            onTouchStart={handleProgressTouchStart}
            onTouchMove={handleProgressTouchMove}
            onTouchEnd={handleProgressTouchEnd}
          >
            {/* Track bg */}
            <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: progressHovered || isDragging ? 6 : 4, background: 'rgba(255,255,255,0.2)', borderRadius: 3 }} />
            {/* Played */}
            <div style={{
              position: 'absolute', top: 8, left: 0, height: progressHovered || isDragging ? 6 : 4,
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6C63FF, #FF6B9D)',
              borderRadius: 3, pointerEvents: 'none', transition: 'height 0.15s',
            }} />
            {/* Scrubber dot */}
            {(progressHovered || isDragging) && (
              <div style={{
                position: 'absolute', top: 8,
                left: `${progressPct}%`,
                transform: 'translate(-50%, -3px)',
                width: 12, height: 12, borderRadius: '50%',
                background: 'white',
                boxShadow: '0 0 6px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
              }} />
            )}
          </div>
        </div>

        {/* Controls row */}
        <div
          style={{ display: 'flex', alignItems: 'center', padding: '0 6px 8px', gap: 2 }}
          onClick={e => e.stopPropagation()}
        >
          {/* LEFT controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button style={ctrlBtn} onClick={() => handleSeekRelative(-10)} title="Skip back 10s">
              <SkipBack size={18} color="white" />
            </button>
            <button style={ctrlBtn} onClick={handlePlayPause} title="Play/Pause">
              {playing ? <Pause size={20} color="white" fill="white" /> : <Play size={20} color="white" fill="white" />}
            </button>
            <button style={ctrlBtn} onClick={() => handleSeekRelative(10)} title="Skip forward 10s">
              <SkipForward size={18} color="white" />
            </button>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button style={ctrlBtn} onClick={handleMute}>
                {muted || volume === 0 ? <VolumeX size={18} color="white" /> : <Volume2 size={18} color="white" />}
              </button>
              <input
                type="range" min={0} max={100} value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden sm:block"
                style={{ width: 72, accentColor: '#6C63FF', cursor: 'pointer' }}
              />
            </div>

            {/* Timestamp */}
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontFamily: 'monospace', marginLeft: 4, whiteSpace: 'nowrap' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* RIGHT controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }} onClick={e => e.stopPropagation()}>
            {/* SUB button — only shown when subtitle tracks are provided */}
            {subtitles.length > 0 && <div style={{ position: 'relative' }}>
              <button
                style={{
                  ...ctrlBtn,
                  flexDirection: 'column', gap: 1,
                  border: selectedSub && showSubMenu ? '1px solid #6C63FF' : '1px solid transparent',
                  background: showSubMenu ? 'rgba(108,99,255,0.2)' : 'none',
                  borderRadius: 8, padding: '4px 6px',
                }}
                onClick={(e) => { e.stopPropagation(); setShowSubMenu(s => !s); setShowSpeedMenu(false); }}
                title="Subtitles"
              >
                <Captions size={16} color={selectedSub ? '#6C63FF' : 'white'} />
                <span style={{ fontSize: 9, color: selectedSub ? '#6C63FF' : 'rgba(255,255,255,0.7)', fontWeight: 700 }}>SUB</span>
              </button>
              {showSubMenu && (
                <div style={menuStyle} onClick={e => e.stopPropagation()}>
                  <div
                    style={menuItemStyle(!selectedSub)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = !selectedSub ? 'rgba(108,99,255,0.2)' : 'transparent'}
                    onClick={() => { setSelectedSub(null); setShowSubMenu(false); }}
                  >
                    Off
                  </div>
                  {subtitles.map(s => (
                    <div
                      key={s.language}
                      style={menuItemStyle(selectedSub === s.language)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedSub === s.language ? 'rgba(108,99,255,0.2)' : 'transparent'}
                      onClick={() => { setSelectedSub(s.language); setShowSubMenu(false); }}
                    >
                      {s.label} — {s.language}
                    </div>
                  ))}
                </div>
              )}
            </div>}

            {/* QUALITY indicator — read-only, shows what YouTube auto-selected */}
            <div
              title="YouTube auto-selects quality based on your connection speed"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 1, padding: '4px 6px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'default', minWidth: 40,
              }}
            >
              <Settings size={16} color="rgba(255,255,255,0.5)" />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                {currentQuality}
              </span>
            </div>

            {/* SPEED button */}
            <div style={{ position: 'relative' }}>
              <button
                style={{
                  ...ctrlBtn,
                  flexDirection: 'column', gap: 1,
                  border: showSpeedMenu ? '1px solid #6C63FF' : '1px solid transparent',
                  background: showSpeedMenu ? 'rgba(108,99,255,0.2)' : 'none',
                  borderRadius: 8, padding: '4px 6px',
                  minWidth: 36,
                }}
                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(s => !s); setShowSubMenu(false); }}
                title="Playback Speed"
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{speed}×</span>
              </button>
              {showSpeedMenu && (
                <div style={menuStyle} onClick={e => e.stopPropagation()}>
                  {speeds.map(s => (
                    <div
                      key={s}
                      style={menuItemStyle(speed === s)}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = speed === s ? 'rgba(108,99,255,0.2)' : 'transparent'}
                      onClick={() => handleSpeed(s)}
                    >
                      {s}×
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button style={ctrlBtn} onClick={handleFullscreen} title="Fullscreen">
              {fullscreen ? <Minimize size={18} color="white" /> : <Maximize size={18} color="white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
