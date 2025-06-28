"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import type { ChartData } from "@/app/review/page"

interface StudyChartProps {
  data: ChartData[]
}

export function StudyChart({ data }: StudyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const maxTime = Math.max(...data.map((d) => d.totalTime), 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
    })
  }

  const getBarColor = (time: number, maxTime: number) => {
    const intensity = maxTime > 0 ? time / maxTime : 0
    if (intensity > 0.8) return "bg-green-500"
    if (intensity > 0.6) return "bg-blue-500"
    if (intensity > 0.4) return "bg-yellow-500"
    if (intensity > 0.2) return "bg-orange-500"
    return "bg-gray-400"
  }

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
                  <div className="font-medium">{formatDate(data[hoveredIndex].date)}</div>
                  <div className="text-muted-foreground">
                    学習時間: <span className="font-medium text-foreground">{data[hoveredIndex].totalTime}分</span>
                  </div>
                </div>
              )}
            </div>

            {/* 縦軸の目盛り */}
            <div className="flex">
              <div className="w-12 h-64 flex flex-col justify-between text-xs text-muted-foreground">
                <span>{maxTime}分</span>
                <span>{Math.round(maxTime * 0.75)}分</span>
                <span>{Math.round(maxTime * 0.5)}分</span>
                <span>{Math.round(maxTime * 0.25)}分</span>
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

                <div className="h-64 flex items-end justify-between gap-1 pl-2 pb-2 relative">
                  {data.map((item, index) => {
                    const barHeight = maxTime > 0 ? (item.totalTime / maxTime) * 240 : 4
                    const barColor = getBarColor(item.totalTime, maxTime)

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1 relative group"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* 数値表示 */}
                        <div className="absolute -top-6 text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.totalTime}分
                        </div>

                        {/* 棒グラフ */}
                        <div
                          className={`${barColor} rounded-t w-full min-h-[4px] transition-all duration-300 hover:opacity-80 cursor-pointer shadow-sm`}
                          style={{
                            height: `${barHeight}px`,
                          }}
                        />

                        {/* 日付ラベル */}
                        <div className="mt-2 text-center">
                          <div className="text-xs text-muted-foreground transform -rotate-45 origin-center whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString("ja-JP", {
                              month: "numeric",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-muted-foreground/70 mt-1">
                            {new Date(item.date).toLocaleDateString("ja-JP", {
                              weekday: "short",
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
