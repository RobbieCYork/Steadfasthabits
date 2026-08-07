import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useRouter } from '../lib/router';
import { HabitRow } from '../components/HabitRow';
import { CalendarBlock } from '../components/CalendarBlock';
import { AddHabitModal } from '../components/AddHabitModal';
import { CATEGORY_META } from '../lib/constants';

export function SoloPage() {
  const { profile } = useAuth();
  const { habitIdsByScope, habitsById, entries } = useData();
  const { navigate } = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [calHabitId, setCalHabitId] = useState<string | null>(null);

  if (!profile) return null;

  const habitIds = habitIdsByScope['solo:' + profile.id] || [];
  const habits = habitIds.map((id) => habitsById[id]).filter(Boolean);
  const activeHabitId = calHabitId && habits.some((h) => h.id === calHabitId) ? calHabitId : habits[0]?.id || null;
  const activeHabit = activeHabitId ? habitsById[activeHabitId] : null;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/')}>
        ← Back
      </button>
      <h2 className="section-title">🧭 My Solo Habits</h2>
      <p className="muted">Habits just for you — no competition, no goal, just steady progress.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '18px 0' }}>
        {habits.length === 0 ? (
          <div className="empty-state card">
            <div className="ico">🌱</div>
            <p style={{ fontWeight: 700, margin: '0 0 4px' }}>No solo habits yet</p>
            <p className="muted" style={{ margin: 0 }}>
              Add one from the catalog or create your own.
            </p>
          </div>
        ) : (
          habits.map((h) => <HabitRow habit={h} profileId={profile.id} entries={entries[profile.id + '|' + h.id] || []} key={h.id} />)
        )}
      </div>

      <button className="btn btn-soft" onClick={() => setShowAdd(true)}>
        + Add Habit
      </button>

      {habits.length > 0 && activeHabit && (
        <>
          <div className="eyebrow" style={{ marginTop: 28, marginBottom: 8 }}>
            View Calendar
          </div>
          <div className="habit-chip-row">
            {habits.map((h) => {
              const meta = CATEGORY_META[h.category] || CATEGORY_META.custom;
              const active = activeHabitId === h.id;
              return (
                <button
                  key={h.id}
                  className="pill"
                  style={active ? { background: meta.color, color: '#fff', borderColor: meta.color } : {}}
                  onClick={() => setCalHabitId(h.id)}
                >
                  {h.icon} {h.name}
                </button>
              );
            })}
          </div>
          <div className="card" style={{ padding: 20, marginTop: 16 }}>
            <CalendarBlock profileId={profile.id} habit={activeHabit} entries={entries[profile.id + '|' + activeHabit.id] || []} editable />
          </div>
        </>
      )}

      {showAdd && <AddHabitModal scopeType="solo" scopeId={profile.id} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
