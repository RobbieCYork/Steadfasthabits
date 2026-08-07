import type { Category, Frequency } from './types';

export const AVATAR_COLORS = ['#2F6B4C', '#B9822E', '#AD4A70', '#4E4FA0', '#276E71', '#A8462E', '#6B7F3E', '#7A5AA6'];

export const CATEGORY_META: Record<Category, { label: string; color: string; soft: string }> = {
  faith: { label: 'Faith', color: 'var(--indigo)', soft: 'var(--indigo-soft)' },
  health: { label: 'Health', color: 'var(--accent)', soft: 'var(--accent-soft)' },
  relationships: { label: 'Relationships', color: 'var(--rose)', soft: 'var(--rose-soft)' },
  mind: { label: 'Mind', color: 'var(--gold)', soft: 'var(--gold-soft)' },
  custom: { label: 'Custom', color: 'var(--teal)', soft: 'var(--teal-soft)' },
};

export interface CatalogHabit {
  name: string;
  icon: string;
  category: Category;
}

export const HABIT_CATALOG: CatalogHabit[] = [
  { name: 'No Alcohol', icon: '🚫', category: 'health' },
  { name: 'Bible Reading', icon: '📖', category: 'faith' },
  { name: 'Prayer Time', icon: '🙏', category: 'faith' },
  { name: 'Book Reading', icon: '📚', category: 'mind' },
  { name: 'Kind Word to Spouse', icon: '💗', category: 'relationships' },
  { name: 'Send an Encouraging Text', icon: '💬', category: 'relationships' },
  { name: 'Count My Calories', icon: '🍎', category: 'health' },
  { name: 'Walk 1 Mile', icon: '🚶', category: 'health' },
  { name: 'Go for a Jog', icon: '🏃', category: 'health' },
  { name: 'Exercise', icon: '💪', category: 'health' },
  { name: 'Meditate 10 Minutes', icon: '🧘', category: 'mind' },
  { name: 'Drink 8 Glasses of Water', icon: '💧', category: 'health' },
  { name: 'Write 3 Gratitudes', icon: '📝', category: 'mind' },
  { name: 'Family Dinner, No Phones', icon: '🍽️', category: 'relationships' },
  { name: 'Memorize Scripture', icon: '✨', category: 'faith' },
];

export const CUSTOM_ICONS = ['⭐', '🎯', '🎸', '🧩', '🎨', '🧗', '🚴', '🏋️', '🧵', '📐', '🧑‍🍳', '🌱', '☕', '🛏️', '🧴', '🐾'];

export const FREQ_LABEL: Record<Frequency, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

export interface Quote {
  text: string;
  by: string;
}

export const QUOTES: Quote[] = [
  { text: 'Habits are the compound interest of self-improvement.', by: 'James Clear, Atomic Habits' },
  { text: 'Small steps, repeated daily, outperform big efforts made rarely.', by: 'Steadfast' },
  { text: 'Progress hides in the days you almost skip.', by: 'Steadfast' },
  { text: 'You are not just building a habit — you are casting a vote for who you want to become.', by: 'Inspired by James Clear' },
  { text: 'Consistency compounds. Miss a day if you must, but never miss two in a row.', by: 'Steadfast' },
  { text: 'Discipline is choosing between what you want now and what you want most.', by: 'Steadfast' },
  { text: 'Systems, not goals, are what carry you through the days you do not feel like it.', by: 'Inspired by James Clear' },
];

export function randomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export function inviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
