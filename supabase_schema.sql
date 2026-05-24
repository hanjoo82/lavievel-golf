-- =============================================
-- La Vie Belle Golf Club - Supabase Schema
-- =============================================

-- 멤버 테이블
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  nickname VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  avatar_color VARCHAR(10) DEFAULT '#E8C4C4',
  avatar_text_color VARCHAR(10) DEFAULT '#8B5C5C',
  is_active BOOLEAN DEFAULT true,
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 월례회 일정 테이블
CREATE TABLE rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_date DATE NOT NULL,
  venue VARCHAR(100) DEFAULT '라비에벨 컨트리클럽',
  tee_time TIME DEFAULT '08:00',
  weather VARCHAR(20),
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 스코어 테이블
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  group_name VARCHAR(5) DEFAULT 'A조',
  gross_score INT NOT NULL,
  net_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, member_id)
);

-- 핸디캡 이력 테이블 (자동 계산: 최근 5회 중 최고/최저 제외 → 3회 평균)
CREATE TABLE handicaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  handicap_value DECIMAL(4,1) NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSVP 테이블
CREATE TABLE rsvp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending', -- ok / no / pending
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, member_id)
);

-- 갤러리 테이블
CREATE TABLE gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID REFERENCES rounds(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption VARCHAR(100),
  uploaded_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 핸디캡 자동 계산 함수
-- 최근 5회 중 최고점(나쁜점수)·최저점(좋은점수) 제외 → 3회 평균
-- =============================================
CREATE OR REPLACE FUNCTION calculate_handicap(p_member_id UUID)
RETURNS DECIMAL(4,1) AS $$
DECLARE
  v_scores INT[];
  v_sorted INT[];
  v_avg DECIMAL(4,1);
  v_count INT;
BEGIN
  SELECT ARRAY_AGG(s.gross_score ORDER BY r.round_date DESC)
  INTO v_scores
  FROM scores s
  JOIN rounds r ON s.round_id = r.id
  WHERE s.member_id = p_member_id
    AND r.is_completed = true
  LIMIT 5;

  v_count := COALESCE(array_length(v_scores, 1), 0);

  IF v_count < 3 THEN
    -- 3회 미만이면 단순 평균
    SELECT AVG(s.gross_score) INTO v_avg
    FROM scores s
    JOIN rounds r ON s.round_id = r.id
    WHERE s.member_id = p_member_id AND r.is_completed = true;
    RETURN ROUND(v_avg - 72, 1);
  END IF;

  -- 최고·최저 제외 후 평균 (5회 기준)
  SELECT ROUND(AVG(val) - 72, 1) INTO v_avg
  FROM (
    SELECT gross_score AS val
    FROM scores s
    JOIN rounds r ON s.round_id = r.id
    WHERE s.member_id = p_member_id AND r.is_completed = true
    ORDER BY r.round_date DESC
    LIMIT 5
  ) recent
  WHERE val != (SELECT MIN(val) FROM (
    SELECT gross_score AS val FROM scores s JOIN rounds r ON s.round_id = r.id
    WHERE s.member_id = p_member_id AND r.is_completed = true
    ORDER BY r.round_date DESC LIMIT 5) t)
  AND val != (SELECT MAX(val) FROM (
    SELECT gross_score AS val FROM scores s JOIN rounds r ON s.round_id = r.id
    WHERE s.member_id = p_member_id AND r.is_completed = true
    ORDER BY r.round_date DESC LIMIT 5) t);

  RETURN GREATEST(v_avg, 0);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 시드 데이터 (8명 멤버)
-- =============================================
INSERT INTO members (name, nickname, avatar_color, avatar_text_color) VALUES
  ('김서연', '서연', '#F5DEB3', '#7A5A00'),
  ('이민지', '민지', '#D4E8D4', '#2A5A2A'),
  ('박지현', '지현', '#E8D4F0', '#5A2A7A'),
  ('최수아', '수아', '#FFE4E1', '#8B3A3A'),
  ('한유나', '유나', '#D4E8F0', '#1A5A7A'),
  ('정소희', '소희', '#F0E8D4', '#7A5A1A'),
  ('윤은서', '은서', '#E8F0D4', '#3A5A1A'),
  ('오채원', '채원', '#F0D4E8', '#7A1A5A');

-- Storage bucket (Supabase Dashboard에서 설정)
-- Bucket name: golf-gallery
-- Public: true

-- RLS 정책 (간단히 인증된 사용자 모두 허용)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE handicaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON members FOR ALL USING (true);
CREATE POLICY "allow_all" ON rounds FOR ALL USING (true);
CREATE POLICY "allow_all" ON scores FOR ALL USING (true);
CREATE POLICY "allow_all" ON handicaps FOR ALL USING (true);
CREATE POLICY "allow_all" ON rsvp FOR ALL USING (true);
CREATE POLICY "allow_all" ON gallery FOR ALL USING (true);
