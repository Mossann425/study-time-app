"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, type StudyTime, studyTimeManager } from "@/utils/supabase"
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
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
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
        loadSubjects()
        loadStudyData()
      } else {
        // 必要であればログインページにリダイレクト
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  // 科目データの読み込み（学習データがある科目のみ）
  const loadSubjects = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // 学習データが存在する科目IDのリストを取得
      const subjectsWithData = await studyTimeManager.getSubjectsWithData(userData.user.id)

      // 学習データがある科目のみを取得
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("user_id", userData.user.id)
        .in("id", subjectsWithData)
        .order("name", { ascending: true })

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error("科目の読み込みに失敗:", error)
    }
  }

  useEffect(() => {
    loadStudyData()
  }, [viewMode, selectedYear, selectedMonth, selectedSubject])

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
      
      let data: any[] = []
      
      // 表示モードに応じて新しい集約テーブルからデータを取得
      if (viewMode === 'day') {
        data = await studyTimeManager.getDailySummaries(
          userData.user.id, 
          start, 
          end, 
          selectedSubject
        )
      } else if (viewMode === 'week') {
        data = await studyTimeManager.getWeeklySummaries(
          userData.user.id, 
          start, 
          end, 
          selectedSubject
        )
      } else if (viewMode === 'month') {
        data = await studyTimeManager.getMonthlySummaries(
          userData.user.id, 
          start, 
          end, 
          selectedSubject
        )
      }

      const endTime = performance.now() // パフォーマンス測定終了
      console.log(`データ取得時間: ${(endTime - startTime).toFixed(2)}ms`)

      setStudyLogs(data || [])
      processChartData(data || [])
      
      // 総学習時間を計算
      const total = (data || []).reduce((sum, item) => {
        if (viewMode === 'day') {
          return sum + (item.total_study_time || 0)
        } else if (viewMode === 'week') {
          return sum + (item.totalTime || 0)
        } else if (viewMode === 'month') {
          return sum + (item.totalTime || 0)
        }
        return sum
      }, 0)
      setTotalTime(total)
    } catch (error) {
      console.error("学習データの読み込みに失敗:", error)
      setStudyLogs([])
      setChartData([])
      setTotalTime(0)
    } finally {
      setIsLoading(false)
    }
  }

  const processChartData = (data: any[]) => {
    console.log("Raw data for chart processing:", data)

    if (!data || data.length === 0) {
      console.log("No data to process for chart.")
      setChartData([])
      return
    }

    let processedData: ChartData[] = []
    
    if (viewMode === 'day') {
      // 日別表示の場合、study_dateとtotal_study_timeを使用
      processedData = data.map(item => ({
        date: item.study_date,
        totalTime: item.total_study_time
      }))
    } else if (viewMode === 'week') {
      // 週別表示の場合、weekKeyとtotalTimeを使用
      processedData = data.map(item => ({
        date: item.weekKey,
        totalTime: item.totalTime
      }))
    } else if (viewMode === 'month') {
      // 月別表示の場合、monthKeyとtotalTimeを使用
      processedData = data.map(item => ({
        date: item.monthKey,
        totalTime: item.totalTime
      }))
    }
    
    console.log("Processed data for chart component:", processedData)
    setChartData(processedData)
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
              <StudyChart 
                data={chartData} 
                viewMode={viewMode}
                subjectFilter={selectedSubject}
                subjects={subjects}
                onSubjectChange={setSelectedSubject}
              />
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
