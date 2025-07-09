"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, BookOpen } from "lucide-react"
import type { ChartData } from "@/app/review/page"

interface StudyChartProps {
  data: ChartData[]
  viewMode?: 'day' | 'week' | 'month'
  subjectFilter?: string | null // 科目フィルター
  subjects?: Array<{ id: string; name: string }> // 科目リスト
  onSubjectChange?: (subjectId: string | null) => void // 科目変更コールバック
  refreshKey?: number // 追加：強制再計算用
}

export function StudyChart({ 
  data, 
  viewMode = 'day', 
  subjectFilter = null, 
  subjects = [], 
  onSubjectChange,
  refreshKey = 0 // 追加
}: StudyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // キャッシュされた計算結果
  const chartCalculations = useMemo(() => {
    console.log("チャート計算を実行中...")
    
    const maxTime = Math.max(...data.map((d) => d.totalTime), 0)
    
    // 各データポイントの計算結果をキャッシュ
    const processedData = data.map((item, index) => {
      const barHeight = maxTime > 0 ? (item.totalTime / maxTime) * 240 : 4
      const intensity = maxTime > 0 ? item.totalTime / maxTime : 0
      
      // バーの色を計算
      let barColor = "bg-gray-400"
      if (intensity > 0.8) barColor = "bg-green-500"
      else if (intensity > 0.6) barColor = "bg-blue-500"
      else if (intensity > 0.4) barColor = "bg-yellow-500"
      else if (intensity > 0.2) barColor = "bg-orange-500"
      
      // バーの幅を計算
      const barWidth = data.length > 30 ? 'w-3' : 
                      data.length > 20 ? 'w-4' : 
                      data.length > 10 ? 'w-6' : 'w-8'
      
      return {
        ...item,
        barHeight,
        barColor,
        barWidth,
        intensity
      }
    })
    
    return {
      maxTime,
      processedData,
      dataLength: data.length
    }
  }, [data, refreshKey]) // dataが変更された時のみ再計算

  // 日付フォーマット関数をキャッシュ
  const formatDate = useCallback((dateString: string) => {
    if (viewMode === 'day') {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 
      }
      return date.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      })
    } else if (viewMode === 'week') {
      // 新しい週キーフォーマット (YYYY-WNN) に対応
      const match = dateString.match(/(\d{4})-W(\d+)/)
      if (match) {
        const [, year, week] = match
        return `${year}年第${week}週`
      }
      return dateString
    } else if (viewMode === 'month') {
      const [year, month] = dateString.split('-')
      return `${month}月`
    }
    return dateString
  }, [viewMode])

  // 日付ラベルコンポーネントをキャッシュ
  const DateLabel = useCallback(({ item, viewMode }: { item: any, viewMode: string }) => {
    if (viewMode === 'day') {
      const date = new Date(item.date)
      if (isNaN(date.getTime())) {
        return <div className="text-xs text-muted-foreground">無効</div>
      }
      const day = date.getDate()
      return <div className="text-xs text-muted-foreground">{day}日</div>
    } else if (viewMode === 'week') {
      // 週ごと表示の場合は「第X週」の形式
      const match = item.date.match(/(\d{4})-W(\d+)/)
      if (match) {
        const [, year, week] = match
        return <div className="text-xs text-muted-foreground">第{week}週</div>
      }
      return <div className="text-xs text-muted-foreground">{item.date}</div>
    } else {
      return (
        <div className="text-[10px] text-muted-foreground">
          {formatDate(item.date)}
        </div>
      )
    }
  }, [formatDate])

  // ツールチップコンテンツをキャッシュ
  const tooltipContent = useMemo(() => {
    if (hoveredIndex === null || !chartCalculations.processedData[hoveredIndex]) {
      return null
    }
    
    const item = chartCalculations.processedData[hoveredIndex]
    return {
      date: formatDate(item.date),
      time: item.totalTime
    }
  }, [hoveredIndex, chartCalculations.processedData, formatDate])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          学習時間グラフ
        </CardTitle>
        <CardDescription>
          {viewMode === 'day' && '日別の学習時間の推移'}
          {viewMode === 'week' && '週別の学習時間の推移'}
          {viewMode === 'month' && '月別の学習時間の推移'}
        </CardDescription>
        
        {/* 科目フィルター */}
        <div className="flex items-center gap-2 mt-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <Select value={subjectFilter || "all"} onValueChange={(value) => onSubjectChange?.(value === "all" ? null : value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="科目を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全科目</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {subjects.length === 0 && (
            <span className="text-xs text-muted-foreground">
              学習データがある科目がありません
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">まだ学習記録がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ツールチップ表示エリア */}
            <div className="h-8 flex items-center justify-center">
              {hoveredIndex !== null && (
                <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md border text-sm animate-in fade-in-0 zoom-in-95">
                  <div className="font-medium">{tooltipContent?.date}</div>
                  <div className="text-muted-foreground">
                    学習時間: <span className="font-medium text-foreground">{tooltipContent?.time}分</span>
                    {subjectFilter ? (
                      <div className="text-xs">
                        科目: {subjects.find(s => s.id === subjectFilter)?.name}
                      </div>
                    ) : (
                      <div className="text-xs">
                        全科目合計
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* グラフコンテナ - スクロール可能 */}
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* 縦軸の目盛り */}
                <div className="flex">
                  <div className="w-12 h-64 flex flex-col justify-between text-xs text-muted-foreground">
                    <span>{chartCalculations.maxTime}分</span>
                    <span>{Math.round(chartCalculations.maxTime * 0.75)}分</span>
                    <span>{Math.round(chartCalculations.maxTime * 0.5)}分</span>
                    <span>{Math.round(chartCalculations.maxTime * 0.25)}分</span>
                    <span>0分</span>
                  </div>

                  {/* グラフ本体 */}
                  <div className="flex-1 relative">
                    {/* 横線（グリッド） */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                        <div key={index} className="border-t border-muted/30 w-full" />
                      ))}
                    </div>

                    <div className={`h-64 flex items-end justify-start pl-2 pb-2 relative ${data.length > 30 ? 'gap-2' : data.length > 20 ? 'gap-3' : data.length > 10 ? 'gap-4' : 'gap-6'}`}>
                      {chartCalculations.processedData.map((item, index) => {
                        return (
                          <div
                            key={index}
                            className={`flex flex-col items-center relative group ${item.barWidth}`}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          >
                            {/* 数値表示 */}
                            <div className="absolute -top-6 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.totalTime}分
                            </div>

                            {/* 棒グラフ */}
                            <div
                              className={`${item.barColor} rounded-t w-full min-h-[4px] transition-all duration-300 hover:opacity-80 cursor-pointer shadow-sm`}
                              style={{
                                height: `${item.barHeight}px`,
                              }}
                            />

                            {/* 日付ラベル */}
                            <div className="mt-2 text-center">
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                <DateLabel item={item} viewMode={viewMode} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* データ量が多い場合の注意書き */}
            {data.length > 30 && (
              <div className="text-xs text-muted-foreground text-center">
                データが多いため、横スクロールで全体を確認できます
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
