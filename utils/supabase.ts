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
  id: string
  name: string
  user_id: string
  created_at: string
  last_accessed_at?: number
  access_count?: number
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

// 新しい日毎集約テーブルの型定義
export interface StudyTimeUserSubjectDailySummary {
  id: number
  user_id: string
  subject_id: string
  study_date: string
  total_study_time: number
  study_sessions_count: number
  first_study_time: string | null
  last_study_time: string | null
  created_at: string
  updated_at: string
}

// データ管理関数
export const studyTimeManager = {
  // 新しい日毎集約テーブルの更新
  async updateUserSubjectDailySummary(userId: string, subjectId: string, dateString: string, timeToAdd: number) {
    try {
      const now = new Date().toISOString()
      
      // 既存データを取得
      const { data: existing } = await supabase
        .from("study_time_user_subject_daily_summaries")
        .select("total_study_time, study_sessions_count, first_study_time, last_study_time")
        .eq("user_id", userId)
        .eq("subject_id", subjectId)
        .eq("study_date", dateString)
        .single()

      const newTotalTime = (existing?.total_study_time || 0) + timeToAdd
      const newSessionsCount = (existing?.study_sessions_count || 0) + 1
      const newFirstStudyTime = existing?.first_study_time || now
      const newLastStudyTime = now

      // upsertで更新
      await supabase
        .from("study_time_user_subject_daily_summaries")
        .upsert({
          user_id: userId,
          subject_id: subjectId,
          study_date: dateString,
          total_study_time: newTotalTime,
          study_sessions_count: newSessionsCount,
          first_study_time: newFirstStudyTime,
          last_study_time: newLastStudyTime
        }, {
          onConflict: "user_id,subject_id,study_date"
        })
    } catch (error) {
      console.error("日毎集約データ更新エラー:", error)
      throw error
    }
  },

  // 日毎集約テーブルからデータを取得（日別表示）
  async getDailySummaries(userId: string, startDate: string, endDate: string, subjectId?: string | null) {
    try {
      // 全科目表示の場合は科目ごとの合計を取得
      if (!subjectId) {
        return await this.getDailySummariesAllSubjects(userId, startDate, endDate)
      }

      // 特定科目の場合は科目別データを取得
      const { data, error } = await supabase
        .from("study_time_user_subject_daily_summaries")
        .select(`
          study_date,
          total_study_time,
          study_sessions_count,
          subjects (name)
        `)
        .eq("user_id", userId)
        .eq("subject_id", subjectId)
        .gte("study_date", startDate)
        .lte("study_date", endDate)
        .order("study_date", { ascending: true })

      if (error) {
        console.error("Supabaseエラー:", error)
        return []
      }

      // データが存在しない場合は空配列を返す
      if (!data || data.length === 0) {
        console.log(`科目ID ${subjectId} の学習データが見つかりません`)
        return []
      }

      return data
    } catch (error) {
      console.error("日毎集約データ取得エラー:", error)
      return []
    }
  },

  // 全科目合計の日毎データを取得（科目別データを日付で集約）
  async getDailySummariesAllSubjects(userId: string, startDate: string, endDate: string) {
    try {
      // 学習データが存在する科目IDのリストを取得
      const subjectsWithData = await this.getSubjectsWithData(userId)
      
      if (subjectsWithData.length === 0) {
        console.log("学習データがある科目がありません")
        return []
      }

      const { data, error } = await supabase
        .from("study_time_user_subject_daily_summaries")
        .select(`
          study_date,
          total_study_time,
          study_sessions_count
        `)
        .eq("user_id", userId)
        .in("subject_id", subjectsWithData)
        .gte("study_date", startDate)
        .lte("study_date", endDate)
        .order("study_date", { ascending: true })

      if (error) {
        console.error("Supabaseエラー:", error)
        return []
      }

      // データが存在しない場合は空配列を返す
      if (!data || data.length === 0) {
        console.log("学習データが見つかりません")
        return []
      }

      // 日付ごとに科目の学習時間を合計
      const dailyMap = new Map<string, { totalTime: number; sessionsCount: number }>()
      
      data.forEach(day => {
        const date = day.study_date
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { totalTime: 0, sessionsCount: 0 })
        }
        
        const dayData = dailyMap.get(date)!
        dayData.totalTime += day.total_study_time
        dayData.sessionsCount += day.study_sessions_count
      })

      // 日付順にソートして返す
      return Array.from(dailyMap.entries()).map(([date, data]) => ({
        study_date: date,
        total_study_time: data.totalTime,
        study_sessions_count: data.sessionsCount
      })).sort((a, b) => a.study_date.localeCompare(b.study_date))
    } catch (error) {
      console.error("全科目合計日毎データ取得エラー:", error)
      return []
    }
  },

  // 週別集約データを生成（日毎データから計算）
  async getWeeklySummaries(userId: string, startDate: string, endDate: string, subjectId?: string | null) {
    try {
      const dailyData = await this.getDailySummaries(userId, startDate, endDate, subjectId)
      
      // データが存在しない場合は空配列を返す
      if (!dailyData || dailyData.length === 0) {
        return []
      }
      
      // 週別に集約
      const weeklyMap = new Map<string, { totalTime: number; sessionsCount: number; dates: string[] }>()
      
      dailyData.forEach(day => {
        const date = new Date(day.study_date)
        const weekKey = this.getWeekKey(date)
        
        if (!weeklyMap.has(weekKey)) {
          weeklyMap.set(weekKey, { totalTime: 0, sessionsCount: 0, dates: [] })
        }
        
        const week = weeklyMap.get(weekKey)!
        week.totalTime += day.total_study_time
        week.sessionsCount += day.study_sessions_count
        week.dates.push(day.study_date)
      })

      return Array.from(weeklyMap.entries()).map(([weekKey, data]) => ({
        weekKey,
        totalTime: data.totalTime,
        sessionsCount: data.sessionsCount,
        dates: data.dates
      })).sort((a, b) => a.weekKey.localeCompare(b.weekKey))
    } catch (error) {
      console.error("週別集約データ取得エラー:", error)
      return []
    }
  },

  // 月別集約データを生成（日毎データから計算）
  async getMonthlySummaries(userId: string, startDate: string, endDate: string, subjectId?: string | null) {
    try {
      const dailyData = await this.getDailySummaries(userId, startDate, endDate, subjectId)
      
      // データが存在しない場合は空配列を返す
      if (!dailyData || dailyData.length === 0) {
        return []
      }
      
      // 月別に集約
      const monthlyMap = new Map<string, { totalTime: number; sessionsCount: number; dates: string[] }>()
      
      dailyData.forEach(day => {
        const date = new Date(day.study_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { totalTime: 0, sessionsCount: 0, dates: [] })
        }
        
        const month = monthlyMap.get(monthKey)!
        month.totalTime += day.total_study_time
        month.sessionsCount += day.study_sessions_count
        month.dates.push(day.study_date)
      })

      return Array.from(monthlyMap.entries()).map(([monthKey, data]) => ({
        monthKey,
        totalTime: data.totalTime,
        sessionsCount: data.sessionsCount,
        dates: data.dates
      })).sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    } catch (error) {
      console.error("月別集約データ取得エラー:", error)
      return []
    }
  },

  // 週キーを生成する関数
  getWeekKey(date: Date): string {
    const year = date.getFullYear()
    const weekOfYear = this.getWeekOfYear(date)
    return `${year}-W${String(weekOfYear).padStart(2, '0')}`
  },

  // 週番号を取得する関数
  getWeekOfYear(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    return Math.ceil((days + startOfYear.getDay() + 1) / 7)
  },

  // 学習データが存在する科目IDのリストを取得
  async getSubjectsWithData(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from("study_time_user_subject_daily_summaries")
        .select("subject_id")
        .eq("user_id", userId)
        .not("total_study_time", "eq", 0)

      if (error) {
        console.error("学習データがある科目の取得エラー:", error)
        return []
      }

      // 重複を除去して返す
      const uniqueSubjectIds = [...new Set(data?.map(item => item.subject_id) || [])]
      return uniqueSubjectIds
    } catch (error) {
      console.error("学習データがある科目の取得エラー:", error)
      return []
    }
  },

  // 既存データを新しい日毎集約テーブルに移行
  async migrateExistingDataToDailySummaries(userId: string) {
    try {
      console.log("既存データの移行を開始...")
      
      // 既存のstudy_timesデータを取得
      const { data: existingData, error } = await supabase
        .from("study_times")
        .select("subject_id, time, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })

      if (error) throw error

      if (!existingData || existingData.length === 0) {
        console.log("移行するデータがありません")
        return { success: true, migratedCount: 0 }
      }

      // 日別に集約
      const dailyMap = new Map<string, Map<string, { totalTime: number; sessionsCount: number; firstTime: string; lastTime: string }>>()
      
      existingData.forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0]
        const subjectId = record.subject_id.toString()
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, new Map())
        }
        
        const dayMap = dailyMap.get(date)!
        if (!dayMap.has(subjectId)) {
          dayMap.set(subjectId, { 
            totalTime: 0, 
            sessionsCount: 0, 
            firstTime: record.created_at,
            lastTime: record.created_at
          })
        }
        
        const subjectData = dayMap.get(subjectId)!
        subjectData.totalTime += record.time
        subjectData.sessionsCount += 1
        subjectData.lastTime = record.created_at
      })

      // 集約データを新しいテーブルに挿入
      const insertData = []
      for (const [date, subjects] of dailyMap) {
        for (const [subjectId, data] of subjects) {
          insertData.push({
            user_id: userId,
            subject_id: subjectId,
            study_date: date,
            total_study_time: data.totalTime,
            study_sessions_count: data.sessionsCount,
            first_study_time: data.firstTime,
            last_study_time: data.lastTime
          })
        }
      }

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from("study_time_user_subject_daily_summaries")
          .upsert(insertData, {
            onConflict: "user_id,subject_id,study_date"
          })

        if (insertError) throw insertError
      }

      console.log(`移行完了: ${insertData.length}件の日別集約データを作成`)
      return { success: true, migratedCount: insertData.length }
    } catch (error) {
      console.error("データ移行エラー:", error)
      throw error
    }
  }
}
