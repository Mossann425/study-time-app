"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import type { ChartData } from "@/app/review/page"

interface StudyChartProps {
  data: ChartData[]
  viewMode?: 'day' | 'week' | 'month'
}

export function StudyChart({ data, viewMode = 'day' }: StudyChartProps) {
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
  }, [data]) // dataが変更された時のみ再計算

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
      const match = dateString.match(/(\d{4})-(\d{2})-W(\d+)/)
      if (match) {
        const [, year, month, week] = match
        return `${month}月${week}週目`
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
      const day = isNaN(date.getTime()) ? 'N/A' : date.getDate()
      return <div>{day}</div>
    } else {
      return (
        <div className="text-[10px]">
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
