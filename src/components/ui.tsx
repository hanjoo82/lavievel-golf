'use client';
import React from 'react';
import type { Member } from '@/lib/supabase';

// ── Avatar ─────────────────────────────────────────────────
export function Avatar({ member, size = 40 }: { member: Member; size?: number }) {
  const fs = size < 34 ? 10 : size < 44 ? 12 : 14;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: member.avatar_color, color: member.avatar_text_color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: fs, fontWeight: 600, flexShrink: 0,
    }}>
      {member.nickname}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = 'rose' }: {
  label: string; value: string; sub?: string;
  accent?: 'rose' | 'sage' | 'gold' | 'mauve';
}) {
  const accents: Record<string, string> = {
    rose: 'linear-gradient(90deg,#E8C4C4,#C49090)',
    sage: 'linear-gradient(90deg,#C4D4C4,#8FA88F)',
    gold: 'linear-gradient(90deg,#E8D5A0,#C9A84C)',
    mauve: 'linear-gradient(90deg,#D4C4E0,#B09AC0)',
  };
  return (
    <div className="card" style={{ flex: 1, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accents[accent] }} />
      <div style={{ fontSize: 10, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4, marginBottom: 6 }}>{label}</div>
      <div className="font-serif" style={{ fontSize: 28, fontWeight: 400, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ── HandicapPill ───────────────────────────────────────────
export function HandicapPill({ value }: { value: number }) {
  return <span className="pill">{value}</span>;
}

// ── TrendBadge ─────────────────────────────────────────────
export function TrendBadge({ diff }: { diff: number }) {
  const color = diff === 0 ? 'var(--text-light)' : diff > 0 ? '#7BA87B' : '#C47070';
  return <span style={{ fontSize: 12, fontWeight: 500, color }}>{diff === 0 ? '—' : diff > 0 ? `↑ +${diff}` : `↓ ${diff}`}</span>;
}

// ── SectionTitle ───────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="section-title font-serif">{children}</h2>;
}

// ── RsvpChip ───────────────────────────────────────────────
const rsvpCfg = {
  ok:      { label: '참석',   bg: '#F0F8F0', border: '#9BC49B', color: '#5A9A5A' },
  no:      { label: '불참',   bg: '#FFF0F0', border: '#E4A0A0', color: '#C07070' },
  pending: { label: '미응답', bg: 'var(--cream-dark)', border: 'var(--border)', color: 'var(--text-light)' },
};
export function RsvpChip({ status, onClick }: { status: 'ok' | 'no' | 'pending'; onClick?: () => void }) {
  const c = rsvpCfg[status];
  return (
    <button onClick={onClick} style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 500,
      cursor: 'pointer', fontFamily: 'inherit',
    }}>{c.label}</button>
  );
}

// ── EmptyState ─────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-light)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⛳</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--rose-deep)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
