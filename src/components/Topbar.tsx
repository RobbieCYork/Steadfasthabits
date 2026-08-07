import { useAuth } from '../context/AuthContext';
import { useRouter } from '../lib/router';
import { Avatar, GrowthMark } from './Avatar';

export function Topbar() {
  const { profile, signOut } = useAuth();
  const { navigate } = useRouter();

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => navigate('/')}>
          <span className="mark">
            <GrowthMark size={17} />
          </span>
          Steadfast
        </button>
        <div className="topbar-right">
          <button className="icon-btn" title="Discover public competitions" onClick={() => navigate('/discover')}>
            🌐
          </button>
          <button className="profile-chip" onClick={() => navigate('/profile')}>
            <Avatar profile={profile} />
            <span className="name">{profile?.name}</span>
          </button>
          <button className="icon-btn" title="Sign out" onClick={() => signOut()}>
            ⇄
          </button>
        </div>
      </div>
    </div>
  );
}
