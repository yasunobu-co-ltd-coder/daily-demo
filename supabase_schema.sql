-- 日報アプリ Supabase テーブル設計
-- Ver 0.1

-- =========================================
-- 1. 企業テーブル
-- =========================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- 2. ユーザープロファイルテーブル
-- =========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- 3. 日報テーブル
-- =========================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- インデックス
-- =========================================
CREATE INDEX IF NOT EXISTS idx_reports_company_date ON reports(company_id, date);
CREATE INDEX IF NOT EXISTS idx_reports_user_date ON reports(user_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);

-- =========================================
-- RLS (Row Level Security) ポリシー
-- =========================================

-- 企業テーブルのRLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "企業は誰でも作成可能" ON companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "企業は誰でも参照可能" ON companies
  FOR SELECT USING (true);

-- プロファイルテーブルのRLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分のプロファイルを作成可能" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "同じ企業のプロファイルを参照可能" ON profiles
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "ユーザーは自分のプロファイルを更新可能" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 日報テーブルのRLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザーは自分の日報を作成可能" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "同じ企業の日報を参照可能" ON reports
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "ユーザーは自分の日報を更新可能" ON reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の日報を削除可能" ON reports
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- セットアップ完了メッセージ
-- =========================================
-- このSQLをSupabaseのSQL Editorで実行してください
