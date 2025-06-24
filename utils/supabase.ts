import { createClient } from "@supabase/supabase-js"

// 環境変数チェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project")) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL が未設定、またはプレースホルダーのままです。\n" +
      "Vercel の環境変数に正しい Supabase URL と ANON KEY を設定してください。",
  )
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "public-anon-key") {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定、またはプレースホルダーのままです。\n" +
      "Vercel の環境変数に正しい Supabase ANON KEY を設定してください。",
  )
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// データベース型定義
export interface User {
  id: string
  name: string
  created_at: string
  study_goal: string
}

export interface Subject {
  id: number
  name: string
  created_at: string
}

export interface StudyTime {
  id: number
  user_id: string
  subject_id: number
  time: number
  comment?: string
  created_at: string
  subject?: Subject
}
