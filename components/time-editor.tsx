"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/utils/supabase"
import { Play, Pause, RotateCcw } from "lucide-react"

export default function TimeEditor() {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [subject, setSubject] = useState("")

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setTime((time) => time + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(0)
  }

  const handleSave = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        alert("ログインが必要です")
        return
      }

      const { error } = await supabase.from("study-time").insert({
        user_id: userData.user.id,
        time: time,
        subject: subject || "未設定",
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("保存エラー:", error)
        alert("保存に失敗しました")
      } else {
        alert("学習時間を保存しました！")
        handleReset()
        setSubject("")
      }
    } catch (error) {
      console.error("予期せぬエラー:", error)
      alert("エラーが発生しました")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>学習時間記録</CardTitle>
        <CardDescription>今日の学習時間を記録しましょう</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-primary">{formatTime(time)}</div>
        </div>

        <div className="flex justify-center space-x-2">
          {!isRunning ? (
            <Button onClick={handleStart} size="lg">
              <Play className="h-4 w-4 mr-2" />
              開始
            </Button>
          ) : (
            <Button onClick={handlePause} variant="secondary" size="lg">
              <Pause className="h-4 w-4 mr-2" />
              一時停止
            </Button>
          )}
          <Button onClick={handleReset} variant="outline" size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            リセット
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">科目・内容</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="例: 数学、英語、プログラミング"
          />
        </div>

        <Button onClick={handleSave} className="w-full" disabled={time === 0}>
          学習時間を保存
        </Button>
      </CardContent>
    </Card>
  )
}
