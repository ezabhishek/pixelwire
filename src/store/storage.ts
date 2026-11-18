import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/** In-memory stand-in when localStorage is blocked (private mode, disabled site data). */
function memoryStorage(): StateStorage {
  const map = new Map<string, string>();
  return {
    getItem: (name) => map.get(name) ?? null,
    setItem: (name, value) => {
      map.set(name, value);
    },
    removeItem: (name) => {
      map.delete(name);
    },
  };
}

function safeLocalStorage(): StateStorage {
  try {
    const probe = '__pixel-wires-probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return {
      getItem: (name) => {
        try {
          return window.localStorage.getItem(name);
        } catch {
          return null;
        }
      },
      setItem: (name, value) => {
        try {
          window.localStorage.setItem(name, value);
        } catch {
          // Quota exceeded or storage revoked: keep running with in-memory state.
        }
      },
      removeItem: (name) => {
        try {
          window.localStorage.removeItem(name);
        } catch {
          // Storage revoked: nothing to remove.
        }
      },
    };
  } catch {
    return memoryStorage();
  }
}

export const persistentStorage = createJSONStorage(safeLocalStorage);
