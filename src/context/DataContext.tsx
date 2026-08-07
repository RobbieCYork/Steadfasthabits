import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Competition, Entry, Habit, Profile, Category, Frequency, Visibility } from '../lib/types';
import { inviteCode as genInviteCode } from '../lib/constants';

interface DataState {
  loading: boolean;
  profilesById: Record<string, Profile>;
  competitionsById: Record<string, Competition>;
  myCompetitionIds: string[];
  discoverCompetitionIds: string[];
  membersByComp: Record<string, string[]>;
  habitsById: Record<string, Habit>;
  habitIdsByScope: Record<string, string[]>;
  entries: Record<string, Entry[]>; // key: `${profileId}|${habitId}`
  refreshAll: () => Promise<void>;
  toggleEntry: (profileId: string, habitId: string, periodKey: string) => Promise<void>;
  createCompetition: (name: string, goalPoints: number, visibility: Visibility, habitPicks: { name: string; icon: string; category: Category }[]) => Promise<string | null>;
  joinByCode: (code: string) => Promise<{ error: string | null; compId?: string }>;
  joinPublic: (competitionId: string) => Promise<{ error: string | null }>;
  addHabit: (scopeType: 'solo' | 'competition', scopeId: string, name: string, icon: string, category: Category, frequency: Frequency) => Promise<void>;
  setVisibility: (competitionId: string, visibility: Visibility) => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

function entryKey(profileId: string, habitId: string) {
  return profileId + '|' + habitId;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const myId = profile?.id;

  const [loading, setLoading] = useState(true);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [competitionsById, setCompetitionsById] = useState<Record<string, Competition>>({});
  const [myCompetitionIds, setMyCompetitionIds] = useState<string[]>([]);
  const [discoverCompetitionIds, setDiscoverCompetitionIds] = useState<string[]>([]);
  const [membersByComp, setMembersByComp] = useState<Record<string, string[]>>({});
  const [habitsById, setHabitsById] = useState<Record<string, Habit>>({});
  const [habitIdsByScope, setHabitIdsByScope] = useState<Record<string, string[]>>({});
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});

  const refreshingRef = useRef(false);
  const pendingAgainRef = useRef(false);

  const refreshAll = useCallback(async () => {
    if (!myId) return;
    if (refreshingRef.current) {
      pendingAgainRef.current = true;
      return;
    }
    refreshingRef.current = true;
    try {
      const { data: myMemberRows } = await supabase.from('competition_members').select('competition_id').eq('profile_id', myId);
      const myCompIdSet = new Set((myMemberRows || []).map((r) => r.competition_id as string));

      const { data: comps } = await supabase.from('competitions').select('*');
      const compsById: Record<string, Competition> = {};
      const mine: string[] = [];
      const discover: string[] = [];
      (comps || []).forEach((c) => {
        compsById[c.id] = c as Competition;
        const isMine = myCompIdSet.has(c.id) || c.owner_id === myId;
        if (isMine) mine.push(c.id);
        else if (c.visibility === 'public') discover.push(c.id);
      });

      // members for competitions I belong to (need full roster for scoreboard)
      let membersMap: Record<string, string[]> = {};
      if (mine.length) {
        const { data: memberRows } = await supabase.from('competition_members').select('competition_id, profile_id').in('competition_id', mine);
        membersMap = {};
        (memberRows || []).forEach((r) => {
          const cid = r.competition_id as string;
          if (!membersMap[cid]) membersMap[cid] = [];
          membersMap[cid].push(r.profile_id as string);
        });
      }

      // habits: my solo habits + habits for every visible competition (mine + discoverable, for preview chips)
      const allCompIds = [...mine, ...discover];
      let habitRows: Habit[] = [];
      {
        const { data: soloHabits } = await supabase.from('habits').select('*').eq('scope_type', 'solo').eq('scope_id', myId);
        const { data: compHabits } = allCompIds.length
          ? await supabase.from('habits').select('*').eq('scope_type', 'competition').in('scope_id', allCompIds)
          : { data: [] as Habit[] };
        habitRows = [...(soloHabits || []), ...(compHabits || [])] as Habit[];
      }
      const habById: Record<string, Habit> = {};
      const byScope: Record<string, string[]> = {};
      habitRows.forEach((h) => {
        habById[h.id] = h;
        const key = h.scope_type + ':' + h.scope_id;
        if (!byScope[key]) byScope[key] = [];
        byScope[key].push(h.id);
      });

      // entries: for all habits belonging to competitions I'm a member of (covers teammates) + my solo habits
      const relevantHabitIds = habitRows.filter((h) => h.scope_type === 'solo' || mine.includes(h.scope_id)).map((h) => h.id);
      let entryRows: Entry[] = [];
      if (relevantHabitIds.length) {
        const { data } = await supabase.from('entries').select('*').in('habit_id', relevantHabitIds);
        entryRows = (data || []) as Entry[];
      }
      const entryMap: Record<string, Entry[]> = {};
      entryRows.forEach((e) => {
        const key = entryKey(e.profile_id, e.habit_id);
        if (!entryMap[key]) entryMap[key] = [];
        entryMap[key].push(e);
      });

      // profiles: everyone referenced (owners, members)
      const profileIds = new Set<string>([myId]);
      Object.values(membersMap).forEach((arr) => arr.forEach((id) => profileIds.add(id)));
      Object.values(compsById).forEach((c) => profileIds.add(c.owner_id));
      let profById: Record<string, Profile> = {};
      if (profileIds.size) {
        const { data: profRows } = await supabase.from('profiles').select('*').in('id', Array.from(profileIds));
        (profRows || []).forEach((p) => {
          profById[p.id] = p as Profile;
        });
      }

      setCompetitionsById(compsById);
      setMyCompetitionIds(mine);
      setDiscoverCompetitionIds(discover);
      setMembersByComp(membersMap);
      setHabitsById(habById);
      setHabitIdsByScope(byScope);
      setEntries(entryMap);
      setProfilesById((prev) => ({ ...prev, ...profById }));
    } finally {
      refreshingRef.current = false;
      setLoading(false);
      if (pendingAgainRef.current) {
        pendingAgainRef.current = false;
        refreshAll();
      }
    }
  }, [myId]);

  useEffect(() => {
    if (myId) refreshAll();
  }, [myId, refreshAll]);

  // realtime: any change on these tables triggers a debounced refetch
  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => refreshAll(), 350);
    };
    const channel = supabase
      .channel('steadfast-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competitions' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_members' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits' }, debouncedRefresh)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [session, refreshAll]);

  async function toggleEntry(profileId: string, habitId: string, periodKey: string) {
    const key = entryKey(profileId, habitId);
    const existing = entries[key] || [];
    const has = existing.some((e) => e.period_key === periodKey);

    // optimistic update
    setEntries((prev) => {
      const next = { ...prev };
      if (has) next[key] = (prev[key] || []).filter((e) => e.period_key !== periodKey);
      else next[key] = [...(prev[key] || []), { profile_id: profileId, habit_id: habitId, period_key: periodKey, created_at: new Date().toISOString() }];
      return next;
    });

    if (has) {
      const { error } = await supabase.from('entries').delete().match({ profile_id: profileId, habit_id: habitId, period_key: periodKey });
      if (error) refreshAll();
    } else {
      const { error } = await supabase.from('entries').insert({ profile_id: profileId, habit_id: habitId, period_key: periodKey });
      if (error) refreshAll();
    }
  }

  async function createCompetition(
    name: string,
    goalPoints: number,
    visibility: Visibility,
    habitPicks: { name: string; icon: string; category: Category }[]
  ): Promise<string | null> {
    if (!myId) return null;
    const { data: comp, error } = await supabase
      .from('competitions')
      .insert({ name, goal_points: goalPoints, visibility, invite_code: genInviteCode(), owner_id: myId })
      .select('*')
      .single();
    if (error || !comp) return null;

    await supabase.from('competition_members').insert({ competition_id: comp.id, profile_id: myId });

    if (habitPicks.length) {
      await supabase.from('habits').insert(
        habitPicks.map((h) => ({
          name: h.name,
          icon: h.icon,
          category: h.category,
          frequency: 'daily' as Frequency,
          scope_type: 'competition' as const,
          scope_id: comp.id,
          owner_id: myId,
        }))
      );
    }
    await refreshAll();
    return comp.id as string;
  }

  async function joinByCode(code: string): Promise<{ error: string | null; compId?: string }> {
    const { data, error } = await supabase.rpc('join_competition', { p_code: code.trim().toUpperCase() });
    if (error) return { error: error.message };
    await refreshAll();
    return { error: null, compId: data as string };
  }

  async function joinPublic(competitionId: string): Promise<{ error: string | null }> {
    const { error } = await supabase.rpc('join_competition', { p_competition_id: competitionId });
    if (error) return { error: error.message };
    await refreshAll();
    return { error: null };
  }

  async function addHabit(scopeType: 'solo' | 'competition', scopeId: string, name: string, icon: string, category: Category, frequency: Frequency) {
    if (!myId) return;
    await supabase.from('habits').insert({ name, icon, category, frequency, scope_type: scopeType, scope_id: scopeId, owner_id: myId });
    await refreshAll();
  }

  async function setVisibility(competitionId: string, visibility: Visibility) {
    await supabase.from('competitions').update({ visibility }).eq('id', competitionId);
    await refreshAll();
  }

  return (
    <DataContext.Provider
      value={{
        loading,
        profilesById,
        competitionsById,
        myCompetitionIds,
        discoverCompetitionIds,
        membersByComp,
        habitsById,
        habitIdsByScope,
        entries,
        refreshAll,
        toggleEntry,
        createCompetition,
        joinByCode,
        joinPublic,
        addHabit,
        setVisibility,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
