import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useRouter } from '../lib/router';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/Avatar';
import { HabitRow } from '../components/HabitRow';
import { CalendarBlock } from '../components/CalendarBlock';
import { AddHabitModal } from '../components/AddHabitModal';
import { computeStats } from '../lib/scoring';
import type { Visibility } from '../lib/types';

type Tab = 'scoreboard' | 'calendar' | 'habits' | 'invite';

export function CompetitionPage({ compId, tab }: { compId: string; tab: Tab }) {
  const { profile } = useAuth();
  const { competitionsById, membersByComp, profilesById, habitIdsByScope, habitsById, entries, setVisibility } = useData();
  const { navigate } = useRouter();

  const competition = competitionsById[compId];
  const memberIds = membersByComp[compId] || [];
  const habitIds = habitIdsByScope['competition:' + compId] || [];
  const habits = habitIds.map((id) => habitsById[id]).filter(Boolean);

  const [showAdd, setShowAdd] = useState(false);
  const [calMember, setCalMember] = useState<string | null>(null);
  const [calHabitId, setCalHabitId] = useState<string | null>(null);

  if (!competition || !profile) {
    return (
      <div className="empty-state card">
        <div className="ico">📭</div>
        <p className="muted" style={{ margin: 0 }}>
          Loading competition, or you don't have access to it yet.
        </p>
      </div>
    );
  }

  const activeMemberId = calMember && memberIds.includes(calMember) ? calMember : memberIds[0] || null;
  const activeHabitId = calHabitId && habits.some((h) => h.id === calHabitId) ? calHabitId : habits[0]?.id || null;
  const activeHabit = activeHabitId ? habitsById[activeHabitId] : null;

  function goTab(t: Tab) {
    navigate(`/c/${compId}/${t}`);
  }

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/')}>
        ← Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 className="section-title">{competition.name}</h2>
          <p className="muted">
            {memberIds.length} member{memberIds.length === 1 ? '' : 's'} · Goal: {competition.goal_points} points ·{' '}
            {competition.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
          </p>
        </div>
      </div>

      <div className="tabnav" style={{ margin: '18px 0' }}>
        <button className={tab === 'scoreboard' ? 'active' : ''} onClick={() => goTab('scoreboard')}>
          🏆 Scoreboard
        </button>
        <button className={tab === 'calendar' ? 'active' : ''} onClick={() => goTab('calendar')}>
          📅 Calendar
        </button>
        <button className={tab === 'habits' ? 'active' : ''} onClick={() => goTab('habits')}>
          ✅ Habits
        </button>
        <button className={tab === 'invite' ? 'active' : ''} onClick={() => goTab('invite')}>
          🔗 Invite
        </button>
      </div>

      {tab === 'scoreboard' && (
        <Scoreboard
          memberIds={memberIds}
          habits={habits}
          goalPoints={competition.goal_points}
          myId={profile.id}
          onViewMember={(id) => {
            setCalMember(id);
            goTab('calendar');
          }}
        />
      )}

      {tab === 'calendar' && (
        <div>
          <div className="eyebrow">Member</div>
          <div style={{ height: 8 }} />
          <div className="habit-chip-row">
            {memberIds.map((id) => {
              const p = profilesById[id];
              if (!p) return null;
              const active = activeMemberId === id;
              return (
                <button
                  key={id}
                  className="pill"
                  style={active ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' } : {}}
                  onClick={() => setCalMember(id)}
                >
                  <Avatar profile={p} /> {p.name}
                </button>
              );
            })}
          </div>
          <div className="eyebrow" style={{ marginTop: 14 }}>
            Habit
          </div>
          <div style={{ height: 8 }} />
          <div className="habit-chip-row">
            {habits.map((h) => {
              const active = activeHabitId === h.id;
              return (
                <button key={h.id} className="pill" style={active ? { background: 'var(--teal)', color: '#fff', borderColor: 'var(--teal)' } : {}} onClick={() => setCalHabitId(h.id)}>
                  {h.icon} {h.name}
                </button>
              );
            })}
          </div>
          {activeHabit && activeMemberId ? (
            <div className="card" style={{ padding: 20, marginTop: 18 }}>
              <CalendarBlock
                profileId={activeMemberId}
                habit={activeHabit}
                entries={entries[activeMemberId + '|' + activeHabit.id] || []}
                editable={activeMemberId === profile.id}
              />
            </div>
          ) : (
            <div className="empty-state card" style={{ marginTop: 18 }}>
              <div className="ico">📭</div>
              <p className="muted" style={{ margin: 0 }}>
                No habits to show yet.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'habits' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {habits.map((h) => (
              <HabitRow habit={h} profileId={profile.id} entries={entries[profile.id + '|' + h.id] || []} key={h.id} />
            ))}
          </div>
          <button className="btn btn-soft" style={{ marginTop: 14 }} onClick={() => setShowAdd(true)}>
            + Add Habit to This Competition
          </button>
        </div>
      )}

      {tab === 'invite' && (
        <InviteTab
          inviteCode={competition.invite_code}
          visibility={competition.visibility}
          memberIds={memberIds}
          onSetVisibility={(v) => setVisibility(compId, v)}
        />
      )}

      {showAdd && <AddHabitModal scopeType="competition" scopeId={compId} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function Scoreboard({
  memberIds,
  habits,
  goalPoints,
  myId,
  onViewMember,
}: {
  memberIds: string[];
  habits: ReturnType<typeof useData>['habitsById'][string][];
  goalPoints: number;
  myId: string;
  onViewMember: (id: string) => void;
}) {
  const { profilesById, entries } = useData();

  const ranked = useMemo(() => {
    return memberIds
      .map((id) => {
        const p = profilesById[id];
        const score = habits.reduce((sum, h) => sum + computeStats(entries[id + '|' + h.id] || [], h.frequency).totalScore, 0);
        return { p, score };
      })
      .filter((r) => r.p)
      .sort((a, b) => b.score - a.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIds, habits, entries, profilesById]);

  const winner = ranked.find((r) => r.score >= goalPoints);

  return (
    <div>
      {winner && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 16, background: 'var(--gold-soft)', borderColor: 'var(--gold)' }}>
          🏆 <strong>{winner.p.name}</strong> reached the goal of {goalPoints} points! Competition complete — keep going to stay steadfast.
        </div>
      )}
      <div className="card" style={{ padding: '8px 14px' }}>
        {ranked.map((r, i) => {
          const pct = goalPoints > 0 ? Math.min(100, Math.round((r.score / goalPoints) * 100)) : 0;
          return (
            <button className="board-row" key={r.p.id} onClick={() => onViewMember(r.p.id)}>
              <span className={'rank' + (i === 0 ? ' first' : '')}>{i === 0 ? '👑' : i + 1}</span>
              <span className="board-name-wrap">
                <Avatar profile={r.p} size="md" />
                <span className="board-name">
                  {r.p.name} {r.p.id === myId && <span className="faint" style={{ fontWeight: 600 }}>(you)</span>}
                </span>
              </span>
              <span className="board-progress">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: pct + '%', background: r.score >= goalPoints ? 'var(--gold)' : undefined }} />
                </div>
              </span>
              <span className="board-pts">
                {r.score} <span className="faint" style={{ fontWeight: 500 }}>/ {goalPoints}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InviteTab({
  inviteCode,
  visibility,
  memberIds,
  onSetVisibility,
}: {
  inviteCode: string;
  visibility: Visibility;
  memberIds: string[];
  onSetVisibility: (v: Visibility) => void;
}) {
  const { profilesById } = useData();
  const toast = useToast();

  return (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ fontWeight: 700, margin: '0 0 4px' }}>Invite friends or family</p>
      <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5 }}>
        Share this code — anyone with a Steadfast account can enter it to join, on any device.
      </p>
      <div className="invite-box">
        <span>{inviteCode}</span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(inviteCode).then(() => toast('Code copied'), () => toast('Code: ' + inviteCode));
            } else toast('Code: ' + inviteCode);
          }}
        >
          Copy
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        <p style={{ fontWeight: 700, margin: '0 0 8px', fontSize: 13.5 }}>Visibility</p>
        <div className="seg">
          <button className={visibility === 'private' ? 'sel' : ''} onClick={() => onSetVisibility('private')}>
            🔒 Private
          </button>
          <button className={visibility === 'public' ? 'sel' : ''} onClick={() => onSetVisibility('public')}>
            🌐 Public
          </button>
        </div>
        <p className="faint" style={{ fontSize: 12, margin: '8px 0 0' }}>
          {visibility === 'public' ? 'Anyone can find and join this from Discover.' : 'Only people with the invite code can join.'}
        </p>
      </div>

      <div style={{ marginTop: 20 }}>
        <p style={{ fontWeight: 700, margin: '0 0 8px', fontSize: 13.5 }}>Members</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {memberIds.map((id) => {
            const p = profilesById[id];
            if (!p) return null;
            return (
              <span className="pill" key={id}>
                <Avatar profile={p} /> {p.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
