import { useState } from 'react';
import type { Entry, Habit } from '../lib/types';
import { badgeThresholds, computeStats, fmtYMD, parseYMD, todayStr } from '../lib/scoring';
import { useData } from '../context/DataContext';

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="faint" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

function cellColors(status: string | undefined, streakDay: number) {
  if (!status) return { bg: 'var(--bg-sunken)', color: 'var(--ink-faint)', border: '1px solid var(--line)' };
  if (status === 'done') {
    const intensity = Math.min(1, 0.35 + (streakDay || 1) * 0.045);
    return { bg: `color-mix(in srgb, var(--accent) ${Math.round(intensity * 100)}%, var(--bg-sunken))`, color: '#fff', border: '1px solid transparent' };
  }
  if (status === 'grace') return { bg: 'var(--gold-soft)', color: 'var(--gold)', border: '1px dashed var(--gold)' };
  if (status === 'reset') return { bg: 'var(--clay-soft)', color: 'var(--clay)', border: '1px solid var(--clay)' };
  return { bg: 'var(--bg-sunken)', color: 'var(--ink-faint)', border: '1px solid var(--line)' };
}

function MonthCalendar({ profileId, habit, stats, editable }: { profileId: string; habit: Habit; stats: ReturnType<typeof computeStats>; editable: boolean }) {
  const { toggleEntry } = useData();
  const [cursor, setCursor] = useState(todayStr());
  const cursorDate = parseYMD(cursor);
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const todayKey = todayStr();

  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button className="icon-btn" onClick={() => setCursor(fmtYMD(new Date(year, month - 1, 1)))}>
          ←
        </button>
        <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 16 }}>
          {cursorDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button className="icon-btn" onClick={() => setCursor(fmtYMD(new Date(year, month + 1, 1)))}>
          →
        </button>
      </div>
      <div className="cal-grid">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div className="cal-dow" key={d}>
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const key = fmtYMD(new Date(year, month, day));
          const so = stats.statusByPeriod[key];
          const streakDay = so && so.status === 'done' ? so.streakDay || 0 : 0;
          const colors = cellColors(so?.status, streakDay);
          return (
            <button
              key={idx}
              className="cal-cell"
              title={key + (so ? ' — ' + so.status : '')}
              style={{
                background: colors.bg,
                color: colors.color,
                border: colors.border,
                boxShadow: key === todayKey ? '0 0 0 2px var(--ink) inset' : undefined,
                cursor: editable ? 'pointer' : 'default',
              }}
              onClick={editable ? () => toggleEntry(profileId, habit.id, key) : undefined}
            >
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodStrip({ profileId, habit, stats, editable }: { profileId: string; habit: Habit; stats: ReturnType<typeof computeStats>; editable: boolean }) {
  const { toggleEntry } = useData();
  const keys = Object.keys(stats.statusByPeriod).sort();
  const recent = keys.slice(-30);
  return (
    <div className="period-strip">
      {recent.map((k) => {
        const so = stats.statusByPeriod[k];
        const colors = cellColors(so.status, so.streakDay || 0);
        const short = habit.frequency === 'monthly' ? k.slice(5) : k.split('-W')[1];
        return (
          <button
            key={k}
            className="period-chip"
            title={k + ' — ' + so.status}
            style={{ background: colors.bg, color: colors.color, border: colors.border, cursor: editable ? 'pointer' : 'default' }}
            onClick={editable ? () => toggleEntry(profileId, habit.id, k) : undefined}
          >
            {(habit.frequency === 'monthly' ? 'M' : 'W') + short}
          </button>
        );
      })}
    </div>
  );
}

export function BadgesBlock({ stats, frequency, title }: { stats: ReturnType<typeof computeStats>; frequency: Habit['frequency']; title?: string }) {
  const thresholds = badgeThresholds(frequency);
  return (
    <div>
      {title && <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>}
      <div className="badge-grid">
        {thresholds.map((b) => {
          const unlocked = stats.longestStreak >= b.n;
          return (
            <div className={'badge' + (unlocked ? '' : ' locked')} key={b.n}>
              <span className="bicon">{b.icon}</span>
              <span className="blabel">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarBlock({
  profileId,
  habit,
  entries,
  editable,
}: {
  profileId: string;
  habit: Habit;
  entries: Entry[];
  editable: boolean;
}) {
  const stats = computeStats(entries, habit.frequency);
  return (
    <div>
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 18 }}>
        <StatBlock label="Current Streak" value={stats.currentStreak} />
        <StatBlock label="Longest Streak" value={stats.longestStreak} />
        <StatBlock label="Total Points" value={stats.totalScore} />
      </div>
      {habit.frequency === 'daily' ? (
        <MonthCalendar profileId={profileId} habit={habit} stats={stats} editable={editable} />
      ) : (
        <PeriodStrip profileId={profileId} habit={habit} stats={stats} editable={editable} />
      )}
      <div className="legend" style={{ marginTop: 16 }}>
        <span>
          <span className="legend-dot" style={{ background: 'var(--accent)' }}></span>Done
        </span>
        <span>
          <span className="legend-dot" style={{ background: 'var(--gold-soft)', border: '1px dashed var(--gold)' }}></span>Missed once (grace)
        </span>
        <span>
          <span className="legend-dot" style={{ background: 'var(--clay-soft)', border: '1px solid var(--clay)' }}></span>Streak reset
        </span>
        <span>
          <span className="legend-dot" style={{ background: 'var(--bg-sunken)', border: '1px solid var(--line)' }}></span>Upcoming
        </span>
      </div>
      <div style={{ marginTop: 18 }}>
        <BadgesBlock stats={stats} frequency={habit.frequency} title={`Badges — ${habit.name}`} />
      </div>
    </div>
  );
}
