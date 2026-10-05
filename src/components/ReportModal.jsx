import { useState } from 'react';
import { X, Flag, User, Mail, MessageSquare, ChevronDown, Send, Check, Loader2 } from 'lucide-react';
import { SITE } from '../config/site.js';
import { useToast } from '../context/ToastContext';

const subjects = ['Bug Report', 'Content Request', 'DMCA / Copyright', 'Other'];
const COOLDOWN_MS = 30000;

async function submitReport(data) {
  if (SITE.reportEndpoint) {
    const res = await fetch(SITE.reportEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return 'sent';
  }
  if (SITE.contactEmail) {
    const body = `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;
    window.location.href =
      `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(`[${data.subject}] Anijelia`)}&body=${encodeURIComponent(body)}`;
    return 'mailto';
  }
  throw new Error('No report endpoint or contact email configured');
}

export default function ReportModal({ onClose }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [submitState, setSubmitState] = useState('idle'); // idle | loading | done

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.subject) e.subject = 'Select a subject';
    if (!form.message.trim()) e.message = 'Message cannot be empty';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    // Honeypot: real visitors never see or fill this field. Pretend success to bots.
    if (form.website) {
      setSubmitState('done');
      setTimeout(onClose, 1500);
      return;
    }

    // Light client-side throttle (real rate limiting must live on your endpoint).
    let last = 0;
    try { last = Number(sessionStorage.getItem('anijelia-report-ts') || 0); } catch {}
    if (Date.now() - last < COOLDOWN_MS) {
      addToast('Please wait a moment before sending another message.', 'warning');
      return;
    }

    setSubmitState('loading');
    try {
      const result = await submitReport({
        name: form.name.trim().slice(0, 100),
        email: form.email.trim().slice(0, 200),
        subject: form.subject,
        message: form.message.trim().slice(0, 500),
      });
      try { sessionStorage.setItem('anijelia-report-ts', String(Date.now())); } catch {}
      setSubmitState('done');
      addToast(result === 'mailto' ? 'Opening your email app…' : 'Report sent successfully!', 'success');
      setTimeout(onClose, 1500);
    } catch {
      setSubmitState('idle');
      addToast('Could not send your message. Please try again later.', 'error');
    }
  };

  const inputStyle = (err) => ({
    width: '100%', background: 'transparent',
    border: 'none', borderBottom: `2px solid ${err ? '#ef4444' : 'var(--border)'}`,
    color: 'var(--text-primary)', padding: '10px 0 6px 28px',
    fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
    fontFamily: 'Inter, sans-serif',
  });

  const fieldWrapper = { position: 'relative', marginBottom: '1.25rem' };
  const iconStyle = { position: 'absolute', left: 0, top: 10, color: 'var(--text-muted)' };
  const errStyle = { fontSize: 11, color: '#ef4444', display: 'block', marginTop: 3 };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        overflow: 'auto',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report or contact us"
        style={{
          background: 'rgba(13,13,18,0.92)',
          border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 20, padding: '2rem',
          maxWidth: 500, width: '100%',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flag size={20} color="#6C63FF" />
            <h2 style={{
              fontWeight: 700, fontSize: '1.2rem',
              background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Report / Contact Us
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 8, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Name */}
        <div style={fieldWrapper}>
          <User size={16} style={iconStyle} />
          <input
            type="text" placeholder="Your name" maxLength={100}
            value={form.name}
            onChange={e => setField('name', e.target.value)}
            style={inputStyle(errors.name)}
            onFocus={e => e.target.style.borderBottomColor = '#6C63FF'}
            onBlur={e => e.target.style.borderBottomColor = errors.name ? '#ef4444' : 'var(--border)'}
          />
          {errors.name && <span style={errStyle}>{errors.name}</span>}
        </div>

        {/* Email */}
        <div style={fieldWrapper}>
          <Mail size={16} style={iconStyle} />
          <input
            type="email" placeholder="Email address" maxLength={200}
            value={form.email}
            onChange={e => setField('email', e.target.value)}
            style={inputStyle(errors.email)}
            onFocus={e => e.target.style.borderBottomColor = '#6C63FF'}
            onBlur={e => e.target.style.borderBottomColor = errors.email ? '#ef4444' : 'var(--border)'}
          />
          {errors.email && <span style={errStyle}>{errors.email}</span>}
        </div>

        {/* Subject */}
        <div style={fieldWrapper}>
          <ChevronDown size={16} style={{ position: 'absolute', right: 0, top: 10, color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <button
            type="button"
            onClick={() => setSubjectOpen(s => !s)}
            style={{
              width: '100%', textAlign: 'left', background: 'transparent',
              border: 'none', borderBottom: `2px solid ${errors.subject ? '#ef4444' : subjectOpen ? '#6C63FF' : 'var(--border)'}`,
              color: form.subject ? '#6C63FF' : 'var(--text-muted)',
              padding: '10px 24px 6px 0', fontSize: '0.9rem', cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            {form.subject || 'Select subject...'}
          </button>
          {subjectOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'rgba(13,13,18,0.98)', border: '1px solid rgba(108,99,255,0.3)',
              borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
            }}>
              {subjects.map(s => (
                <div key={s}
                  onClick={() => { setField('subject', s); setSubjectOpen(false); }}
                  style={{
                    padding: '10px 16px', cursor: 'pointer', fontSize: '0.9rem',
                    color: form.subject === s ? '#6C63FF' : 'var(--text-primary)',
                    background: form.subject === s ? 'rgba(108,99,255,0.15)' : 'transparent',
                    transition: 'background 0.15s',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = form.subject === s ? 'rgba(108,99,255,0.15)' : 'transparent'}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
          {errors.subject && <span style={errStyle}>{errors.subject}</span>}
        </div>

        {/* Message */}
        <div style={fieldWrapper}>
          <MessageSquare size={16} style={{ ...iconStyle, top: 12 }} />
          <div style={{ position: 'relative' }}>
            <textarea
              placeholder="Your message..."
              value={form.message}
              maxLength={500}
              onChange={e => setField('message', e.target.value)}
              rows={3}
              style={{ ...inputStyle(errors.message), resize: 'none' }}
            />
            <span style={{ position: 'absolute', bottom: 4, right: 0, fontSize: 10, color: 'var(--text-muted)' }}>
              {form.message.length} / 500
            </span>
          </div>
          {errors.message && <span style={errStyle}>{errors.message}</span>}
        </div>

        {/* Honeypot — hidden from people, tempting to bots */}
        <input
          type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={form.website}
          onChange={e => setField('website', e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitState !== 'idle'}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: submitState === 'done' ? '#22c55e' : 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
            color: 'white', fontWeight: 700, fontSize: '0.95rem',
            cursor: submitState !== 'idle' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {submitState === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Sending...</> :
           submitState === 'done' ? <><Check size={16} /> Sent!</> :
           <><Send size={16} /> Send Report</>}
        </button>
      </div>
    </div>
  );
}
