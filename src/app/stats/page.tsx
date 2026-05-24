'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getMembers, getMemberScores, computeHandicap, type Member } from '@/lib/supabase';
import { StatCard, Avatar, SectionTitle, Spinner } from '@/components/ui';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function StatsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ avg: 0, best: 0, worst: 0, handicap: 0, games: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMembers().then(list => { setMembers(list); if (list[0]) loadMember(list[0]); });
  }, []);

  const loadMember = async (m: Member) => {
    setSelected(m); setLoading(true);
    const scores = await getMemberScores(m.id);
    const completed = scores.filter(s => (s.round as any)?.is_completed);
    const grossList = completed.map(s => s.gross_score);
    const avg = grossList.length ? Math.round(grossList.reduce((a, b) => a + b, 0) / grossList.length * 10) / 10 : 0;
    const best = grossList.length ? Math.min(...grossList) : 0;
    const worst = grossList.length ? Math.max(...grossList) : 0;
    setStats({ avg, best, worst, handicap: computeHandicap(grossList), games: completed.length });
    setHistory([...completed].reverse().map((s, i) => ({
      month: (s.round as any)?.round_date ? format(new Date((s.round as any).round_date), 'M월', { locale: ko }) : `${i + 1}R`,
      score: s.gross_score,
      net: s.net_score,
      handicap: computeHandicap(grossList.slice(0, grossList.length - i)),
      date: (s.round as any)?.round_date,
      venue: (s.round as any)?.venue,
    })));
    setLoading(false);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 20px 40px' }}>
      {/* Member selector */}
      <SectionTitle>멤버 선택</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {members.map(m => (
          <button key={m.id} onClick={() => loadMember(m)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 14px 6px 8px', borderRadius: 99,
            border: `1px solid ${selected?.id === m.id ? 'var(--rose-dark)' : 'var(--border)'}`,
            background: selected?.id === m.id ? '#F5EAEA' : 'white',
            color: selected?.id === m.id ? 'var(--rose-deep)' : 'var(--text-mid)',
            fontWeight: selected?.id === m.id ? 500 : 400,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, transition: 'all 0.2s',
          }}>
            <Avatar member={m} size={24} />
            {m.name}
          </button>
        ))}
      </div>

      {/* Handicap note */}
      <div style={{ background: '#F5EAEA', borderRadius: 10, padding: '10px 14px', marginBottom: 24, fontSize: 12, color: 'var(--rose-deep)' }}>
        📌 핸디캡 계산: 최근 5회 중 최고·최저 제외 → 3회 평균
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 28 }}>
            <StatCard label="시즌 평균" value={stats.avg ? `${stats.avg}타` : '-'} accent="rose" />
            <StatCard label="핸디캡" value={stats.handicap ? `${stats.handicap}` : '-'} accent="sage" />
            <StatCard label="베스트" value={stats.best ? `${stats.best}타` : '-'} accent="gold" />
            <StatCard label="워스트" value={stats.worst ? `${stats.worst}타` : '-'} accent="mauve" />
            <StatCard label="참가 횟수" value={`${stats.games}회`} />
          </div>

          {/* Score chart */}
          <SectionTitle>월별 스코어 추이</SectionTitle>
          <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
            {history.length >= 2 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} domain={['dataMin - 3', 'dataMax + 3']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" name="그로스" stroke="var(--rose-deep)" strokeWidth={2} dot={{ fill: 'white', stroke: 'var(--rose-deep)', strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} />
                  <Line type="monotone" dataKey="net" name="넷스코어" stroke="var(--sage-dark)" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: 'white', stroke: 'var(--sage-dark)', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)', fontSize: 13 }}>데이터 2회 이상 필요</div>
            )}
          </div>

          {/* Handicap chart */}
          <SectionTitle>핸디캡 추이</SectionTitle>
          <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
            {history.length >= 2 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="handicap" name="핸디캡" stroke="var(--sage-dark)" strokeWidth={2} dot={{ fill: 'white', stroke: 'var(--sage-dark)', strokeWidth: 2, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)', fontSize: 13 }}>데이터가 부족합니다</div>
            )}
          </div>

          {/* History table */}
          <SectionTitle>라운드 이력</SectionTitle>
          <div className="card" style={{ overflow: 'hidden' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)', fontSize: 13 }}>기록이 없어요</div>
            ) : (
              [...history].reverse().map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < history.length - 1 ? '1px solid #FAF7F2' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                      {s.date ? format(new Date(s.date), 'yyyy년 M월 d일', { locale: ko }) : '-'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{s.venue}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 400, color: 'var(--rose-deep)' }}>{s.score}타</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>넷 {s.net ?? '-'} · 핸디 {s.handicap}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
