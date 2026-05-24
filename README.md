# ⛳ La Vie Belle Golf Club — Web App

Next.js 14 + Supabase + Vercel 기반 골프 모임 관리 웹앱

---

## 🚀 Vercel 배포 전체 가이드

### STEP 1 — GitHub에 올리기

1. [github.com](https://github.com) 접속 → 로그인 → **New repository**
2. Repository name: `laviebelle-golf`
3. Private 선택 → **Create repository**
4. 로컬 터미널에서:

```bash
# 압축 폴더로 이동
cd C:\Users\HJ-L-202512-02\Desktop\GolfWeb

# Git 초기화
git init
git add .
git commit -m "첫 커밋"

# GitHub에 연결 (위에서 만든 저장소 주소로 교체)
git remote add origin https://github.com/YOUR_USERNAME/laviebelle-golf.git
git branch -M main
git push -u origin main
```

---

### STEP 2 — Supabase 설정

1. [supabase.com](https://supabase.com) → 새 프로젝트 생성
2. SQL Editor → `supabase_schema.sql` 전체 내용 붙여넣고 실행
3. Storage → **New Bucket** → 이름: `golf-gallery`, Public: **ON**
4. Settings → API → URL과 anon key 복사해두기

---

### STEP 3 — Vercel 배포

1. [vercel.com](https://vercel.com) 접속 → GitHub 계정으로 로그인
2. **Add New Project** → GitHub 저장소 `laviebelle-golf` 선택
3. **Environment Variables** 에 아래 두 값 입력:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |

4. **Deploy** 클릭 → 2~3분 후 완료!
5. `https://laviebelle-golf.vercel.app` 형태의 주소 자동 생성 🎉

---

### STEP 4 — next.config.js 도메인 수정

배포 후 `next.config.js` 에서 Supabase 프로젝트 ID를 실제 값으로 교체:

```js
images: {
  domains: ['실제_PROJECT_ID.supabase.co'],
}
```

---

## 📱 모바일에서도 잘 보여요?

네! Next.js로 만들어서 반응형이라 스마트폰 브라우저에서도 잘 보입니다.
홈 화면에 추가(Add to Home Screen)하면 앱처럼 사용할 수 있어요.

---

## 💰 비용

| 서비스 | 비용 |
|--------|------|
| Vercel | **무료** (Hobby 플랜) |
| Supabase | **무료** (Free 플랜, 500MB DB) |
| 합계 | **완전 무료** 🎉 |

---

## 📁 프로젝트 구조

```
GolfWeb/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 전체 레이아웃 (사이드바 포함)
│   │   ├── page.tsx            # 대시보드 (누적 랭킹)
│   │   ├── score/page.tsx      # 스코어 입력
│   │   ├── stats/page.tsx      # 연간 통계 & 차트
│   │   ├── schedule/page.tsx   # 월례회 일정 & RSVP
│   │   ├── gallery/page.tsx    # 사진 갤러리
│   │   └── members/page.tsx    # 멤버 관리
│   ├── components/
│   │   ├── ui.tsx              # 공통 컴포넌트
│   │   └── Sidebar.tsx         # 사이드바 네비게이션
│   ├── lib/
│   │   └── supabase.ts         # DB 연동 & 핸디캡 계산
│   └── styles/
│       └── globals.css         # 전역 스타일
├── supabase_schema.sql         # DB 스키마 + 시드 데이터
└── .env.local.example          # 환경변수 템플릿
```

---

## 🔄 업데이트 방법

코드 수정 후:
```bash
git add .
git commit -m "수정 내용"
git push
```
Vercel이 자동으로 재배포해줍니다!
