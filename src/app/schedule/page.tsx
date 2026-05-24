'use client';
import { useEffect, useState } from 'react';
import { getRounds, getMembers, getRsvpByRound, updateRsvp, type Round, type Member, type RSVP } from '@/lib/supabase';
import { Avatar, SectionTitle, Spinner } from '@/components/ui';
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MapPin, Clock } from 'lucide-react';

const STATUS_CFG = {
  ok:      { label: '참석',   bg: '#F0F8F0', border: '#9BC49B', color: '#5A9A5A' },
  no:      { label: '불참',   bg: '#FFF0F0', border: '#E4A0A0', color: '#C07070' },
  pending: { label: '미응답', bg: 'var(--cream-dark)', border: 'var(--border)', color: 'var(--text-light)' },
};

export default function SchedulePage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [rsvpMap, setRsvpMap] = useState<Record<string, RSVP[]>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => { loadAll(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const loadAll = async () => {
    const [rs, ms] = await Promise.all([getRounds(), getMembers()]);
    setMembers(ms);
    setRounds(rs);
    const rsvpData: Record<string, RSVP[]> = {};
    for (const r of rs.filter(r => !r.is_completed).slice(0, 3)) {
      rsvpData[r.id] = await getRsvpByRound(r.id);
    }
    setRsvpMap(rsvpData);
    setLoading(false);
  };

  const nextRound = rounds
    .filter(r => !r.is_completed)
    .sort((a, b) => new Date(a.round_date).getTime() - new Date(b.round_date).getTime())[0];

  const dday = nextRound ? differenceInDays(new Date(nextRound.round_date), new Date()) : null;

  const getStatus = (roundId: string, memberId: string): 'ok' | 'no' | 'pending' =>
    rsvpMap[roundId]?.find(r => r.member_id === memberId)?.status ?? 'pending';

  const handleRsvp = async (roundId: string, memberId: string) => {
    const cur = getStatus(roundId, memberId);
    const next: 'ok' | 'no' | 'pending' =
      cur === 'pending' ? 'ok' : cur === 'ok' ? 'no' : 'pending';

    // UI 즉시 반영
    setRsvpMap(prev => {
      const list = [...(prev[roundId] ?? [])];
      const idx = list.findIndex(r => r.member_id === memberId);
      if (idx >= 0) list[idx] = { ...list[idx], status: next };
      else list.push({ id: Date.now().toString(), round_id: roundId, member_id: memberId, status: next, updated_at: '' });
      return { ...prev, [roundId]: list };
    });

    // DB 저장
    try {
      await updateRsvp(roundId, memberId, next);
    } catch (e: any) {
      showToast('❌ 저장 실패: ' + e.message);
      // 실패 시 원복
      setRsvpMap(prev => {
        const list = [...(prev[roundId] ?? [])];
        const idx = list.findIndex(r => r.member_id === memberId);
        if (idx >= 0) list[idx] = { ...list[idx], status: cur };
        return { ...prev, [roundId]: list };
      });
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>;

  return (
    <div style={{ padding: '20px 16px 40px' }}>

      {/* 다음 라운드 배너 */}
      {nextRound && (
        <div style={{
          background: 'linear-gradient(135deg, var(--rose-deep), #6B3A3A)',
          borderRadius: 18, padding: '22px 20px', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: 16, bottom: 8, fontSize: 60, opacity: 0.12 }}>⛳</div>
          {dday != null && (
            <div style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 13px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
              {dday === 0 ? 'D-Day' : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next Round</div>
          <div className="font-serif" style={{ fontSize: 28, fontWeight: 300, color: 'white', marginTop: 6 }}>
            {format(new Date(nextRound.round_date), 'M월 d일 (eee)', { locale: ko })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{nextRound.venue}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{nextRound.tee_time?.slice(0, 5)} 티오프</span>
            </div>
          </div>
        </div>
      )}

      {/* RSVP 참석 현황 — 4열 카드 그리드 */}
      {nextRound && (
        <>
          <SectionTitle>
            {format(new Date(nextRound.round_date), 'M월', { locale: ko })} 참석 현황
          </SectionTitle>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 12, textAlign: 'center' }}>
            이름을 탭하면 참석 → 불참 → 미응답 순으로 변경돼요
          </div>
          <div className="card" style={{ padding: '16px', marginBottom: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              {members.map(m => {
                const status = getStatus(nextRound.id, m.id);
                const cfg = STATUS_CFG[status];
                return (
                  <div
                    key={m.id}
                    onClick={() => handleRsvp(nextRound.id, m.id)}
                    style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: 12, padding: '14px 8px',
                      textAlign: 'center', cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <Avatar member={m} size={40} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                      {m.name}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: cfg.color,
                      background: 'rgba(255,255,255,0.6)',
                      borderRadius: 99, padding: '3px 8px',
                      display: 'inline-block',
                    }}>
                      {cfg.label}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 요약 */}
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
              <span style={{ color: '#5A9A5A', fontWeight: 600 }}>
                ✅ 참석 {rsvpMap[nextRound.id]?.filter(r => r.status === 'ok').length ?? 0}명
              </span>
              <span style={{ color: '#C47070', fontWeight: 600 }}>
                ❌ 불참 {rsvpMap[nextRound.id]?.filter(r => r.status === 'no').length ?? 0}명
              </span>
              <span style={{ color: 'var(--text-light)' }}>
                ⏳ 미응답 {members.length - (rsvpMap[nextRound.id]?.filter(r => r.status !== 'pending').length ?? 0)}명
              </span>
            </div>
          </div>
        </>
      )}

      {/* 연간 일정 */}
      <SectionTitle>2026 연간 일정</SectionTitle>
      <div className="card" style={{ overflow: 'hidden' }}>
        {rounds.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)', fontSize: 14 }}>
            등록된 일정이 없어요
          </div>
        ) : (
          rounds.map((r, i) => {
            const isNext = r.id === nextRound?.id;
            const dd = differenceInDays(new Date(r.round_date), new Date());
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                borderBottom: i < rounds.length - 1 ? '1px solid #FAF7F2' : 'none',
                background: isNext ? '#FDF8EE' : 'white',
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                  background: isNext ? 'var(--rose-deep)' : 'var(--cream)',
                  border: `1px solid ${isNext ? 'var(--rose-deep)' : 'var(--border)'}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1, color: isNext ? 'white' : 'var(--text)' }}>
                    {format(new Date(r.round_date), 'd')}
                  </div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', color: isNext ? 'rgba(255,255,255,0.7)' : 'var(--text-light)' }}>
                    {format(new Date(r.round_date), 'MMM', { locale: ko })}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                    {format(new Date(r.round_date), 'M월 d일 (eee)', { locale: ko })}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} color="var(--text-light)" />
                      <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.venue}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color="var(--text-light)" />
                      <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.tee_time?.slice(0, 5)} 티오프</span>
                    </div>
                  </div>
                </div>
                {r.is_completed ? (
                  <span style={{ background: '#F0F8F0', border: '1px solid #9BC49B', color: '#5A9A5A', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>완료</span>
                ) : (
                  <span style={{
                    background: isNext ? '#F5EAEA' : 'var(--cream-dark)',
                    border: `1px solid ${isNext ? 'var(--rose-dark)' : 'var(--border)'}`,
                    color: isNext ? 'var(--rose-deep)' : 'var(--text-light)',
                    borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}>
                    {dd >= 0 ? `D-${dd}` : `D+${Math.abs(dd)}`}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 85, left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: 'white', padding: '11px 22px', borderRadius: 10, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
