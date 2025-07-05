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
import { addMonths, subMonths, addYears, subYears, format } from "date-fns"

// Chartコンポーネントに渡すデータの型
export interface ChartData {
  date: string;
  totalTime: number;
}

// 学習時間データの型（time, created_atのみ）
interface StudyTimeSummary {
  time: number;
  created_at: string;
}

export default function ReviewPage() {
  const router = useRouter()
  const [studyLogs, setStudyLogs] = useState<StudyTimeSummary[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [totalTime, setTotalTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  // 期間選択用の状態
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1) // 1-12

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
    loadStudyData()
  }, [viewMode, selectedYear, selectedMonth])

  // 期間計算関数
  const getRange = () => {
    if (viewMode === 'day') {
      // 選択月の1日〜末日
      const start = new Date(selectedYear, selectedMonth - 1, 1)
      const end = new Date(selectedYear, selectedMonth, 0)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    } else if (viewMode === 'week') {
      // 選択月の3ヶ月分（前月、当月、翌月）
      const currentMonth = new Date(selectedYear, selectedMonth - 1, 1)
      const start = subMonths(currentMonth, 1) // 前月の1日
      const end = addMonths(currentMonth, 1) // 翌月の末日
      end.setDate(0) // 翌月の末日に設定
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    } else if (viewMode === 'month') {
      // 選択年の1月〜12月
      return {
        start: `${selectedYear}-01-01`,
        end: `${selectedYear}-12-31`
      }
    }
    return { start: '', end: '' }
  }

  const loadStudyData = async () => {
    setIsLoading(true)
    const startTime = performance.now() // パフォーマンス測定開始
    
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { start, end } = getRange()
      const { data: logs, error } = await supabase
        .from("study_times")
        .select("time, created_at")
        .eq("user_id", userData.user.id)
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: true })

      if (error) throw error

      const endTime = performance.now() // パフォーマンス測定終了
      console.log(`データ取得時間: ${(endTime - startTime).toFixed(2)}ms`)

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

  const processChartData = (logs: StudyTimeSummary[]) => {
    console.log("Raw logs for chart processing:", logs)

    if (!logs || logs.length === 0) {
      console.log("No logs to process for chart.")
      setChartData([])
      return
    }

    let dataByKey: Record<string, number> = {}
    if (viewMode === 'day') {
      // 日別表示の場合、選択された月のデータのみを処理
      const selectedMonthStart = new Date(selectedYear, selectedMonth - 1, 1)
      const selectedMonthEnd = new Date(selectedYear, selectedMonth, 0)
      
      dataByKey = logs.reduce((acc, log) => {
        const logDate = new Date(log.created_at)
        // 選択された月のデータのみを処理
        if (logDate >= selectedMonthStart && logDate <= selectedMonthEnd) {
          const date = logDate.toISOString().split("T")[0]
          acc[date] = (acc[date] || 0) + log.time
        }
        return acc
      }, {} as Record<string, number>)
    } else if (viewMode === 'week') {
      // 週別表示の場合、選択された月の週別データを処理
      const selectedMonthStart = new Date(selectedYear, selectedMonth - 1, 1)
      const selectedMonthEnd = new Date(selectedYear, selectedMonth, 0)
      
      dataByKey = logs.reduce((acc, log) => {
        const logDate = new Date(log.created_at)
        // 選択された月のデータのみを処理
        if (logDate >= selectedMonthStart && logDate <= selectedMonthEnd) {
          const weekOfMonth = getWeekOfMonth(logDate)
          const key = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-W${weekOfMonth}`
          acc[key] = (acc[key] || 0) + log.time
        }
        return acc
      }, {} as Record<string, number>)
    } else if (viewMode === 'month') {
      // 月別表示の場合、選択された年の月別データを処理
      dataByKey = logs.reduce((acc, log) => {
        const logDate = new Date(log.created_at)
        // 選択された年のデータのみを処理
        if (logDate.getFullYear() === selectedYear) {
          const month = logDate.getMonth() + 1
          const key = `${selectedYear}-${String(month).padStart(2, '0')}`
          acc[key] = (acc[key] || 0) + log.time
        }
        return acc
      }, {} as Record<string, number>)
    }
    const processedData = Object.entries(dataByKey)
      .map(([date, totalTime]) => ({ date, totalTime }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    console.log("Processed data for chart component:", processedData)

    setChartData(processedData)
  }

  // 月内の週番号を計算する関数
  function getWeekOfMonth(date: Date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const dayOfMonth = date.getDate()
    const firstDayWeekday = firstDayOfMonth.getDay()
    
    // 月の第1週の日数を計算
    const daysInFirstWeek = 7 - firstDayWeekday
    
    if (dayOfMonth <= daysInFirstWeek) {
      return 1
    } else {
      const remainingDays = dayOfMonth - daysInFirstWeek
      return Math.ceil(remainingDays / 7) + 1
    }
  }

  // 期間選択UI
  const renderPeriodSelector = () => {
    if (viewMode === 'day' || viewMode === 'week') {
      // 月選択
      return (
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => {
            const prev = subMonths(new Date(selectedYear, selectedMonth - 1, 1), 1)
            setSelectedYear(prev.getFullYear())
            setSelectedMonth(prev.getMonth() + 1)
          }}>←</button>
          <span>{selectedYear}年{selectedMonth}月</span>
          <button onClick={() => {
            const next = addMonths(new Date(selectedYear, selectedMonth - 1, 1), 1)
            setSelectedYear(next.getFullYear())
            setSelectedMonth(next.getMonth() + 1)
          }}>→</button>
        </div>
      )
    } else if (viewMode === 'month') {
      // 年選択
      return (
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setSelectedYear(selectedYear - 1)}>←</button>
          <span>{selectedYear}年</span>
          <button onClick={() => setSelectedYear(selectedYear + 1)}>→</button>
        </div>
      )
    }
    return null
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
            {renderPeriodSelector()}
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
