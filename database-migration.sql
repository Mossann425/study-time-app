-- 学習時間集約テーブルの作成
CREATE TABLE IF NOT EXISTS study_time_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_time INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 週別集約テーブル
CREATE TABLE IF NOT EXISTS study_time_weekly_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_of_year INTEGER NOT NULL,
  total_time INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, week_of_year)
);

-- 月別集約テーブル
CREATE TABLE IF NOT EXISTS study_time_monthly_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_time INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- 年別集約テーブル
CREATE TABLE IF NOT EXISTS study_time_yearly_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_time INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- 科目別集約テーブル（日別）
CREATE TABLE IF NOT EXISTS study_time_subject_daily_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_time INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_id, date)
);

-- 科目別集約テーブル（週別）
CREATE TABLE IF NOT EXISTS study_time_subject_weekly_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_of_year INTEGER NOT NULL,
  total_time INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_id, year, week_of_year)
);

-- 科目別集約テーブル（月別）
CREATE TABLE IF NOT EXISTS study_time_subject_monthly_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_time INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_id, year, month)
);

-- 科目別集約テーブル（年別）
CREATE TABLE IF NOT EXISTS study_time_subject_yearly_summaries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_time INTEGER NOT NULL DEFAULT 0,
  record_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subject_id, year)
);

-- 新しい日毎集約テーブルの作成
CREATE TABLE IF NOT EXISTS study_time_user_subject_daily_summaries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  total_study_time INTEGER NOT NULL DEFAULT 0,
  study_sessions_count INTEGER NOT NULL DEFAULT 0,
  first_study_time TIMESTAMP WITH TIME ZONE,
  last_study_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 複合ユニーク制約（同じユーザーの同じ科目の同じ日付は1レコードのみ）
  UNIQUE(user_id, subject_id, study_date)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_study_time_user_subject_daily_summaries_user_date 
ON study_time_user_subject_daily_summaries(user_id, study_date);

CREATE INDEX IF NOT EXISTS idx_study_time_user_subject_daily_summaries_subject_date 
ON study_time_user_subject_daily_summaries(subject_id, study_date);

CREATE INDEX IF NOT EXISTS idx_study_time_user_subject_daily_summaries_user_subject_date 
ON study_time_user_subject_daily_summaries(user_id, subject_id, study_date);

-- RLSポリシーの設定
ALTER TABLE study_time_user_subject_daily_summaries ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ読み取り可能
CREATE POLICY "Users can view own daily summaries" ON study_time_user_subject_daily_summaries
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ挿入可能
CREATE POLICY "Users can insert own daily summaries" ON study_time_user_subject_daily_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users can update own daily summaries" ON study_time_user_subject_daily_summaries
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ削除可能
CREATE POLICY "Users can delete own daily summaries" ON study_time_user_subject_daily_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_study_time_user_subject_daily_summaries_updated_at
  BEFORE UPDATE ON study_time_user_subject_daily_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_study_time_summaries_user_date ON study_time_summaries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_study_time_summaries_date ON study_time_summaries(date);

CREATE INDEX IF NOT EXISTS idx_study_time_weekly_summaries_user_year_week ON study_time_weekly_summaries(user_id, year, week_of_year);
CREATE INDEX IF NOT EXISTS idx_study_time_monthly_summaries_user_year_month ON study_time_monthly_summaries(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_study_time_yearly_summaries_user_year ON study_time_yearly_summaries(user_id, year);

-- 科目別集約テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_study_time_subject_daily_summaries_user_subject_date ON study_time_subject_daily_summaries(user_id, subject_id, date);
CREATE INDEX IF NOT EXISTS idx_study_time_subject_weekly_summaries_user_subject_year_week ON study_time_subject_weekly_summaries(user_id, subject_id, year, week_of_year);
CREATE INDEX IF NOT EXISTS idx_study_time_subject_monthly_summaries_user_subject_year_month ON study_time_subject_monthly_summaries(user_id, subject_id, year, month);
CREATE INDEX IF NOT EXISTS idx_study_time_subject_yearly_summaries_user_subject_year ON study_time_subject_yearly_summaries(user_id, subject_id, year);

-- updated_atを自動更新するためのトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_study_time_summaries_updated_at 
    BEFORE UPDATE ON study_time_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_time_weekly_summaries_updated_at 
    BEFORE UPDATE ON study_time_weekly_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_time_monthly_summaries_updated_at 
    BEFORE UPDATE ON study_time_monthly_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_time_yearly_summaries_updated_at 
    BEFORE UPDATE ON study_time_yearly_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 科目別集約テーブルのトリガー
CREATE TRIGGER update_study_time_subject_daily_summaries_updated_at 
    BEFORE UPDATE ON study_time_subject_daily_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_time_subject_weekly_summaries_updated_at 
    BEFORE UPDATE ON study_time_subject_weekly_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_time_subject_monthly_summaries_updated_at 
    BEFORE UPDATE ON study_time_subject_monthly_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_time_subject_yearly_summaries_updated_at 
    BEFORE UPDATE ON study_time_subject_yearly_summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS（Row Level Security）の設定
ALTER TABLE study_time_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_time_weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_time_monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_time_yearly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_time_subject_daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_time_subject_weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_time_subject_monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_time_subject_yearly_summaries ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own study time summaries" ON study_time_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study time summaries" ON study_time_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study time summaries" ON study_time_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study time summaries" ON study_time_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- 週別集約テーブルのポリシー
CREATE POLICY "Users can view own weekly summaries" ON study_time_weekly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly summaries" ON study_time_weekly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly summaries" ON study_time_weekly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly summaries" ON study_time_weekly_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- 月別集約テーブルのポリシー
CREATE POLICY "Users can view own monthly summaries" ON study_time_monthly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly summaries" ON study_time_monthly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly summaries" ON study_time_monthly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly summaries" ON study_time_monthly_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- 年別集約テーブルのポリシー
CREATE POLICY "Users can view own yearly summaries" ON study_time_yearly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own yearly summaries" ON study_time_yearly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own yearly summaries" ON study_time_yearly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own yearly summaries" ON study_time_yearly_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- 科目別集約テーブルのポリシー
CREATE POLICY "Users can view own subject daily summaries" ON study_time_subject_daily_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subject daily summaries" ON study_time_subject_daily_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subject daily summaries" ON study_time_subject_daily_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subject daily summaries" ON study_time_subject_daily_summaries
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subject weekly summaries" ON study_time_subject_weekly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subject weekly summaries" ON study_time_subject_weekly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subject weekly summaries" ON study_time_subject_weekly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subject weekly summaries" ON study_time_subject_weekly_summaries
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subject monthly summaries" ON study_time_subject_monthly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subject monthly summaries" ON study_time_subject_monthly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subject monthly summaries" ON study_time_subject_monthly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subject monthly summaries" ON study_time_subject_monthly_summaries
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subject yearly summaries" ON study_time_subject_yearly_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subject yearly summaries" ON study_time_subject_yearly_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subject yearly summaries" ON study_time_subject_yearly_summaries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subject yearly summaries" ON study_time_subject_yearly_summaries
    FOR DELETE USING (auth.uid() = user_id); 