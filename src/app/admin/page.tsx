'use client';
import { useEffect, useState } from 'react';
import {
  getMembers, getGuests, addMember, updateMember, deleteMember,
  getRounds, addRound, updateRound, deleteRound, completeRound,
  type Member, type Round,
} from '@/lib/supabase';
import { Avatar, Spinner } from '@/components/ui';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Check, X, CheckCircle, Circle } from 'lucide-react';

type Tab = 'members' | 'guests' | 'rounds';
const emptyMember = { name: '', nickname: '', phone: '' };
const emptyRound = { round_date: '', venue: '라비에벨 컨트리클럽', tee_time: '08:00', notes: '' };

const lbl: React.CSSProperties = {
  fontSize: 11, color: 'var(--text-light)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5,
};
const iconBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: 'var(--cream-dark)', border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [guests, setGuests] = useState<Member[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // 멤버 폼
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [isGuestForm, setIsGuestForm] = useState(false);
  const [mName, setMName] = useState('');
  const [mNick, setMNick] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [savingM, setSavingM] = useState(false);

  // 라운드 폼
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [editRound, setEditRound] = useState<Round | null>(null);
  const [rDate, setRDate] = useState('');
  const [rVenue, setRVenue] = useState('라비에벨 컨트리클럽');
  const [rTime, setRTime] = useState('08:00');
  const [rNotes, setRNotes] = useState('');
  const [savingR, setSavingR] = useState(false);

  useEffect(() => { loadAll(); }, []);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const loadAll = async () => {
    setLoading(true);
    const [m, g, r] = await Promise.all([getMembers(), getGuests(), getRounds()]);
    setMembers(m); setGuests(g); setRounds(r); setLoading(false);
  };

  const openMemberForm = (isGuest: boolean, m?: Member) => {
    setIsGuestForm(isGuest);
    setEditMember(m || null);
    setMName(m?.name || '');
    setMNick(m?.nickname || '');
    setMPhone(m?.phone || '');
    setShowMemberForm(true);
  };

  const closeMemberForm = () => {
    setShowMemberForm(false);
    setEditMember(null);
    setMName(''); setMNick(''); setMPhone('');
  };

  const handleSaveMember = async () => {
    if (!mName.trim()) { showToast('이름을 입력해 주세요'); return; }
    setSavingM(true);
    try {
      if (editMember) {
        await updateMember(editMember.id, mName, mNick || mName.slice(-2), mPhone);
        showToast('✅ 수정되었습니다');
      } else {
        await addMember(mName, mNick || mName.slice(-2), mPhone, isGuestForm);
        showToast(`✅ ${isGuestForm ? '게스트' : '멤버'}가 추가되었습니다`);
      }
      closeMemberForm();
      await loadAll();
    } catch { showToast('❌ 저장 실패'); }
    finally { setSavingM(false); }
  };

  const handleDeleteMember = async (m: Member) => {
    if (!confirm(`'${m.name}'을 삭제할까요?`)) return;
    await deleteMember(m.id);
    showToast('삭제되었습니다');
    await loadAll();
  };

  const openRoundForm = (r?: Round) => {
    setEditRound(r || null);
    setRDate(r?.round_date || '');
    setRVenue(r?.venue || '라비에벨 컨트리클럽');
    setRTime(r?.tee_time?.slice(0, 5) || '08:00');
    setRNotes(r?.notes || '');
    setShowRoundForm(true);
  };

  const closeRoundForm = () => {
    setShowRoundForm(false);
    setEditRound(null);
    setRDate(''); setRVenue('라비에벨 컨트리클럽'); setRTime('08:00'); setRNotes('');
  };

  const handleSaveRound = async () => {
    if (!rDate) { showToast('날짜를 선택해 주세요'); return; }
    setSavingR(true);
    try {
      if (editRound) {
        await updateRound(editRound.id, rDate, rVenue, rTime, rNotes);
        showToast('✅ 일정이 수정되었습니다');
      } else {
        await addRound(rDate, rVenue, rTime, rNotes);
        showToast('✅ 일정이 추가되었습니다');
      }
      closeRoundForm();
      await loadAll();
    } catch { showToast('❌ 저장 실패'); }
    finally { setSavingR(false); }
  };

  const handleDeleteRound = async (r: Round) => {
    if (!confirm(`${format(new Date(r.round_date), 'M월 d일', { locale: ko })} 일정을 삭제할까요?`)) return;
    await deleteRound(r.id);
    showToast('삭제되었습니다');
    await loadAll();
  };

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>;

  // 멤버 폼 JSX (내부 컴포넌트 아닌 인라인)
  const memberFormJSX = showMemberForm && (
    <div className="card" style={{ padding: '20px', marginBottom: 16, border: '1px solid var(--rose-dark)' }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        {editMember ? '정보 수정' : isGuestForm ? '게스트 추가' : '멤버 추가'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={lbl}>이름 *</div>
          <input
            className="input-field"
            placeholder="예: 김서연"
            value={mName}
            onChange={e => setMName(e.target.value)}
          />
        </div>
        <div>
          <div style={lbl}>닉네임</div>
          <input
            className="input-field"
            placeholder="자동 입력"
            value={mNick}
            onChange={e => setMNick(e.target.value)}
          />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={lbl}>연락처 (선택)</div>
        <input
          className="input-field"
          placeholder="010-0000-0000"
          value={mPhone}
          onChange={e => setMPhone(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" onClick={handleSaveMember} disabled={savingM}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Check size={14} /> {savingM ? '저장 중...' : '저장'}
        </button>
        <button className="btn-secondary" onClick={closeMemberForm}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <X size={14} /> 취소
        </button>
      </div>
    </div>
  );

  const roundFormJSX = showRoundForm && (
    <div className="card" style={{ padding: '20px', marginBottom: 16, border: '1px solid var(--rose-dark)' }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
        {editRound ? '일정 수정' : '새 일정'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={lbl}>날짜 *</div>
          <input className="input-field" type="date" value={rDate} onChange={e => setRDate(e.target.value)} />
        </div>
        <div>
          <div style={lbl}>티오프</div>
          <input className="input-field" type="time" value={rTime} onChange={e => setRTime(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={lbl}>골프장</div>
        <input className="input-field" value={rVenue} onChange={e => setRVenue(e.target.value)} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={lbl}>메모</div>
        <input className="input-field" placeholder="특이사항" value={rNotes} onChange={e => setRNotes(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" onClick={handleSaveRound} disabled={savingR}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Check size={14} /> {savingR ? '저장 중...' : '저장'}
        </button>
        <button className="btn-secondary" onClick={closeRoundForm}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <X size={14} /> 취소
        </button>
      </div>
    </div>
  );

  const MemberRow = ({ m }: { m: Member }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #FAF7F2' }}>
      <Avatar member={m} size={40} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{m.phone || '연락처 없음'}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => openMemberForm(m.is_guest, m)} style={iconBtn}>
          <Pencil size={15} color="var(--text-mid)" />
        </button>
        <button onClick={() => handleDeleteMember(m)} style={{ ...iconBtn, background: '#FFF0F0', borderColor: '#FFCCCC' }}>
          <Trash2 size={15} color="#C47070" />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px 16px 40px' }}>
      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {([['members', '👥 정규 멤버'], ['guests', '🎫 게스트'], ['rounds', '📅 일정']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => { setTab(t); closeMemberForm(); closeRoundForm(); }} style={{
            flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13,
            border: `1px solid ${tab === t ? 'var(--rose-deep)' : 'var(--border)'}`,
            background: tab === t ? 'var(--rose-deep)' : 'white',
            color: tab === t ? 'white' : 'var(--text-mid)',
            fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {/* 정규 멤버 */}
      {tab === 'members' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-mid)' }}>총 {members.length}명</div>
            <button className="btn-primary" onClick={() => openMemberForm(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px' }}>
              <Plus size={15} /> 멤버 추가
            </button>
          </div>
          {memberFormJSX}
          {members.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 20 }}>멤버가 없어요</div>
              <button className="btn-primary" onClick={() => openMemberForm(false)}>첫 멤버 추가</button>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {members.map(m => <MemberRow key={m.id} m={m} />)}
            </div>
          )}
        </>
      )}

      {/* 게스트 */}
      {tab === 'guests' && (
        <>
          <div style={{ background: '#FFF8E8', border: '1px solid #F0D080', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#7A5A00' }}>
            💡 게스트를 미리 등록하면 조편성 화면에서 바로 선택할 수 있어요
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-mid)' }}>총 {guests.length}명</div>
            <button className="btn-primary" onClick={() => openMemberForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px' }}>
              <Plus size={15} /> 게스트 추가
            </button>
          </div>
          {memberFormJSX}
          {guests.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
              <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 20 }}>등록된 게스트가 없어요</div>
              <button className="btn-primary" onClick={() => openMemberForm(true)}>게스트 추가</button>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {guests.map(m => <MemberRow key={m.id} m={m} />)}
            </div>
          )}
        </>
      )}

      {/* 일정 */}
      {tab === 'rounds' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-mid)' }}>총 {rounds.length}개</div>
            <button className="btn-primary" onClick={() => openRoundForm()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px' }}>
              <Plus size={15} /> 일정 추가
            </button>
          </div>
          {roundFormJSX}
          {rounds.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 20 }}>일정이 없어요</div>
              <button className="btn-primary" onClick={() => openRoundForm()}>첫 일정 추가</button>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {rounds.map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < rounds.length - 1 ? '1px solid #FAF7F2' : 'none', background: r.is_completed ? '#F8FBF8' : 'white' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, background: r.is_completed ? '#E8F5E8' : 'var(--cream)', border: `1px solid ${r.is_completed ? '#9BC49B' : 'var(--border)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: r.is_completed ? '#5A9A5A' : 'var(--text)' }}>{format(new Date(r.round_date), 'd')}</div>
                    <div style={{ fontSize: 9, color: r.is_completed ? '#5A9A5A' : 'var(--text-light)', textTransform: 'uppercase' }}>{format(new Date(r.round_date), 'MMM', { locale: ko })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{format(new Date(r.round_date), 'yyyy년 M월 d일 (eee)', { locale: ko })}</div>
                      {r.is_completed && <span style={{ fontSize: 10, background: '#F0F8F0', border: '1px solid #9BC49B', color: '#5A9A5A', borderRadius: 99, padding: '2px 7px' }}>완료</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{r.venue} · {r.tee_time?.slice(0, 5)} 티오프{r.notes ? ` · ${r.notes}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button onClick={() => completeRound(r.id, !r.is_completed).then(loadAll)}
                      style={{ ...iconBtn, background: r.is_completed ? '#F0F8F0' : 'var(--cream-dark)', borderColor: r.is_completed ? '#9BC49B' : 'var(--border)' }}>
                      {r.is_completed ? <CheckCircle size={15} color="#5A9A5A" /> : <Circle size={15} color="var(--text-light)" />}
                    </button>
                    <button onClick={() => openRoundForm(r)} style={iconBtn}><Pencil size={15} color="var(--text-mid)" /></button>
                    <button onClick={() => handleDeleteRound(r)} style={{ ...iconBtn, background: '#FFF0F0', borderColor: '#FFCCCC' }}><Trash2 size={15} color="#C47070" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: 'var(--text)', color: 'white', padding: '12px 22px', borderRadius: 10, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
