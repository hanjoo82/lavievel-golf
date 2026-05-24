'use client';
import { useEffect, useState } from 'react';
import {
  getRounds, getGrouping, getAllActiveMembers,
  getMemberScores, computeHandicap, saveScore, completeRound,
  type Round, type Grouping, type Member,
} from '@/lib/supabase';
import { SectionTitle, Spinner, Avatar } from '@/components/ui';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Users, CheckCircle } from 'lucide-react';

type Group = 'A조' | 'B조' | 'C조' | 'D조';
const GC: Record<Group, { bg: string; border: string; color: string }> = {
  'A조': { bg: '#F5EAEA', border: '#E8C4C4', color: '#8B5C5C' },
  'B조': { bg: '#EAE8F5', border: '#C4C0E0', color: '#5A2A7A' },
  'C조': { bg: '#EAF5EA', border: '#C0E0C0', color: '#2A7A2A' },
  'D조': { bg: '#F5F0EA', border: '#E0D4C0', color: '#7A5A2A' },
};

type ScoreEntry = {
  grouping: Grouping;
  member: Member;
  gross: string;
  net: number | null;
  handicap: number;
};

export default function ScorePage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selected, setSelected] = useState<Round | null>(null);
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [noGrouping, setNoGrouping] = useState(false);

  useEffect(() => { loadRounds(); }, []);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const loadRounds = async () => {
    const allRounds = await getRounds();
    const sorted = [...allRounds].sort((a,b) => new Date(a.round_date).getTime() - new Date(b.round_date).getTime());
    const upcoming2 = sorted.filter(r => !r.is_completed);
    const completed2 = sorted.filter(r => r.is_completed);
    setRounds([...upcoming2, ...completed2]);
    const upcoming = sorted.filter(r => !r.is_completed);
    if (upcoming.length > 0) await loadGrouping(upcoming[0]);
    setLoading(false);
  };

  const loadGrouping = async (round: Round) => {
    setSelected(round); setEntries([]); setNoGrouping(false);
    try {
      const [grouping, allMembers] = await Promise.all([
        getGrouping(round.id),
        getAllActiveMembers(),
      ]);

      if (grouping.length === 0) { setNoGrouping(true); return; }

      // UUID로 멤버 매핑 (정규멤버 + 게스트 모두 포함)
      const memberMap: Record<string, Member> = {};
      allMembers.forEach(m => { memberMap[m.id] = m; });

      const withScores: ScoreEntry[] = await Promise.all(
        grouping.map(async g => {
          const member = memberMap[g.member_id];
          let handicap = 0;
          if (member && !member.is_guest) {
            const scores = await getMemberScores(g.member_id);
            handicap = computeHandicap(scores.map(s => s.gross_score));
          }
          return { grouping: g, member, gross: '', net: null, handicap };
        })
      );
      setEntries(withScores.filter(e => e.member)); // 멤버 없는 항목 제외
    } catch (e: any) { showToast('❌ 오류: ' + e.message); }
  };

  const updateGross = (id: string, val: string) => {
    setEntries(prev => prev.map(e => e.grouping.id !== id ? e : {
      ...e, gross: val,
      net: isNaN(parseInt(val)) ? null : parseInt(val) - Math.round(e.handicap),
    }));
  };

  const handleSave = async () => {
    if (!selected) return;
    // 게스트 제외 정규멤버만 스코어 저장
    const filled = entries.filter(e => e.gross !== '' && !e.member.is_guest);
    if (!filled.length) { showToast('정규 멤버 스코어를 입력해 주세요'); return; }
    setSaving(true);
    try {
      await Promise.all(filled.map(e =>
        saveScore(selected.id, e.grouping.member_id, e.grouping.group_name, parseInt(e.gross), e.handicap)
      ));
      const allFilled = entries.filter(e => !e.member.is_guest).every(e => e.gross !== '');
      if (allFilled) {
        await completeRound(selected.id, true);
        showToast('✅ 저장 완료! 라운드 완료 처리됐습니다');
        await loadRounds();
      } else {
        showToast('✅ 스코어가 저장되었습니다');
      }
    } catch (e: any) { showToast('❌ 저장 실패: ' + e.message); }
    finally { setSaving(false); }
  };

  const groups = entries.reduce((acc, e) => {
    const g = e.grouping.group_name as Group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(e);
    return acc;
  }, {} as Record<Group, ScoreEntry[]>);
  const usedGroups = (Object.keys(groups) as Group[]).sort();

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>;

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <SectionTitle>라운드 선택</SectionTitle>
      {rounds.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 14, color: 'var(--text)' }}>등록된 라운드가 없어요</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {rounds.slice(0, 6).map(r => (
            <button key={r.id} onClick={() => loadGrouping(r)} style={{
              padding: '9px 16px', borderRadius: 99,
              border: `1px solid ${selected?.id === r.id ? 'var(--rose-deep)' : 'var(--border)'}`,
              background: selected?.id === r.id ? 'var(--rose-deep)' : 'white',
              color: selected?.id === r.id ? 'white' : 'var(--text-mid)',
              fontWeight: selected?.id === r.id ? 600 : 400,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              opacity: r.is_completed ? 0.6 : 1,
            }}>
              {format(new Date(r.round_date), 'M월 d일', { locale: ko })}
              {r.is_completed && ' ✓'}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          {noGrouping ? (
            <div style={{ background: '#FFF8E8', border: '1px solid #F0D080', borderRadius: 12, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#7A5A00', marginBottom: 6 }}>저장된 조편성이 없어요</div>
              <div style={{ fontSize: 12, color: '#8A6A10' }}>먼저 <strong>조편성 탭</strong>에서 저장해 주세요</div>
            </div>
          ) : (
            <>
              {usedGroups.map(g => (
                <div key={g} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, marginBottom: 8, background: GC[g].bg, border: `1px solid ${GC[g].border}` }}>
                    <Users size={14} color={GC[g].color} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: GC[g].color }}>{g}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{groups[g].length}명</span>
                  </div>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px 52px', padding: '8px 14px', background: 'var(--cream-dark)', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <div>멤버</div>
                      <div style={{ textAlign: 'center' }}>그로스</div>
                      <div style={{ textAlign: 'center' }}>넷</div>
                      <div style={{ textAlign: 'center' }}>핸디</div>
                    </div>
                    {groups[g].map((entry, i, arr) => (
                      <div key={entry.grouping.id} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 72px 52px', padding: '10px 14px', alignItems: 'center', borderBottom: i < arr.length - 1 ? '1px solid #FAF7F2' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar member={entry.member} size={32} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{entry.member.name}</div>
                            {entry.member.is_guest && <div style={{ fontSize: 10, color: 'var(--text-light)' }}>게스트</div>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          {entry.member.is_guest ? (
                            <div style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center' }}>-</div>
                          ) : (
                            <input type="number" inputMode="numeric" placeholder="--" value={entry.gross}
                              onChange={e => updateGross(entry.grouping.id, e.target.value)}
                              style={{ width: 60, height: 36, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--text)', background: entry.gross ? '#FDF8EE' : 'var(--cream)', border: `1px solid ${entry.gross ? '#E8D5A0' : 'var(--border)'}`, borderRadius: 8, outline: 'none', fontFamily: 'inherit' }} />
                          )}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 36, borderRadius: 8, background: entry.net !== null ? '#F5EAEA' : 'var(--cream-dark)', fontSize: 14, fontWeight: entry.net !== null ? 600 : 400, color: entry.net !== null ? 'var(--rose-deep)' : 'var(--text-light)' }}>
                            {entry.member.is_guest ? '-' : entry.net !== null ? entry.net : '--'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-light)' }}>
                          {entry.member.is_guest ? '-' : entry.handicap}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button className="btn-primary" onClick={handleSave} disabled={saving}
                style={{ width: '100%', fontSize: 15, padding: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle size={17} />
                {saving ? '저장 중...' : '스코어 저장'}
              </button>
            </>
          )}
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 85, left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: 'white', padding: '12px 22px', borderRadius: 10, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
