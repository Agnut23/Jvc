import { Film } from 'lucide-react';
import infoData from '../data/info.json';
import ContentCard from '../components/ContentCard';

export default function MoviesPage() {
  return (
    <div className="page-enter">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <Film size={22} color="#6C63FF" />
        <h1 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>
          Movies
        </h1>
      </div>
      <div className="card-grid">
        {infoData.movies.map(item => <ContentCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}
