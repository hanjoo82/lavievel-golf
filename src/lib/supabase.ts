import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Member = {
  id: string; name: string; nickname: string; phone?: string;
  avatar_color: string; avatar_text_color: string;
  is_active: boolean; is_guest: boolean; created_at: string;
};
export type Round = {
  id: string; round_date: string; venue: string; tee_time: string;
  weather?: string; notes?: string; is_completed: boolean; created_at: string;
};
export type Score = {
  id: string; round_id: string; member_id: string; group_name: string;
  gross_score: number; net_score?: number; created_at: string;
  member?: Member; round?: Round;
};
export type RSVP = {
  id: string; round_id: string; member_id: string;
  status: 'ok' | 'no' | 'pending'; updated_at: string;
};
export type Grouping = {
  id: string; round_id: string; member_id: string;
  group_name: string; created_at: string;
};

// 연그레이 아바타 — 모든 멤버/게스트 동일
const AVATAR_BG = '#EAEAEA';
const AVATAR_TC = '#5A5A5A';

// ── 멤버 ──────────────────────────────────────────────────
export const getMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase.from('members').select('*')
    .eq('is_active', true).eq('is_guest', false).order('created_at');
  if (error) throw error; return data ?? [];
};
export const getGuests = async (): Promise<Member[]> => {
  const { data, error } = await supabase.from('members').select('*')
    .eq('is_active', true).eq('is_guest', true).order('created_at');
  if (error) throw error; return data ?? [];
};
export const getAllActiveMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase.from('members').select('*')
    .eq('is_active', true).order('is_guest').order('created_at');
  if (error) throw error; return data ?? [];
};
export const addMember = async (name: string, nickname: string, phone?: string, isGuest = false): Promise<void> => {
  const { error } = await supabase.from('members').insert({
    name,
    nickname: nickname || name.slice(-2),
    phone: phone || null,
    avatar_color: AVATAR_BG,
    avatar_text_color: AVATAR_TC,
    is_active: true,
    is_guest: isGuest,
  });
  if (error) throw error;
};
export const addGuest = async (name: string): Promise<Member> => {
  const { data, error } = await supabase.from('members').insert({
    name: name.trim(),
    nickname: name.trim().slice(-2),
    phone: null,
    avatar_color: AVATAR_BG,
    avatar_text_color: AVATAR_TC,
    is_active: true,
    is_guest: true,
  }).select('*').single();
  if (error) throw error;
  return data;
};
export const deleteMember = async (id: string): Promise<void> => {
  const { error } = await supabase.from('members').update({ is_active: false }).eq('id', id);
  if (error) throw error;
};
export const updateMember = async (id: string, name: string, nickname: string, phone?: string): Promise<void> => {
  const { error } = await supabase.from('members').update({
    name, nickname, phone: phone || null,
    avatar_color: AVATAR_BG, avatar_text_color: AVATAR_TC,
  }).eq('id', id);
  if (error) throw error;
};

// ── 라운드 ─────────────────────────────────────────────────
export const getRounds = async (): Promise<Round[]> => {
  const { data, error } = await supabase.from('rounds').select('*').order('round_date');
  if (error) throw error; return data ?? [];
};
export const addRound = async (round_date: string, venue: string, tee_time: string, notes?: string) => {
  const { error } = await supabase.from('rounds').insert({
    round_date, venue: venue || '라비에벨 컨트리클럽',
    tee_time: tee_time || '08:00', notes: notes || null, is_completed: false,
  });
  if (error) throw error;
};
export const deleteRound = async (id: string) => {
  const { error } = await supabase.from('rounds').delete().eq('id', id);
  if (error) throw error;
};
export const updateRound = async (id: string, round_date: string, venue: string, tee_time: string, notes?: string) => {
  const { error } = await supabase.from('rounds').update({ round_date, venue, tee_time, notes: notes || null }).eq('id', id);
  if (error) throw error;
};
export const completeRound = async (id: string, completed: boolean) => {
  const { error } = await supabase.from('rounds').update({ is_completed: completed }).eq('id', id);
  if (error) throw error;
};

// ── 조편성 ─────────────────────────────────────────────────
export const getGrouping = async (roundId: string): Promise<Grouping[]> => {
  const { data, error } = await supabase
    .from('groupings')
    .select('id, round_id, member_id, group_name, created_at')
    .eq('round_id', roundId);
  if (error) throw error; return data ?? [];
};
export const saveGrouping = async (
  roundId: string,
  assignments: { memberId: string; groupName: string }[]
): Promise<void> => {
  await supabase.from('groupings').delete().eq('round_id', roundId);
  if (!assignments.length) return;
  const { error } = await supabase.from('groupings').insert(
    assignments.map(a => ({ round_id: roundId, member_id: a.memberId, group_name: a.groupName }))
  );
  if (error) throw error;
};

// ── 스코어 ─────────────────────────────────────────────────
export const getMemberScores = async (memberId: string): Promise<Score[]> => {
  const { data, error } = await supabase.from('scores').select('*, round:rounds(*)')
    .eq('member_id', memberId).order('created_at', { ascending: false });
  if (error) throw error; return data ?? [];
};
export const saveScore = async (roundId: string, memberId: string, groupName: string, grossScore: number, handicap: number) => {
  const { error } = await supabase.from('scores').upsert({
    round_id: roundId, member_id: memberId, group_name: groupName,
    gross_score: grossScore, net_score: grossScore - Math.round(handicap),
  }, { onConflict: 'round_id,member_id' });
  if (error) throw error;
};

// ── 핸디캡 ─────────────────────────────────────────────────
export const computeHandicap = (scores: number[]): number => {
  if (!scores.length) return 0;
  const recent = scores.slice(0, 5);
  if (recent.length < 3) return Math.max(Math.round((recent.reduce((a,b)=>a+b,0)/recent.length-72)*10)/10, 0);
  const sorted = [...recent].sort((a,b)=>a-b);
  const trimmed = sorted.slice(1, sorted.length-1);
  return Math.max(Math.round((trimmed.reduce((a,b)=>a+b,0)/trimmed.length-72)*10)/10, 0);
};

// ── RSVP ───────────────────────────────────────────────────
export const getRsvpByRound = async (roundId: string): Promise<RSVP[]> => {
  const { data, error } = await supabase.from('rsvp').select('*').eq('round_id', roundId);
  if (error) throw error; return data ?? [];
};
export const updateRsvp = async (roundId: string, memberId: string, status: 'ok'|'no'|'pending') => {
  const { data: ex } = await supabase.from('rsvp').select('id')
    .eq('round_id', roundId).eq('member_id', memberId).single();
  if (ex) {
    const { error } = await supabase.from('rsvp')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('round_id', roundId).eq('member_id', memberId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('rsvp')
      .insert({ round_id: roundId, member_id: memberId, status, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
};

// ── 랭킹 ───────────────────────────────────────────────────
export const getRanking = async () => {
  const members = await getMembers();
  const ranking = await Promise.all(members.map(async m => {
    const scores = await getMemberScores(m.id);
    const completed = scores.filter(s => (s.round as any)?.is_completed);
    const grossList = completed.map(s => s.gross_score);
    const avg = grossList.length ? Math.round(grossList.reduce((a,b)=>a+b,0)/grossList.length*10)/10 : 0;
    const best = grossList.length ? Math.min(...grossList) : 0;
    return { member: m, avg, best, handicap: computeHandicap(grossList), games: completed.length };
  }));
  return ranking.sort((a,b) => {
    if (!a.games && !b.games) return 0;
    if (!a.games) return 1; if (!b.games) return -1;
    return a.avg - b.avg;
  });
};
