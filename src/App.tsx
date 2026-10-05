import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// @ts-ignore
import { ThemeProvider } from './context/ThemeContext';
// @ts-ignore
import { UserProvider } from './context/UserContext';
// @ts-ignore
import { ToastProvider } from './context/ToastContext';
// @ts-ignore
import Navbar from './components/Navbar';
// @ts-ignore
import BackToTop from './components/BackToTop';
// @ts-ignore
import ReportModal from './components/ReportModal';
// @ts-ignore
import Home from './pages/Home';
// @ts-ignore
import SeriesDetail from './pages/SeriesDetail';
// @ts-ignore
import MovieDetail from './pages/MovieDetail';
// @ts-ignore
import Player from './pages/Player';
// @ts-ignore
import Search from './pages/Search';
// @ts-ignore
import NewReleases from './pages/NewReleases';
// @ts-ignore
import MostWatching from './pages/MostWatching';
// @ts-ignore
import SeriesPage from './pages/SeriesPage';
// @ts-ignore
import MoviesPage from './pages/MoviesPage';
// @ts-ignore
import Profile from './pages/Profile';

function AppInner() {
  const [showReport, setShowReport] = useState<boolean>(false);

  return (
    <BrowserRouter>
      <Navbar onReport={() => setShowReport(true)} />
      <main
        className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: 'calc(64px + 1.5rem)', paddingBottom: '3rem', minHeight: '100vh' }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/series" element={<SeriesPage />} />
          <Route path="/series/:id" element={<SeriesDetail />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/player/:type/:id" element={<Player />} />
          <Route path="/search" element={<Search />} />
          <Route path="/new-releases" element={<NewReleases />} />
          <Route path="/most-watching" element={<MostWatching />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={
            <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--text-secondary)' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '1rem' }}>404</h1>
              <p style={{ fontSize: '1.1rem' }}>Page not found</p>
            </div>
          } />
        </Routes>
      </main>
      <BackToTop />
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
