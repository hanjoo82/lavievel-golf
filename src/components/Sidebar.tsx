'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, PenLine, BarChart2, Calendar, Images, Users } from 'lucide-react';

const nav = [
  { href: '/',          label: '대시보드', icon: LayoutGrid },
  { href: '/score',     label: '스코어 입력', icon: PenLine },
  { href: '/stats',     label: '연간 통계', icon: BarChart2 },
  { href: '/schedule',  label: '월례회 일정', icon: Calendar },
  { href: '/gallery',   label: '사진 갤러리', icon: Images },
  { href: '/members',   label: '멤버 관리', icon: Users },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{
      width: 220, background: 'white', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      position: 'sticky', top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 22px', borderBottom: '1px solid var(--border)' }}>
        <div className="font-serif" style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)', letterSpacing: '0.02em' }}>
          La Vie Belle
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-light)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>
          Golf Club · 2026
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '14px 0', flex: 1 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 24px', fontSize: 13, cursor: 'pointer',
                color: active ? 'var(--rose-deep)' : 'var(--text-mid)',
                background: active ? 'linear-gradient(90deg,#F5EAEA,transparent)' : 'transparent',
                borderLeft: active ? '2px solid var(--rose-dark)' : '2px solid transparent',
                fontWeight: active ? 500 : 400,
                transition: 'all 0.15s',
              }}>
                <Icon size={16} style={{ opacity: active ? 1 : 0.65 }} />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Next round mini card */}
      <div style={{ padding: '0 16px 24px' }}>
        <div style={{
          background: 'linear-gradient(135deg,#F5EAEA,#FDF5F5)',
          borderRadius: 10, padding: 14,
          border: '1px solid #EDD8D8',
        }}>
          <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--rose-deep)', marginBottom: 4 }}>Next Round</div>
          <div className="font-serif" style={{ fontSize: 20, fontWeight: 400, color: 'var(--text)' }}>6월 14일</div>
          <div style={{ fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>라비에벨 CC</div>
          <div style={{ fontSize: 11, color: 'var(--rose-dark)', marginTop: 6, fontWeight: 500 }}>D-22</div>
        </div>
      </div>
    </aside>
  );
}
