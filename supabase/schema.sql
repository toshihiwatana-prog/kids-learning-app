-- =============================================
-- 算数スピードゲーム Supabase スキーマ
-- =============================================

-- users テーブル
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  nickname text NOT NULL,
  grade int NOT NULL CHECK (grade BETWEEN 1 AND 6),
  prefecture text NOT NULL,
  city text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- scores テーブル（1人1レコード・ベストスコアのみ保存）
CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  user_grade int NOT NULL CHECK (user_grade BETWEEN 1 AND 6),
  grade_challenged int NOT NULL CHECK (grade_challenged BETWEEN 1 AND 6),
  score int NOT NULL,
  correct_count int NOT NULL,
  max_combo int NOT NULL,
  prefecture text NOT NULL,
  city text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT scores_user_grade_unique UNIQUE (user_id, grade_challenged)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_scores_grade_challenged ON scores (grade_challenged);
CREATE INDEX IF NOT EXISTS idx_scores_grade_challenged_user ON scores (grade_challenged, user_grade);
CREATE INDEX IF NOT EXISTS idx_scores_user_grade ON scores (user_id, grade_challenged);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "scores_select_all" ON scores FOR SELECT USING (true);
CREATE POLICY "scores_insert_own" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scores_update_own" ON scores FOR UPDATE USING (auth.uid() = user_id);
