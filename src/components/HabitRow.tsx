import type { Entry, Habit } from '../lib/types';
import { CATEGORY_META, FREQ_LABEL } from '../lib/constants';
import { computeStats, currentPeriodKey } from '../lib/scoring';
import { earnedBadges } from '../lib/scoring';
import { useData } from '../context/DataContext';

export function HabitRow({ habit, profileId, entries, canEdit = true }: { habit: Habit; profileId: string; entries: Entry[]; canEdit?: boolean }) {
  const { toggleEntry } = useData();
  const stats = computeStats(entries, habit.frequency);
  const meta = CATEGORY_META[habit.category] || CATEGORY_META.custom;
  const pk = currentPeriodKey(habit.frequency);
  const done = entries.some((e) => e.period_key === pk);
  const badges = earnedBadges(stats, habit.frequency);

  return (
    <div className="habit-row">
      <span className="habit-icon" style={{ background: meta.soft, color: meta.color }}>
        {habit.icon}
      </span>
      <div className="habit-info">
        <div className="hname">{habit.name}</div>
        <div className="habit-meta">
          {FREQ_LABEL[habit.frequency]} · Streak {stats.currentStreak} · {stats.totalScore} pts
          {badges.length ? ` · ${badges.length} badge${badges.length === 1 ? '' : 's'}` : ''}
        </div>
      </div>
      {canEdit && (
        <button
          className={'check-btn' + (done ? ' done' : '')}
          title={done ? 'Mark not done' : 'Mark done for this period'}
          onClick={() => toggleEntry(profileId, habit.id, pk)}
        >
          {done ? '✓' : ''}
        </button>
      )}
    </div>
  );
}
