import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useRouter } from '../lib/router';
import { Avatar } from '../components/Avatar';
import { BadgesBlock } from '../components/CalendarBlock';
import { computeStats, earnedBadges } from '../lib/scoring';

export function ProfilePage() {
  const { profile } = useAuth();
  const { habitIdsByScope, habitsById, entries, myCompetitionIds } = useData();
  const { navigate } = useRouter();

  if (!profile) return null;

  const soloHabits = (habitIdsByScope['solo:' + profile.id] || []).map((id) => habitsById[id]).filter(Boolean);
  const compHabits = myCompetitionIds.flatMap((cid) => (habitIdsByScope['competition:' + cid] || []).map((id) => habitsById[id]).filter(Boolean));
  const allHabits = [...soloHabits, ...compHabits];

  let totalBadges = 0;
  allHabits.forEach((h) => {
    const stats = computeStats(entries[profile.id + '|' + h.id] || [], h.frequency);
    totalBadges += earnedBadges(stats, h.frequency).length;
  });

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/')}>
        ← Back
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
        <Avatar profile={profile} size="lg" />
        <div>
          <h2 className="section-title" style={{ margin: '0 0 4px' }}>
            {profile.name}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {myCompetitionIds.length} competition{myCompetitionIds.length === 1 ? '' : 's'} · {soloHabits.length} solo habit
            {soloHabits.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginBottom: 26 }}>
        <Stat label="Habits Tracked" value={allHabits.length} />
        <Stat label="Badges Earned" value={totalBadges} />
        <Stat label="Competitions" value={myCompetitionIds.length} />
      </div>

      <div className="eyebrow" style={{ marginBottom: 10 }}>
        All Badges
      </div>
      {allHabits.length === 0 && <p className="muted">Add a habit to start earning badges.</p>}
      {allHabits.map((h) => {
        const stats = computeStats(entries[profile.id + '|' + h.id] || [], h.frequency);
        return (
          <div style={{ marginBottom: 18 }} key={h.id}>
            <p style={{ fontWeight: 700, fontSize: 13.5, margin: '0 0 8px' }}>
              {h.icon} {h.name}
            </p>
            <BadgesBlock stats={stats} frequency={h.frequency} />
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div className="faint" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}
