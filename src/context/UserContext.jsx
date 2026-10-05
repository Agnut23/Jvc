import { createContext, useContext, useState, useCallback } from 'react';
import { readJSON, writeJSON } from '../utils/storage';

const UserContext = createContext(null);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function getHistory() {
  return readJSON('anijelia-history', {}, isPlainObject);
}

function getWatchlist() {
  return readJSON('anijelia-watchlist', [], (v) => Array.isArray(v) && v.every(i => i && typeof i.id === 'string'));
}

export function UserProvider({ children }) {
  const [history, setHistory] = useState(getHistory);
  const [watchlist, setWatchlist] = useState(getWatchlist);

  const updateProgress = useCallback((id, key, currentTime, duration) => {
    const progress = duration > 0 ? currentTime / duration : 0;
    setHistory(prev => {
      const next = {
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          [key]: {
            currentTime,
            progress,
            lastWatched: new Date().toISOString(),
          }
        }
      };
      writeJSON('anijelia-history', next);
      return next;
    });
  }, []);

  const getProgress = useCallback((id, key) => {
    const h = getHistory();
    return h?.[id]?.[key] || null;
  }, []);

  const removeHistory = useCallback((id, key) => {
    setHistory(prev => {
      const next = { ...prev };
      if (key && next[id]) {
        next[id] = { ...next[id] };
        delete next[id][key];
        if (Object.keys(next[id]).length === 0) delete next[id];
      } else {
        delete next[id];
      }
      writeJSON('anijelia-history', next);
      return next;
    });
  }, []);

  const toggleWatchlist = useCallback((item) => {
    setWatchlist(prev => {
      const exists = prev.find(w => w.id === item.id);
      const next = exists ? prev.filter(w => w.id !== item.id) : [...prev, item];
      writeJSON('anijelia-watchlist', next);
      return next;
    });
  }, []);

  const isInWatchlist = useCallback((id) => {
    return watchlist.some(w => w.id === id);
  }, [watchlist]);

  return (
    <UserContext.Provider value={{
      history,
      watchlist,
      updateProgress,
      getProgress,
      removeHistory,
      toggleWatchlist,
      isInWatchlist,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
