import type { Entry, Frequency, HabitStats, Badge } from './types';

// ---------- date / period helpers ----------

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

export function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

export function parseYMD(s: string): Date {
  const p = s.split('-');
  return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
}

export function fmtYMD(d: Date): string {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

export function isoWeekKey(d: Date): string {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  date.setDate(date.getDate() - day + 3);
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const fdDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - fdDay + 3);
  const weekNo = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
  return date.getFullYear() + '-W' + pad2(weekNo);
}

export function monthKey(d: Date): string {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
}

export function periodKeyForDate(freq: Frequency, date: Date): string {
  if (freq === 'weekly') return isoWeekKey(date);
  if (freq === 'monthly') return monthKey(date);
  return fmtYMD(date);
}

export function currentPeriodKey(freq: Frequency): string {
  return periodKeyForDate(freq, new Date());
}

export function mondayFromIsoWeekKey(key: string): Date {
  const parts = key.split('-W');
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);
  const jan4 = new Date(year, 0, 4);
  const jDay = (jan4.getDay() + 6) % 7;
  const mondayW1 = new Date(jan4.getTime());
  mondayW1.setDate(jan4.getDate() - jDay);
  const d = new Date(mondayW1.getTime());
  d.setDate(mondayW1.getDate() + (week - 1) * 7);
  return d;
}

export interface PeriodEntry {
  key: string;
  label: string;
}

export function periodSeries(freq: Frequency, fromDate: Date, toDate: Date): PeriodEntry[] {
  const out: PeriodEntry[] = [];
  let cur = new Date(fromDate.getTime());
  let guard = 0;
  if (freq === 'weekly') {
    const day = (cur.getDay() + 6) % 7;
    cur.setDate(cur.getDate() - day);
    while (cur <= toDate && guard < 2000) {
      out.push({ key: isoWeekKey(cur), label: 'Wk of ' + (cur.getMonth() + 1) + '/' + cur.getDate() });
      cur.setDate(cur.getDate() + 7);
      guard++;
    }
  } else if (freq === 'monthly') {
    cur = new Date(cur.getFullYear(), cur.getMonth(), 1);
    while (cur <= toDate && guard < 2000) {
      out.push({ key: monthKey(cur), label: cur.toLocaleString('en-US', { month: 'short' }) + " '" + ('' + cur.getFullYear()).slice(2) });
      cur.setMonth(cur.getMonth() + 1);
      guard++;
    }
  } else {
    cur.setHours(0, 0, 0, 0);
    while (cur <= toDate && guard < 4000) {
      out.push({ key: fmtYMD(cur), label: '' + cur.getDate() });
      cur.setDate(cur.getDate() + 1);
      guard++;
    }
  }
  return out;
}

// ---------- badges ----------

export function badgeThresholds(freq: Frequency): Badge[] {
  if (freq === 'weekly')
    return [
      { n: 2, label: 'Week 2', icon: '🌱' },
      { n: 4, label: 'Week 4', icon: '🌿' },
      { n: 8, label: '2 Months', icon: '🌳' },
      { n: 12, label: '3 Months', icon: '⛰️' },
      { n: 26, label: '6 Months', icon: '🔥' },
      { n: 52, label: '1 Year', icon: '🥈' },
      { n: 104, label: '2 Years', icon: '🥇' },
    ];
  if (freq === 'monthly')
    return [
      { n: 2, label: 'Month 2', icon: '🌱' },
      { n: 3, label: 'Month 3', icon: '🌿' },
      { n: 6, label: '6 Months', icon: '🌳' },
      { n: 9, label: '9 Months', icon: '⛰️' },
      { n: 12, label: '1 Year', icon: '🔥' },
      { n: 24, label: '2 Years', icon: '🥈' },
      { n: 36, label: '3 Years', icon: '🥇' },
    ];
  return [
    { n: 2, label: 'Day 2', icon: '🌱' },
    { n: 5, label: 'Day 5', icon: '🌿' },
    { n: 10, label: 'Day 10', icon: '🌳' },
    { n: 15, label: 'Day 15', icon: '⛰️' },
    { n: 30, label: 'Day 30', icon: '🔥' },
    { n: 90, label: '3 Months', icon: '🥉' },
    { n: 180, label: '6 Months', icon: '🥈' },
    { n: 365, label: '1 Year', icon: '🥇' },
  ];
}

export function earnedBadges(stats: HabitStats, freq: Frequency): Badge[] {
  return badgeThresholds(freq).filter((b) => stats.longestStreak >= b.n);
}

// ---------- scoring engine ----------
//
// Rules: day 1 of a streak earns 1 point, day 2 earns 2, day N earns N.
// Missing exactly one period in a row is a "grace" miss — the streak survives (no points that period).
// Missing two periods in a row resets the streak to zero; the next completion restarts at 1.

export function computeStats(entries: Entry[], freq: Frequency): HabitStats {
  const stats: HabitStats = { totalScore: 0, currentStreak: 0, longestStreak: 0, doneCount: entries.length, statusByPeriod: {} };
  if (entries.length === 0) return stats;

  const doneKeys = entries.map((e) => e.period_key).sort();
  const earliestKey = doneKeys[0];

  let fromDate: Date;
  if (freq === 'weekly') fromDate = mondayFromIsoWeekKey(earliestKey);
  else if (freq === 'monthly') {
    const mp = earliestKey.split('-');
    fromDate = new Date(parseInt(mp[0], 10), parseInt(mp[1], 10) - 1, 1);
  } else fromDate = parseYMD(earliestKey);

  const series = periodSeries(freq, fromDate, new Date());
  const nowKey = currentPeriodKey(freq);

  let streakDay = 0;
  let missed = 0;
  let longest = 0;
  let total = 0;

  for (const period of series) {
    const pk = period.key;
    const done = doneKeys.indexOf(pk) !== -1;
    if (done) {
      streakDay += 1;
      missed = 0;
      total += streakDay;
      if (streakDay > longest) longest = streakDay;
      stats.statusByPeriod[pk] = { status: 'done', streakDay };
    } else {
      missed += 1;
      if (pk > nowKey) {
        stats.statusByPeriod[pk] = { status: 'future' };
        continue;
      }
      if (missed >= 2) {
        if (streakDay > 0) streakDay = 0;
        stats.statusByPeriod[pk] = { status: 'reset' };
      } else {
        stats.statusByPeriod[pk] = { status: 'grace' };
      }
    }
  }

  stats.totalScore = total;
  stats.longestStreak = longest;
  stats.currentStreak = streakDay;
  return stats;
}
