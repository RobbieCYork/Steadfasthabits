import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { RouterProvider, useSegments } from './lib/router';
import { Topbar } from './components/Topbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SoloPage } from './pages/SoloPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ProfilePage } from './pages/ProfilePage';
import { CompetitionPage } from './pages/CompetitionPage';

function Screens() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return <div className="spinner-page">Loading Steadfast…</div>;
  }

  if (!session || !profile) {
    return <LoginPage />;
  }

  return (
    <DataProvider>
      <Topbar />
      <main className="wrap" style={{ paddingTop: 26, paddingBottom: 30 }}>
        <Router segments={segments} />
      </main>
      <footer className="app-footer">Steadfast — build habits that compound, together.</footer>
    </DataProvider>
  );
}

function Router({ segments }: { segments: string[] }) {
  if (segments.length === 0) return <DashboardPage />;
  if (segments[0] === 'solo') return <SoloPage />;
  if (segments[0] === 'discover') return <DiscoverPage />;
  if (segments[0] === 'profile') return <ProfilePage />;
  if (segments[0] === 'c' && segments[1]) {
    const tab = (segments[2] as 'scoreboard' | 'calendar' | 'habits' | 'invite') || 'scoreboard';
    return <CompetitionPage compId={segments[1]} tab={tab} />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <RouterProvider>
      <ToastProvider>
        <AuthProvider>
          <Screens />
        </AuthProvider>
      </ToastProvider>
    </RouterProvider>
  );
}
