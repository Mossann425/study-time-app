"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { useRouter } from "next/navigation"
import { SubjectManager } from "@/components/subject-manager"
import { TimeRecorder } from "@/components/time-recorder"
import { StudyLog } from "@/components/study-log"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Target, Flame } from "lucide-react"

export default function Home() {
  const [goalText, setGoalText] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [consecutiveDays, setConsecutiveDays] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      } else {
        await loadUserGoal()
        await loadConsecutiveDays() // 継続日数も初期化
        setIsLoading(false)
      }
    }

    checkSessionAndFetchData()
  }, [])

  const loadUserGoal = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: userInfo, error } = await supabase
        .from("users")
        .select("study_goal")
        .eq("id", userData.user.id)
        .maybeSingle()

      if (error) {
        console.error("目標の取得に失敗:", error)
      } else if (userInfo) {
        setGoalText(userInfo.study_goal || "未設定")
      }
    } catch (error) {
      console.error("予期せぬエラー:", error)
    }
  }

  const loadConsecutiveDays = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // 学習継続日数を計算
      const { data: studyData } = await supabase
        .from("study_time_user_subject_daily_summaries")
        .select("study_date")
        .eq("user_id", userData.user.id)
        .not("total_study_time", "eq", 0)
        .order("study_date", { ascending: false })

      if (studyData && studyData.length > 0) {
        // 継続日数を計算
        let days = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (let i = 0; i < 365; i++) { // 最大1年分チェック
          const checkDate = new Date(today)
          checkDate.setDate(today.getDate() - i)
          const dateString = checkDate.toISOString().split('T')[0]
          
          const hasStudyData = studyData.some(day => day.study_date === dateString)
          if (hasStudyData) {
            days++
          } else {
            break // 連続が途切れたら終了
          }
        }

        setConsecutiveDays(days)
      }
    } catch (error) {
      console.error("継続日数の取得に失敗:", error)
    }
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    loadConsecutiveDays() // 継続日数も更新
  }

  // 継続日数に応じてバッジの色を決定
  const getBadgeVariant = (days: number) => {
    if (days >= 30) return "default" // 紫（デフォルト）
    if (days >= 14) return "secondary" // グレー
    if (days >= 7) return "outline" // アウトライン
    return "destructive" // 赤
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="container mx-auto p-6 space-y-6">
        {/* 学習目標表示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              学習目標
              {consecutiveDays > 0 && (
                <Badge variant={getBadgeVariant(consecutiveDays)} className="ml-auto">
                  <Flame className="h-3 w-3 mr-1" />
                  {consecutiveDays}日継続
                </Badge>
              )}
            </CardTitle>
            <CardDescription>あなたの現在の学習目標</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{goalText}</p>
          </CardContent>
        </Card>

        {/* メイン機能 */}
        <div className="grid gap-6 md:grid-cols-2">
          <SubjectManager onSubjectAdded={handleRefresh} />
          <TimeRecorder key={refreshKey} onTimeRecorded={handleRefresh} />
        </div>

        {/* 学習ログ */}
        <StudyLog key={refreshKey} />
      </div>
    </div>
  )
}
