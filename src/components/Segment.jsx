import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Segment({ title, icon, viewAllLink, children }) {
  return (
    <section style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {icon && <span style={{ color: '#6C63FF', flexShrink: 0 }}>{icon}</span>}
          <h2 style={{
            fontWeight: 700, color: 'var(--text-primary)',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{title}</h2>
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '0.875rem', fontWeight: 500, color: '#6C63FF',
              textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'gap 0.2s',
            }}
          >
            View All <ChevronRight size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
