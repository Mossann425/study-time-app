-- Users テーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  study_goal TEXT DEFAULT '未設定'
);

-- Subjects テーブル
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study_times テーブル
CREATE TABLE IF NOT EXISTS study_times (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  time INTEGER NOT NULL, -- 分単位
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_study_times_user_id ON study_times(user_id);
CREATE INDEX IF NOT EXISTS idx_study_times_created_at ON study_times(created_at);
CREATE INDEX IF NOT EXISTS idx_study_times_subject_id ON study_times(subject_id);

-- Row Level Security (RLS) の設定
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_times ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid() = id);

-- 科目は全ユーザーが閲覧・作成可能（共有リソース）
CREATE POLICY "Anyone can view subjects" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create subjects" ON subjects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update subjects" ON subjects
  FOR UPDATE USING (true);

-- 学習時間は自分のデータのみアクセス可能
CREATE POLICY "Users can view own study times" ON study_times
  FOR ALL USING (auth.uid() = user_id);
