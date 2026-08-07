import { useData } from '../context/DataContext';
import { useRouter } from '../lib/router';
import { useToast } from '../context/ToastContext';
import { HabitChip } from '../components/HabitChip';

export function DiscoverPage() {
  const { discoverCompetitionIds, competitionsById, habitIdsByScope, habitsById, joinPublic, membersByComp } = useData();
  const { navigate } = useRouter();
  const toast = useToast();

  const list = discoverCompetitionIds.map((id) => competitionsById[id]).filter(Boolean);

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/')}>
        ← Back
      </button>
      <h2 className="section-title">🌐 Discover Public Competitions</h2>
      <p className="muted">Anyone on Steadfast can list a competition publicly so others can find and join it. Private competitions stay invite-only.</p>

      {list.length === 0 ? (
        <div className="empty-state card">
          <div className="ico">🌱</div>
          <p style={{ fontWeight: 700, margin: '0 0 4px' }}>Nothing public yet</p>
          <p className="muted" style={{ margin: 0 }}>
            Public competitions will show up here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {list.map((c) => {
            const habits = (habitIdsByScope['competition:' + c.id] || []).map((id) => habitsById[id]).filter(Boolean);
            const memberCount = (membersByComp[c.id] || []).length;
            return (
              <div className="discover-row card" key={c.id}>
                <div>
                  <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 15 }}>{c.name}</p>
                  <div className="habit-chip-row">
                    {habits.slice(0, 4).map((h) => (
                      <HabitChip habit={h} key={h.id} />
                    ))}
                  </div>
                  <p className="faint" style={{ margin: '6px 0 0', fontSize: 12 }}>
                    {memberCount} member{memberCount === 1 ? '' : 's'} · Goal {c.goal_points} pts
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    const { error } = await joinPublic(c.id);
                    if (error) return toast('Could not join');
                    toast('Joined ' + c.name);
                    navigate(`/c/${c.id}/scoreboard`);
                  }}
                >
                  Join
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
