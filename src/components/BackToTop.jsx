import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
        width: 44, height: 44, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
        border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
        transform: 'rotate(-90deg)',
      }}
      title="Back to top"
    >
      <ChevronRight size={20} color="white" />
    </button>
  );
}
