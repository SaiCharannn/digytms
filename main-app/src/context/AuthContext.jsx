import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      // Guard against the literal string "null" or "undefined"
      if (!raw || raw === 'null' || raw === 'undefined') return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('accessToken');
    // Guard against literal "null" string
    return (!t || t === 'null') ? null : t;
  });

  const saveSession = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(accessToken);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, saveSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);