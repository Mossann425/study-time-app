"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { useRouter } from "next/navigation"
import { SubjectManager } from "@/components/subject-manager"
import { TimeRecorder } from "@/components/time-recorder"
import { StudyLog } from "@/components/study-log"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Target } from "lucide-react"

export default function Home() {
  const [goalText, setGoalText] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
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

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
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
