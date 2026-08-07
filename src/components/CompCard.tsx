import type { Competition } from '../lib/types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../lib/router';
import { Avatar } from './Avatar';
import { HabitChip } from './HabitChip';
import { computeStats } from '../lib/scoring';
import { CATEGORY_META } from '../lib/constants';

export function CompCard({ competition }: { competition: Competition }) {
  const { profilesById, membersByComp, habitsById, habitIdsByScope, entries } = useData();
  const { profile } = useAuth();
  const { navigate } = useRouter();

  const habitIds = habitIdsByScope['competition:' + competition.id] || [];
  const habits = habitIds.map((id) => habitsById[id]).filter(Boolean);
  const memberIds = membersByComp[competition.id] || [];
  const members = memberIds.map((id) => profilesById[id]).filter(Boolean);

  const myScore = profile
    ? habits.reduce((sum, h) => sum + computeStats(entries[profile.id + '|' + h.id] || [], h.frequency).totalScore, 0)
    : 0;
  const pct = competition.goal_points > 0 ? Math.min(100, Math.round((myScore / competition.goal_points) * 100)) : 0;
  const barColor = habits[0] ? CATEGORY_META[habits[0].category]?.color : 'var(--accent)';

  return (
    <button
      className="comp-card card"
      style={{ ['--accent-bar' as string]: barColor }}
      onClick={() => navigate(`/c/${competition.id}/scoreboard`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <p className="cname">{competition.name}</p>
        <span className="pill" style={{ fontSize: 10.5, padding: '3px 9px' }}>
          {competition.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
        </span>
      </div>
      <div className="members-row">
        {members.slice(0, 5).map((p) => (
          <Avatar profile={p} size="md" key={p.id} />
        ))}
        {members.length > 5 && <span className="faint" style={{ marginLeft: 6 }}>+{members.length - 5}</span>}
      </div>
      <div className="habit-chip-row">
        {habits.slice(0, 4).map((h) => (
          <HabitChip habit={h} key={h.id} />
        ))}
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }} className="muted">
          <span>Your score</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)' }}>
            {myScore} / {competition.goal_points}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: pct + '%' }} />
        </div>
      </div>
    </button>
  );
}
