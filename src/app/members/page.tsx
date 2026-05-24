'use client';
import { useEffect, useState } from 'react';
import { getMembers, getMemberScores, computeHandicap, type Member } from '@/lib/supabase';
import { Avatar, SectionTitle, Spinner } from '@/components/ui';

type MS = { member: Member; avg: number; best: number; handicap: number; games: number; };

export default function MembersPage() {
  const [memberStats, setMemberStats] = useState<MS[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMembers().then(async members => {
      const stats = await Promise.all(members.map(async m => {
        const scores = await getMemberScores(m.id);
        const completed = scores.filter(s => (s.round as any)?.is_completed);
        const grossList = completed.map(s => s.gross_score);
        const avg = grossList.length ? Math.round(grossList.reduce((a, b) => a + b, 0) / grossList.length * 10) / 10 : 0;
        const best = grossList.length ? Math.min(...grossList) : 0;
        return { member: m, avg, best, handicap: computeHandicap(grossList), games: completed.length };
      }));
      setMemberStats(stats);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 32 }}><Spinner /></div>;

  return (
    <div style={{ padding: '24px 20px 40px' }}>
      <SectionTitle>정규 멤버 · 8명</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
        {memberStats.map(({ member, avg, best, handicap, games }) => (
          <div key={member.id} className="card card-hover" style={{ padding: '24px 20px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Avatar member={member} size={56} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{member.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 14 }}>정규멤버 · {games}회 참가</div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: '평균', value: avg || '-', highlight: false },
                { label: '핸디', value: handicap || '-', highlight: false },
                { label: '베스트', value: best || '-', highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ background: 'var(--cream)', borderRadius: 8, padding: '8px 4px' }}>
                  <div className="font-serif" style={{ fontSize: 18, fontWeight: 400, color: highlight ? 'var(--rose-deep)' : 'var(--text)' }}>{value}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Guest section */}
      <SectionTitle>게스트 관리</SectionTitle>
      <div className="card" style={{ padding: '20px 24px', borderStyle: 'dashed', cursor: 'pointer', textAlign: 'center' }}
        onClick={() => alert('스코어 입력 화면에서 게스트를 추가할 수 있습니다')}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>게스트 초대</div>
        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>스코어 입력 시 게스트 추가 가능</div>
      </div>
    </div>
  );
}
