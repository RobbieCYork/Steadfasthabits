import type { Habit } from '../lib/types';
import { CATEGORY_META } from '../lib/constants';

export function HabitChip({ habit }: { habit: Pick<Habit, 'icon' | 'name' | 'category'> }) {
  const meta = CATEGORY_META[habit.category] || CATEGORY_META.custom;
  return (
    <span className="pill" style={{ borderColor: 'transparent', background: meta.soft, color: meta.color }}>
      {habit.icon} {habit.name}
    </span>
  );
}
