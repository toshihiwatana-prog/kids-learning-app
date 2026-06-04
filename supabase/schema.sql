-- =============================================
-- 算数スピードゲーム Supabase スキーマ
-- =============================================

-- users テーブル
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,  -- Supabase Auth の user_id
  nickname text NOT NULL,
  grade int NOT NULL CHECK (grade BETWEEN 1 AND 6),
  prefecture text NOT NULL,
  city text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- scores テーブル（全プレイ履歴を保存。ベストスコアはランキング集計時に DISTINCT ON で算出）
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
  created_at timestamptz DEFAULT now()
);

-- インデックス（ランキングクエリを高速化）
CREATE INDEX IF NOT EXISTS idx_scores_grade_challenged ON scores (grade_challenged);
CREATE INDEX IF NOT EXISTS idx_scores_grade_challenged_user ON scores (grade_challenged, user_grade);
CREATE INDEX IF NOT EXISTS idx_scores_user_grade ON scores (user_id, grade_challenged);

-- =============================================
-- ランキングビュー（ユーザーごとのベストスコア）
-- =============================================

CREATE OR REPLACE VIEW ranking_best_scores AS
SELECT DISTINCT ON (user_id, grade_challenged)
  user_id,
  user_grade,
  grade_challenged,
  score,
  correct_count,
  max_combo,
  prefecture,
  city
FROM scores
ORDER BY user_id, grade_challenged, score DESC;

-- =============================================
-- ランキングクエリ例
-- =============================================

-- 全体ランキング（小6の問題）
-- SELECT rank() OVER (ORDER BY score DESC), *
-- FROM ranking_best_scores
-- WHERE grade_challenged = 6;

-- 小3の中でのランキング（小6の問題）
-- SELECT rank() OVER (ORDER BY score DESC), *
-- FROM ranking_best_scores
-- WHERE grade_challenged = 6
--   AND user_grade = 3;

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- users: 自分のレコードのみ読み書き可
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- scores: 全員の読み取りOK（ランキング用）。書き込みは自分のみ
CREATE POLICY "scores_select_all" ON scores FOR SELECT USING (true);
CREATE POLICY "scores_insert_own" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
