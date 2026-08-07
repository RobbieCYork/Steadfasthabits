export type Frequency = 'daily' | 'weekly' | 'monthly';
export type Visibility = 'public' | 'private';
export type ScopeType = 'solo' | 'competition';
export type Category = 'faith' | 'health' | 'relationships' | 'mind' | 'custom';

export interface Profile {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Competition {
  id: string;
  name: string;
  goal_points: number;
  visibility: Visibility;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface CompetitionMember {
  competition_id: string;
  profile_id: string;
  joined_at: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: Category;
  frequency: Frequency;
  scope_type: ScopeType;
  scope_id: string;
  owner_id: string;
  created_at: string;
}

export interface Entry {
  profile_id: string;
  habit_id: string;
  period_key: string;
  created_at: string;
}

export interface Friendship {
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface PeriodStatus {
  status: 'done' | 'grace' | 'reset' | 'future';
  streakDay?: number;
}

export interface HabitStats {
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  doneCount: number;
  statusByPeriod: Record<string, PeriodStatus>;
}

export interface Badge {
  n: number;
  label: string;
  icon: string;
}
