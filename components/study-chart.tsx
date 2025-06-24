"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/utils/supabase"
import { BarChart3 } from "lucide-react"

interface ChartData {
  date: string
  totalTime: number
}

export function StudyChart() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChartData()
  }, [])

  const loadChartData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      // 過去30日間のデータを取得
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from("study_times")
        .select("time, created_at")
        .eq("user_id", userData.user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true })

      if (error) throw error

      // 日付ごとにグループ化して合計時間を計算
      const groupedData: { [key: string]: number } = {}

      data?.forEach((record: any) => {
        const date = new Date(record.created_at).toLocaleDateString("ja-JP")
        groupedData[date] = (groupedData[date] || 0) + record.time
      })

      const chartData = Object.entries(groupedData).map(([date, totalTime]) => ({
        date,
        totalTime,
      }))

      setChartData(chartData)
    } catch (error) {
      console.error("チャートデータの読み込みに失敗:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const maxTime = Math.max(...chartData.map((d) => d.totalTime), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          学習時間グラフ
        </CardTitle>
        <CardDescription>過去30日間の学習時間の推移</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <p>読み込み中...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">まだ学習記録がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64 flex items-end justify-between gap-1 border-b border-l pl-2 pb-2">
              {chartData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-primary rounded-t w-full min-h-[4px] transition-all hover:opacity-80"
                    style={{
                      height: `${maxTime > 0 ? (data.totalTime / maxTime) * 200 : 4}px`,
                    }}
                    title={`${data.date}: ${data.totalTime}分`}
                  />
                  <span className="text-xs text-muted-foreground mt-2 transform -rotate-45 origin-left">
                    {data.date.split("/").slice(1).join("/")}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">横軸: 日付、縦軸: 学習時間（分）</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
