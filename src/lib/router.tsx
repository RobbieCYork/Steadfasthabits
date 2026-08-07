import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface RouterState {
  path: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterState | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function navigate(next: string) {
    if (next !== window.location.pathname) {
      window.history.pushState({}, '', next);
      setPath(next);
    }
    window.scrollTo({ top: 0 });
  }

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterState {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

// Splits "/c/abc123/calendar" -> { segments: ['c','abc123','calendar'] }
export function useSegments(): string[] {
  const { path } = useRouter();
  return path.split('/').filter(Boolean);
}
