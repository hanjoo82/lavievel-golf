'use client';
import { useEffect, useState } from 'react';
import {
  getAllActiveMembers, getGuests, addGuest, getRounds, getRsvpByRound,
  getGrouping, saveGrouping, computeHandicap, getMemberScores,
  type Member, type Round, type RSVP,
} from '@/lib/supabase';
import { Avatar, SectionTitle, Spinner } from '@/components/ui';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Save, CheckCircle, Plus, X } from 'lucide-react';

type Group = 'A조' | 'B조' | 'C조' | 'D조';
const GROUP_LIST: Group[] = ['A조', 'B조', 'C조', 'D조'];
type Entry = { member: Member; group: Group | null; handicap: number; };

export default function GroupingPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selected, setSelected] = useState<Round | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group>('A조');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');

  // 게스트 추가 UI
  const [registeredGuests, setRegisteredGuests] = useState<Member[]>([]);
  const [showGuestPanel, setShowGuestPanel] = useState(false);
  const [guestInput, setGuestInput] = useState('');
  const [addingGuest, setAddingGuest] = useState(false);

  useEffect(() => { loadData(); }, []);

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(''), 2500);
  };

  const loadData = async () => {
    const [members, allRounds, guests] = await Promise.all([
      getAllActiveMembers(), getRounds(), getGuests(),
    ]);
    const upcoming = allRounds.filter(r => !r.is_completed)
      .sort((a,b) => new Date(a.round_date).getTime() - new Date(b.round_date).getTime());
    setRounds(upcoming);
    setRegisteredGuests(guests);
    if (upcoming.length > 0) await buildEntries(upcoming[0], members);
    setLoading(false);
  };

  const buildEntries = async (round: Round, membersList?: Member[]) => {
    setSelected(round); setSaved(false);
    const members = membersList ?? await getAllActiveMembers();

    let absentIds = new Set<string>();
    try {
      const rsvp: RSVP[] = await getRsvpByRound(round.id);
      absentIds = new Set(rsvp.filter(r => r.status === 'no').map(r => r.member_id));
    } catch {}

    let savedMap: Record<string, Group> = {};
    try {
      const existing = await getGrouping(round.id);
      existing.forEach(g => { savedMap[g.member_id] = g.group_name as Group; });
      if (existing.length > 0) setSaved(true);
    } catch {}

    // 정규멤버만 기본 entries (게스트는 별도로 추가)
    const regularMembers = members.filter(m => !m.is_guest);
    const newEntries: Entry[] = await Promise.all(
      regularMembers.map(async m => {
        const scores = await getMemberScores(m.id);
        const handi = computeHandicap(scores.map(s => s.gross_score));
        return {
          member: m,
          group: absentIds.has(m.id) ? null : (savedMap[m.id] || 'A조'),
          handicap: handi,
        };
      })
    );

    // 저장된 게스트 복원 (실제 UUID로 저장돼 있음)
    const savedGuestIds = Object.keys(savedMap).filter(id =>
      !regularMembers.find(m => m.id === id)
    );
    const allGuests = await getGuests();
    const guestEntries: Entry[] = savedGuestIds.map(id => {
      const gm = allGuests.find(g => g.id === id);
      if (!gm) return null;
      return { member: gm, group: savedMap[id], handicap: 0 };
    }).filter(Boolean) as Entry[];

    setEntries([...newEntries, ...guestEntries]);
    setActiveGroup('A조');
  };

  // 기존 등록 게스트 선택
  const handleSelectGuest = (guest: Member) => {
    if (entries.find(e => e.member.id === guest.id)) {
      showToast('이미 추가된 게스트예요');
      return;
    }
    setEntries(prev => [...prev, { member: guest, group: activeGroup, handicap: 0 }]);
    setShowGuestPanel(false);
    setSaved(false);
    showToast(`✅ ${guest.name} 추가됨`);
  };

  // 새 게스트 이름 입력 → DB 저장 → UUID로 추가
  const handleAddNewGuest = async () => {
    if (!guestInput.trim()) { showToast('이름을 입력해 주세요'); return; }
    if (entries.find(e => e.member.name === guestInput.trim())) {
      showToast('이미 추가된 이름이에요'); return;
    }
    setAddingGuest(true);
    try {
      // DB에 저장 → 실제 UUID 반환
      const newGuest = await addGuest(guestInput.trim());
      setEntries(prev => [...prev, { member: newGuest, group: activeGroup, handicap: 0 }]);
      setRegisteredGuests(prev => [...prev, newGuest]);
      setGuestInput('');
      setShowGuestPanel(false);
      setSaved(false);
      showToast(`✅ ${newGuest.name} 추가됨`);
    } catch (e: any) {
      showToast('❌ 게스트 추가 실패: ' + e.message);
    } finally {
      setAddingGuest(false);
    }
  };

  // 게스트 제거 (조편성에서만, DB 삭제 아님)
  const removeGuest = (memberId: string) => {
    setEntries(prev => prev.filter(e => e.member.id !== memberId));
    setSaved(false);
  };

  const handleTap = (memberId: string) => {
    setSaved(false);
    setEntries(prev => prev.map(e => {
      if (e.member.id !== memberId) return e;
      if (e.group === activeGroup) return { ...e, group: null };
      return { ...e, group: activeGroup };
    }));
  };

  const handleSave = async () => {
    if (!selected) return;
    const assigned = entries.filter(e => e.group !== null);
    if (!assigned.length) { showToast('조편성을 먼저 해주세요'); return; }
    setSaving(true);
    try {
      // 모든 memberId가 실제 UUID (임시ID 없음)
      await saveGrouping(selected.id, assigned.map(e => ({
        memberId: e.member.id,  // 항상 실제 UUID
        groupName: e.group!,
      })));
      setSaved(true);
      showToast('✅ 조편성이 저장되었습니다');
    } catch (e: any) {
      showToast('❌ 저장 실패: ' + e.message);
    } finally { setSaving(false); }
  };

  const byGroup = (g: Group) => entries.filter(e => e.group === g);
  const absentList = entries.filter(e => e.group === null);
  const regularMembers = entries.filter(e => !e.member.is_guest);
  const guestMembers = entries.filter(e => e.member.is_guest);
  // 아직 추가 안 된 등록 게스트만 드롭다운에 표시
  const availableGuests = registeredGuests.filter(g =>
    !entries.find(e => e.member.id === g.id)
  );

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>;

  const EntryRow = ({ entry, removable }: { entry: Entry; removable?: boolean }) => {
    const isAbsent = entry.group === null;
    const isInActive = entry.group === activeGroup;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 12,
        background: isAbsent ? '#FFF5F5' : isInActive ? '#FAF5F5' : 'white',
        border: `1px solid ${isAbsent ? '#FFCCCC' : isInActive ? '#E8C4C4' : 'var(--border)'}`,
        opacity: isAbsent ? 0.7 : 1, transition: 'all 0.15s',
      }}>
        {/* 클릭 영역: 아바타~뱃지 */}
        <div onClick={() => handleTap(entry.member.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}>
          <Avatar member={entry.member} size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: isAbsent ? '#C47070' : 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {entry.member.name}
              {entry.member.is_guest && <span style={{ fontSize: 10, background: 'var(--cream-dark)', color: 'var(--text-light)', borderRadius: 99, padding: '1px 6px' }}>게스트</span>}
            </div>
            {!entry.member.is_guest && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>핸디 {entry.handicap}</div>}
          </div>
          {isAbsent ? (
            <span style={{ fontSize: 12, fontWeight: 500, color: '#C47070', background: '#FFE8E8', borderRadius: 99, padding: '4px 12px' }}>불참</span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 500, borderRadius: 99, padding: '4px 12px', background: isInActive ? '#EDD8D8' : 'var(--cream-dark)', color: isInActive ? '#8B5C5C' : 'var(--text-mid)' }}>
              {entry.group}
            </span>
          )}
          <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isAbsent ? '#FFE8E8' : isInActive ? '#8B5C5C' : 'var(--cream-dark)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isAbsent ? '#C47070' : isInActive ? 'white' : 'transparent' }}>
              {isAbsent ? '✕' : isInActive ? '✓' : ''}
            </span>
          </div>
        </div>
        {/* 게스트 삭제 버튼 */}
        {removable && (
          <button onClick={() => removeGuest(entry.member.id)} style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', lineHeight: 0, flexShrink: 0, marginLeft: 4 }}>
            <X size={13} color="#C47070" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      <SectionTitle>라운드 선택</SectionTitle>
      {rounds.length === 0 ? (
        <div className="card" style={{ padding: '32px 20px', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 14, color: 'var(--text)' }}>예정된 라운드가 없어요</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>관리 탭에서 일정을 추가해 주세요</div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {rounds.map(r => (
            <button key={r.id} onClick={() => buildEntries(r)} style={{
              padding: '9px 16px', borderRadius: 99,
              border: `1px solid ${selected?.id === r.id ? '#8B5C5C' : 'var(--border)'}`,
              background: selected?.id === r.id ? '#8B5C5C' : 'white',
              color: selected?.id === r.id ? 'white' : 'var(--text-mid)',
              fontWeight: selected?.id === r.id ? 600 : 400,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            }}>
              {format(new Date(r.round_date), 'M월 d일 (eee)', { locale: ko })}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#F0F8F0', border: '1px solid #9BC49B', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#5A9A5A', fontWeight: 500 }}>
              <CheckCircle size={16} /> 조편성 저장됨 · 스코어 입력 탭에서 확인하세요
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: '10px 14px', background: 'var(--cream-dark)', borderRadius: 10, fontSize: 13 }}>
            <span style={{ color: '#5A9A5A', fontWeight: 600 }}>✅ 참석 {entries.filter(e => e.group !== null).length}명</span>
            <span style={{ color: '#C47070', fontWeight: 600 }}>❌ 불참 {absentList.length}명</span>
          </div>

          {/* 조 선택 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {GROUP_LIST.map(g => {
              const cnt = byGroup(g).length;
              const isActive = activeGroup === g;
              return (
                <button key={g} onClick={() => setActiveGroup(g)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 99,
                  background: isActive ? '#8B5C5C' : 'var(--cream-dark)',
                  border: `1px solid ${isActive ? '#8B5C5C' : 'var(--border)'}`,
                  color: isActive ? 'white' : 'var(--text-mid)',
                  fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {g}
                  {cnt > 0 && <span style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--text-light)', color: 'white', borderRadius: 99, padding: '1px 8px', fontSize: 12 }}>{cnt}</span>}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 12, color: '#8B5C5C', marginBottom: 12, padding: '8px 12px', background: '#FAF5F5', borderRadius: 8, borderLeft: '3px solid #C49090' }}>
            멤버를 탭하면 {activeGroup}으로 배정 · 같은 조 재탭 → 불참 처리
          </div>

          {/* 정규 멤버 */}
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>정규 멤버</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {regularMembers.map(entry => <EntryRow key={entry.member.id} entry={entry} />)}
          </div>

          {/* 게스트 */}
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>게스트</div>
          {guestMembers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {guestMembers.map(entry => <EntryRow key={entry.member.id} entry={entry} removable />)}
            </div>
          )}

          {/* 게스트 추가 패널 */}
          {showGuestPanel ? (
            <div className="card" style={{ padding: '16px', marginBottom: 16, border: '1px solid #E8C4C4' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>게스트 추가</div>

              {/* 기존 등록 게스트 드롭다운 */}
              {availableGuests.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>등록된 게스트</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {availableGuests.map(g => (
                      <button key={g.id} onClick={() => handleSelectGuest(g)} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 10,
                        background: 'var(--cream)', border: '1px solid var(--border)',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'background 0.15s',
                      }}>
                        <Avatar member={g} size={32} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{g.name}</span>
                        <span style={{ fontSize: 11, color: '#8B5C5C', marginLeft: 'auto' }}>선택 →</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', margin: '12px 0 8px', textAlign: 'center' }}>— 또는 새 게스트 입력 —</div>
                </div>
              )}

              {/* 새 게스트 이름 입력 */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input-field"
                  placeholder="새 게스트 이름"
                  value={guestInput}
                  onChange={e => setGuestInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNewGuest()}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button onClick={handleAddNewGuest} disabled={addingGuest} style={{
                  padding: '9px 16px', borderRadius: 10, background: '#8B5C5C',
                  color: 'white', border: 'none', fontFamily: 'inherit',
                  fontSize: 13, cursor: 'pointer', flexShrink: 0,
                  opacity: addingGuest ? 0.6 : 1,
                }}>
                  {addingGuest ? '추가 중...' : '추가'}
                </button>
                <button onClick={() => { setShowGuestPanel(false); setGuestInput(''); }} style={{
                  padding: '9px 12px', borderRadius: 10,
                  background: 'var(--cream-dark)', border: '1px solid var(--border)',
                  cursor: 'pointer', lineHeight: 0,
                }}>
                  <X size={14} color="var(--text-mid)" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowGuestPanel(true)} style={{
              width: '100%', padding: '11px 0', borderRadius: 10,
              border: '1px dashed var(--border)', background: 'white',
              color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginBottom: 16,
            }}>
              <Plus size={15} /> 게스트 추가
            </button>
          )}

          {/* 조편성 요약 */}
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>조편성 요약</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {GROUP_LIST.map(g => {
              const mems = byGroup(g);
              const isActive = activeGroup === g;
              return (
                <div key={g} onClick={() => setActiveGroup(g)} style={{
                  background: isActive ? '#FAF5F5' : 'white',
                  border: `1px solid ${isActive ? '#E8C4C4' : 'var(--border)'}`,
                  borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: mems.length > 0 ? 8 : 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#8B5C5C' : 'var(--text-mid)' }}>{g}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{mems.length}명</span>
                  </div>
                  {mems.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>미배정</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {mems.map(e => (
                        <div key={e.member.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Avatar member={e.member} size={20} />
                          <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{e.member.name}</span>
                          {e.member.is_guest && <span style={{ fontSize: 9, color: 'var(--text-light)', background: 'var(--cream-dark)', borderRadius: 99, padding: '1px 5px' }}>게스트</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', fontSize: 15, padding: '14px 0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#8B5C5C', color: 'white', border: 'none',
            borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
            opacity: saving ? 0.7 : 1,
          }}>
            <Save size={17} />
            {saving ? '저장 중...' : saved ? '조편성 수정 저장' : '조편성 저장'}
          </button>
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
