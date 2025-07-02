"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, type StudyTime } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { StudyChart } from "@/components/study-chart"
import { StudyLog } from "@/components/study-log"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, BarChart2 } from "lucide-react"

// Chartコンポーネントに渡すデータの型
export interface ChartData {
  date: string;
  totalTime: number;
}

export default function ReviewPage() {
  const router = useRouter()
  const [studyLogs, setStudyLogs] = useState<StudyTime[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [totalTime, setTotalTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        loadStudyData()
      } else {
        // 必要であればログインページにリダイレクト
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  useEffect(() => {
    processChartData(studyLogs)
  }, [viewMode, studyLogs])

  const loadStudyData = async () => {
    setIsLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: logs, error } = await supabase
        .from("study_times")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: true })

      if (error) throw error

      const validLogs = logs || []
      setStudyLogs(validLogs)
      processChartData(validLogs)
      
      const total = validLogs.reduce((sum, log) => sum + log.time, 0)
      setTotalTime(total)

    } catch (error) {
      console.error("学習データの読み込みに失敗:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const processChartData = (logs: StudyTime[]) => {
    console.log("Raw logs for chart processing:", logs)

    if (!logs || logs.length === 0) {
      console.log("No logs to process for chart.")
      setChartData([])
      return
    }

    let dataByKey: Record<string, number> = {}
    if (viewMode === 'day') {
      dataByKey = logs.reduce((acc, log) => {
        const date = new Date(log.created_at).toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + log.time
        return acc
      }, {} as Record<string, number>)
    } else if (viewMode === 'week') {
      dataByKey = logs.reduce((acc, log) => {
        const d = new Date(log.created_at)
        // 週の開始日（ISO: 月曜始まり）
        const year = d.getFullYear()
        const week = getISOWeek(d)
        const key = `${year}-W${week}`
        acc[key] = (acc[key] || 0) + log.time
        return acc
      }, {} as Record<string, number>)
    } else if (viewMode === 'month') {
      dataByKey = logs.reduce((acc, log) => {
        const d = new Date(log.created_at)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        acc[key] = (acc[key] || 0) + log.time
        return acc
      }, {} as Record<string, number>)
    }
    const processedData = Object.entries(dataByKey)
      .map(([date, totalTime]) => ({ date, totalTime }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    console.log("Processed data for chart component:", processedData)

    setChartData(processedData)
  }

  function getISOWeek(date: Date) {
    const tmp = new Date(date.getTime())
    tmp.setHours(0, 0, 0, 0)
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
    const week1 = new Date(tmp.getFullYear(), 0, 4)
    return (
      1 + Math.round(
        ((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
      )
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              総学習時間
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalTime} 分</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              学習時間の推移
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <button className={`px-3 py-1 rounded ${viewMode === 'day' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setViewMode('day')}>日ごと</button>
              <button className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setViewMode('week')}>週ごと</button>
              <button className={`px-3 py-1 rounded ${viewMode === 'month' ? 'bg-primary text-white' : 'bg-muted'}`} onClick={() => setViewMode('month')}>月ごと</button>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <StudyChart data={chartData} viewMode={viewMode} />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">表示するデータがありません。</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
