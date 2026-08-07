import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useRouter } from '../lib/router';
import { QuoteCard } from '../components/QuoteCard';
import { CompCard } from '../components/CompCard';
import { HabitChip } from '../components/HabitChip';
import { NewCompetitionModal } from '../components/NewCompetitionModal';
import { JoinModal } from '../components/JoinModal';
import { currentPeriodKey } from '../lib/scoring';

export function DashboardPage() {
  const { profile } = useAuth();
  const { myCompetitionIds, competitionsById, habitIdsByScope, habitsById, entries } = useData();
  const { navigate } = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  if (!profile) return null;

  const soloHabitIds = habitIdsByScope['solo:' + profile.id] || [];
  const soloHabits = soloHabitIds.map((id) => habitsById[id]).filter(Boolean);
  const doneToday = soloHabits.filter((h) => (entries[profile.id + '|' + h.id] || []).some((e) => e.period_key === currentPeriodKey(h.frequency))).length;

  const myCompetitions = myCompetitionIds.map((id) => competitionsById[id]).filter(Boolean);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">Welcome back</div>
          <h2 className="section-title">Your Habit Board</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowJoin(true)}>
            🔑 Join with Code
          </button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            + New Competition
          </button>
        </div>
      </div>

      <QuoteCard style={{ margin: '20px 0 26px' }} />

      <div className="dash-grid">
        <button className="comp-card card" style={{ ['--accent-bar' as string]: 'var(--gold)' }} onClick={() => navigate('/solo')}>
          <p className="cname">🧭 My Solo Habits</p>
          <div className="faint" style={{ fontSize: 13 }}>
            {soloHabits.length} habit{soloHabits.length === 1 ? '' : 's'} tracked · {doneToday} done today
          </div>
          <div className="habit-chip-row">
            {soloHabits.length === 0 ? (
              <span className="faint" style={{ fontSize: 12.5 }}>
                No habits yet — tap to add one
              </span>
            ) : (
              soloHabits.slice(0, 6).map((h) => <HabitChip habit={h} key={h.id} />)
            )}
          </div>
        </button>

        {myCompetitions.map((c) => (
          <CompCard competition={c} key={c.id} />
        ))}

        <button className="new-comp-card" onClick={() => setShowNew(true)}>
          <span style={{ fontSize: 26 }}>➕</span>
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>Start a Competition</span>
          <span className="faint" style={{ fontSize: 12 }}>
            Invite family or friends
          </span>
        </button>
      </div>

      {showNew && <NewCompetitionModal onClose={() => setShowNew(false)} />}
      {showJoin && <JoinModal onClose={() => setShowJoin(false)} />}
    </div>
  );
}
