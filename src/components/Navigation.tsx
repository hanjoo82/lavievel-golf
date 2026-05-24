'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, PenLine, BarChart2, Calendar, Settings } from 'lucide-react';

const nav = [
  { href: '/',          label: '홈',     fullLabel: '대시보드',       icon: LayoutGrid },
  { href: '/grouping',  label: '조편성', fullLabel: '조편성',         icon: Users },
  { href: '/score',     label: '스코어', fullLabel: '스코어 입력',    icon: PenLine },
  { href: '/stats',     label: '통계',   fullLabel: '연간 통계',      icon: BarChart2 },
  { href: '/schedule',  label: '일정',   fullLabel: '월례회 일정',    icon: Calendar },
  { href: '/admin',     label: '관리',   fullLabel: '멤버·일정 관리', icon: Settings },
];

export default function Navigation() {
  const path = usePathname();
  return (
    <>
      <aside className="sidebar-desktop">
        <div className="sidebar-logo">
          <div className="logo-title">La Vie Belle</div>
          <div className="logo-sub">Golf Club · 2026</div>
        </div>
        <nav className="sidebar-nav">
          {nav.map(({ href, fullLabel, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div className={`sidebar-item ${active ? 'active' : ''}`}>
                  <Icon size={16} />{fullLabel}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="next-round-card">
            <div className="next-round-label">2026 시즌</div>
            <div className="next-round-date">La Vie Belle</div>
            <div className="next-round-venue">Golf Club ⛳</div>
          </div>
        </div>
      </aside>

      <header className="mobile-header">
        <div className="mobile-logo">
          <span className="mobile-logo-text">La Vie Belle ⛳</span>
          <span className="mobile-logo-sub">Golf Club · 2026</span>
        </div>
      </header>

      <nav className="bottom-tab-bar">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none', flex: 1 }}>
              <div className={`tab-item ${active ? 'tab-active' : ''}`}>
                <Icon size={21} />
                <span>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
