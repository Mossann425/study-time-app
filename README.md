# 学習時間管理アプリケーション
https://study-time-app-five.vercel.app/
メールアドレス:bbb@bbb
パスワード:bbbbbb
で実際にログインして使えます。
## 概要

このアプリケーションは、**ユーザーの学習意欲維持と学習習慣の形成**を目的として開発されたWebアプリケーションです。科目ごとの学習時間を記録し、グラフで可視化することで、学習の継続性とモチベーションを高めることを目指しています。

### 🎯 開発の目的
- **学習意欲の維持** - 可視化による達成感の提供
- **学習習慣の形成** - 継続的な記録と振り返り
- **学習効率の向上** - 科目別・時間別の分析
- **目標達成のサポート** - 具体的な学習目標の設定と管理

## 機能

### 🎯 学習目標管理
- 個人の学習目標を設定・管理
- 目標の進捗を視覚的に確認
- **学習意欲維持**: 明確な目標設定によるモチベーション向上

### 📚 科目管理
- 学習科目の追加・編集
- 科目ごとの学習時間記録
- **科目の並び替え**: 直近アクセスした科目やアクセス回数が多い科目を上位に表示
- **学習習慣形成**: 科目別の学習パターン把握

### ⏱️ 時間記録
- 科目を選択して学習時間を記録
- コメント機能で学習内容をメモ
- リアルタイムでの記録
- **学習意欲維持**: 即座のフィードバック

### 📊 学習分析
- 日別・科目別の学習時間グラフ
- **グラフ表示切り替え**: 日毎・週ごと・月毎で学習時間の推移を切り替え表示
- 総学習時間の表示
- 学習パターンの可視化
- **学習習慣形成**: 継続的な学習の可視化

### 📝 学習ログ
- 過去の学習記録を確認
- コメント付きの詳細ログ
- 最新20件の記録を表示
- **学習意欲維持**: 過去の努力の振り返り

## 技術スタック

### フロントエンド
- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UI コンポーネント

### バックエンド
- **Supabase** - データベース・認証
- **PostgreSQL** - リレーショナルデータベース

### 認証
- **Supabase Auth** - ユーザー認証
- **JWT** - セッション管理



### Supabase プロジェクトの設定

#### データベーステーブルの作成
```sql
-- ユーザー情報テーブル
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  study_goal TEXT DEFAULT '未設定',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 科目テーブル
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count int,
  last_accessed_at timestampz
);

-- 学習時間テーブル
CREATE TABLE study_times (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  time INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### RLS（Row Level Security）の設定
```sql
-- RLS を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_times ENABLE ROW LEVEL SECURITY;

-- ユーザー情報のポリシー
CREATE POLICY "Users can view own user info" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own user info" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own user info" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 科目のポリシー
CREATE POLICY "Users can view own subjects" ON subjects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects" ON subjects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects" ON subjects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects" ON subjects
  FOR DELETE USING (auth.uid() = user_id);

-- 学習時間のポリシー
CREATE POLICY "Users can view own study times" ON study_times
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study times" ON study_times
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study times" ON study_times
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study times" ON study_times
  FOR DELETE USING (auth.uid() = user_id);
```


## プロジェクト構造

```
study-time-app-latest/
├── app/                           # Next.js アプリケーション（App Router）
│   ├── edit/                     # 設定編集ページ
│   │   └── page.tsx             # ユーザー情報・学習目標編集
│   ├── login/                    # ログインページ
│   │   └── page.tsx             # ユーザー認証
│   ├── register/                 # 新規登録ページ
│   │   └── page.tsx             # アカウント作成
│   ├── review/                   # 学習分析ページ
│   │   └── page.tsx             # 学習時間グラフ・統計
│   ├── settings/                 # 設定ページ
│   │   └── page.tsx             # ユーザー設定・科目管理
│   ├── globals.css              # グローバルスタイル
│   ├── layout.tsx               # アプリケーション全体のレイアウト
│   └── page.tsx                 # ホームページ（メイン機能）
├── components/                   # React コンポーネント
│   ├── ui/                      # shadcn/ui コンポーネント
│   │   ├── button.tsx          # ボタンコンポーネント
│   │   ├── card.tsx            # カードコンポーネント
│   │   ├── input.tsx           # 入力フィールド
│   │   ├── select.tsx          # セレクトボックス
│   │   ├── textarea.tsx        # テキストエリア
│   │   └── ...                 # その他のUIコンポーネント
│   ├── page-header.tsx         # ページヘッダー（ナビゲーション）
│   ├── study-chart.tsx         # 学習時間グラフ（可視化）
│   ├── study-log.tsx           # 学習ログ（記録表示）
│   ├── subject-manager.tsx     # 科目管理（科目の追加・編集）
│   ├── theme-provider.tsx      # テーマプロバイダー（ダークモード対応）
│   ├── time-editor.tsx         # 時間編集（未使用）
│   └── time-recorder.tsx       # 時間記録（メイン機能）
├── lib/                         # ユーティリティ関数
│   └── utils.ts                # 共通関数（クラス名生成など）
├── utils/                       # Supabase 設定
│   └── supabase.ts             # Supabase クライアント設定
├── hooks/                       # カスタムフック
│   ├── use-mobile.tsx          # モバイル判定フック
│   └── use-toast.ts            # トースト通知フック
├── public/                      # 静的ファイル
│   ├── favicon.ico             # ファビコン
│   ├── placeholder-logo.png    # プレースホルダー画像
│   └── ...                     # その他の静的ファイル
├── styles/                      # スタイルファイル
│   └── globals.css             # グローバルスタイル（重複）
├── .gitignore                   # Git 除外設定
├── components.json              # shadcn/ui 設定
├── next.config.mjs             # Next.js 設定
├── package.json                 # 依存関係・スクリプト
├── postcss.config.mjs          # PostCSS 設定
├── tailwind.config.ts          # Tailwind CSS 設定
├── tsconfig.json               # TypeScript 設定
└── README.md                   # プロジェクト説明書
```

## 主要コンポーネントの詳細

### TimeRecorder（時間記録）
**学習習慣形成の核となるコンポーネント**
- **機能**: 科目選択、時間入力、コメント記録
- **学習意欲維持**: 即座の記録による達成感
- **学習習慣形成**: 毎日の記録が習慣化を促進

### StudyChart（学習時間グラフ）
**学習意欲維持のための可視化コンポーネント**
- **機能**: 日別学習時間の棒グラフ表示
- **学習意欲維持**: 継続的な学習の可視化
- **学習習慣形成**: 学習パターンの把握

### StudyLog（学習ログ）
**学習継続のモチベーション向上コンポーネント**
- **機能**: 過去の学習記録とコメント表示
- **学習意欲維持**: 過去の努力の振り返り
- **学習習慣形成**: 継続性の実感

### SubjectManager（科目管理）
**学習計画構築のためのコンポーネント**
- **機能**: 科目の追加・編集・管理
- **学習意欲維持**: 体系的な学習計画
- **学習習慣形成**: 科目別の学習習慣

### PageHeader（ページヘッダー）
**ナビゲーションとユーザー体験向上**
- **機能**: ページ間の移動、ログアウト
- **学習意欲維持**: スムーズな操作体験
- **学習習慣形成**: 直感的な操作で継続を促進

## データベース設計

### users テーブル（ユーザー情報）
- `id`: ユーザーID（auth.users と連携）
- `name`: ユーザー名
- `study_goal`: 学習目標（学習意欲維持のため）
- `created_at`: 作成日時

### subjects テーブル（科目管理）
- `id`: 科目ID
- `name`: 科目名
- `user_id`: ユーザーID（外部キー）
- `created_at`: 作成日時
- `access_count`: アクセス数（int, 科目が選択された回数）
- `last_accessed_at`: アクセス時刻（timestampz, 直近アクセス日時）

### study_times テーブル（学習時間記録）
- `id`: 学習時間ID
- `user_id`: ユーザーID（外部キー）
- `subject_id`: 科目ID（外部キー）
- `time`: 学習時間（分）
- `comment`: コメント（学習内容の記録）
- `created_at`: 作成日時（学習習慣の追跡）



## 学習意欲維持・習慣形成のための設計思想

### 🎯 継続性の重視
- **毎日の記録**: 学習時間の継続的な記録
- **可視化**: グラフによる学習パターンの可視化
- **振り返り**: 過去の学習記録の確認

### 📈 モチベーション向上
- **目標設定**: 明確な学習目標の設定
- **達成感**: 即座の記録による達成感
- **成長実感**: 学習時間の蓄積による成長実感

### 🔄 習慣化の促進
- **シンプル操作**: 直感的で簡単な操作
- **即座フィードバック**: 記録後の即座の確認
- **継続的改善**: 学習パターンの分析と改善

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

プルリクエストやイシューの報告を歓迎します。

## サポート

問題や質問がある場合は、GitHub のイシューを作成してください。 
