'use client';
import { useEffect, useState } from 'react';
import { getRanking, getRounds, type Round } from '@/lib/supabase';
import { StatCard, Avatar, SectionTitle, EmptyState, Spinner } from '@/components/ui';
import { differenceInDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MapPin, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRanking(), getRounds()]).then(([ranks, rs]) => {
      setRanking(ranks); setRounds(rs);
    }).finally(() => setLoading(false));
  }, []);

  const upcomingRounds = rounds.filter(r => !r.is_completed)
    .sort((a,b) => new Date(a.round_date).getTime() - new Date(b.round_date).getTime());
  const nextRound = upcomingRounds[0] ?? null;
  const dday = nextRound ? differenceInDays(new Date(nextRound.round_date), new Date()) : null;
  const completedCount = rounds.filter(r => r.is_completed).length;
  const activeRanking = ranking.filter(r => r.games > 0);
  const avgScore = activeRanking.length ? Math.round(activeRanking.reduce((a,b)=>a+b.avg,0)/activeRanking.length*10)/10 : 0;
  const avgHandi = activeRanking.length ? Math.round(activeRanking.reduce((a,b)=>a+b.handicap,0)/activeRanking.length*10)/10 : 0;
  const bestScore = activeRanking.filter(r=>r.best>0).length ? Math.min(...activeRanking.filter(r=>r.best>0).map(r=>r.best)) : 0;

  // 순위 번호 스타일
  const rankBadge = (i: number) => {
    if (i === 0) return { bg: '#C9A84C', color: '#fff' };
    if (i === 1) return { bg: '#B4B2A9', color: '#fff' };
    if (i === 2) return { bg: '#D3D1C7', color: '#5F5E5A' };
    return { bg: 'var(--cream-dark)', color: 'var(--text-light)' };
  };

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>;

  return (
    <div style={{ padding: '20px 16px 40px' }}>

      {/* 배너 */}
      {nextRound ? (
        <div className="fade-up" style={{ background: '#8B5C5C', borderRadius: 18, padding: '22px 22px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 16, bottom: 8, fontSize: 60, opacity: 0.1 }}>⛳</div>
          {dday != null && (
            <div style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.2)', borderRadius: 99, padding: '4px 13px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
              {dday === 0 ? 'D-Day' : dday > 0 ? `D-${dday}` : `D+${Math.abs(dday)}`}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Next Round</div>
          <div style={{ fontSize: 22, fontWeight: 400, color: '#fff', marginBottom: 12, letterSpacing: '0.02em' }}>
            {format(new Date(nextRound.round_date), 'M월 d일 (eee)', { locale: ko })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={12} color="rgba(255,255,255,0.65)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{nextRound.venue}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} color="rgba(255,255,255,0.65)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{nextRound.tee_time?.slice(0,5)} 티오프</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="fade-up" style={{ background: '#8B5C5C', borderRadius: 18, padding: '22px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 16, bottom: 8, fontSize: 60, opacity: 0.1 }}>⛳</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>La Vie Belle Golf Club</div>
          <div style={{ fontSize: 22, color: '#fff', marginTop: 6 }}>안녕하세요 👋</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>예정된 라운드가 없어요</div>
        </div>
      )}

      {/* 예정 일정 */}
      {upcomingRounds.length > 1 && (
        <div className="fade-up-2" style={{ marginBottom: 20 }}>
          <SectionTitle>예정 일정</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingRounds.slice(1, 4).map(r => {
              const dd = differenceInDays(new Date(r.round_date), new Date());
              return (
                <div key={r.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: 'var(--cream)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1, color: 'var(--text)' }}>{format(new Date(r.round_date), 'd')}</div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--text-light)' }}>{format(new Date(r.round_date), 'MMM', { locale: ko })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>{format(new Date(r.round_date), 'M월 d일 (eee)', { locale: ko })}</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} color="var(--text-light)" /><span style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.venue}</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} color="var(--text-light)" /><span style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.tee_time?.slice(0,5)}</span></div>
                    </div>
                  </div>
                  <div style={{ background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: 99, padding: '3px 10px', fontSize: 11, color: 'var(--text-mid)', fontWeight: 500, flexShrink: 0 }}>
                    {dd >= 0 ? `D-${dd}` : `D+${Math.abs(dd)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="fade-up-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatCard label="평균 스코어" value={avgScore ? `${avgScore}타` : '-'} accent="rose" />
        <StatCard label="평균 핸디" value={avgHandi ? `${avgHandi}` : '-'} accent="sage" />
        <StatCard label="시즌 베스트" value={bestScore ? `${bestScore}타` : '-'} accent="gold" />
        <StatCard label="시즌 회차" value={`${completedCount}회차`} sub="2026 시즌" accent="mauve" />
      </div>

      {/* 누적 랭킹 */}
      <div className="fade-up-3">
        <SectionTitle>누적 랭킹</SectionTitle>
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 52px 44px 52px', padding: '8px 14px', background: 'var(--cream-dark)', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <div />
            <div>멤버</div>
            <div style={{ textAlign: 'center' }}>평균</div>
            <div style={{ textAlign: 'center' }}>핸디</div>
            <div style={{ textAlign: 'center' }}>베스트</div>
          </div>

          {ranking.length === 0 ? (
            <EmptyState message="아직 스코어가 없어요" />
          ) : (
            ranking.map((item, i) => {
              const hasScore = item.games > 0;
              const rb = rankBadge(i);
              return (
                <div key={item.member.id} style={{
                  display: 'grid', gridTemplateColumns: '32px 1fr 52px 44px 52px',
                  padding: '12px 14px', alignItems: 'center',
                  borderBottom: i < ranking.length - 1 ? '1px solid #FAF7F2' : 'none',
                  background: i === 0 && hasScore ? '#FDF8F0' : 'white',
                  opacity: hasScore ? 1 : 0.45,
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: rb.bg, color: rb.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{i + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar member={item.member} size={32} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2320' }}>{item.member.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 1 }}>{item.games > 0 ? `${item.games}회 참가` : '미참가'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 13, fontWeight: i === 0 && hasScore ? 600 : 400, color: i === 0 && hasScore ? 'var(--rose-deep)' : 'var(--text)' }}>
                    {item.avg || '-'}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {hasScore ? (
                      <span style={{ fontSize: 11, background: 'var(--cream-dark)', color: 'var(--text-mid)', borderRadius: 99, padding: '2px 8px' }}>{item.handicap}</span>
                    ) : <span style={{ fontSize: 12, color: 'var(--text-light)' }}>-</span>}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text)' }}>{item.best || '-'}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
