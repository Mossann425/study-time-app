"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase, type StudyTime } from "@/utils/supabase"
import { ScrollText, Clock, MessageSquare } from "lucide-react"

export function StudyLog() {
  const [studyLogs, setStudyLogs] = useState<StudyTime[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStudyLogs()
  }, [])

  const loadStudyLogs = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data, error } = await supabase
        .from("study_times")
        .select(`
          *,
          subjects (
            id,
            name
          )
        `)
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setStudyLogs(data || [])
    } catch (error) {
      console.error("学習ログの読み込みに失敗:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          学習ログ
        </CardTitle>
        <CardDescription>過去20件の学習記録</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p>読み込み中...</p>
          </div>
        ) : studyLogs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">まだ学習記録がありません</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {studyLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{(log as any).subjects?.name || "不明な科目"}</Badge>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {log.time}分
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDate(log.created_at)}</span>
                </div>
                {log.comment && (
                  <div className="flex items-start gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="text-muted-foreground">{log.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
