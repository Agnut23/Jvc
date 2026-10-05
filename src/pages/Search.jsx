import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import infoData from '../data/info.json';
import ContentCard from '../components/ContentCard';

const allContent = [...infoData.anime, ...infoData.movies];

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const results = query.length > 0
    ? allContent.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.genre?.some(g => g.toLowerCase().includes(query.toLowerCase())) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="page-enter">
      <h1 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', marginBottom: '1.5rem' }}>
        {query ? `Results for "${query}"` : 'Search'}
      </h1>

      {results.length === 0 && query && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          <SearchIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No results for "{query}"
          </h2>
          <p>Try a different title or genre.</p>
        </div>
      )}

      {results.length === 0 && !query && (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
          <SearchIcon size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <p>Use the search bar to find anime and movies.</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{results.length} result{results.length !== 1 ? 's' : ''} found</p>
          <div className="card-grid">
            {results.map(item => <ContentCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}
