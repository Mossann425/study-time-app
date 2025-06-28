"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, type Subject } from "@/utils/supabase"
import { Clock, MessageSquare } from "lucide-react"

interface TimeRecorderProps {
  onTimeRecorded?: () => void
}

export function TimeRecorder({ onTimeRecorded }: TimeRecorderProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")
  const [studyTime, setStudyTime] = useState("")
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    try {
      console.log("科目の読み込みを開始...")
      const { data, error } = await supabase.from("subjects").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Supabaseエラー:", error)
        throw error
      }
      
      console.log("読み込まれた科目:", data)
      setSubjects(data || [])
    } catch (error) {
      console.error("科目の読み込みに失敗:", error)
      // エラーの詳細を表示
      if (error instanceof Error) {
        console.error("エラーメッセージ:", error.message)
        console.error("エラースタック:", error.stack)
      }
    }
  }

  const recordTime = async () => {
    if (!selectedSubjectId || !studyTime) return;

    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("ユーザーが見つかりません");

      // 型変換を安全に行う
      const subjectId = selectedSubjectId; // UUIDは文字列のまま
      const timeValue = parseInt(studyTime, 10);

      // デバッグ情報を出力
      console.log("型変換前:", {
        selectedSubjectId,
        studyTime,
        selectedSubjectIdType: typeof selectedSubjectId,
        studyTimeType: typeof studyTime
      });
      
      console.log("型変換後:", {
        subjectId,
        timeValue,
        subjectIdType: typeof subjectId,
        timeValueType: typeof timeValue
      });

      console.log("記録データ:", {
        user_id: userData.user.id,
        subject_id: subjectId,
        time: timeValue,
        comment: comment.trim() || null,
      });

      // 数値変換の確認
      if (isNaN(timeValue)) {
        throw new Error(`無効な学習時間: ${studyTime}`);
      }

      const { error } = await supabase.from("study_times").insert([
        {
          user_id: userData.user.id,
          subject_id: subjectId,
          time: timeValue,
          comment: comment.trim() || null,
        },
      ]);

      if (error) {
        // Supabaseからのエラーを直接throwする
        throw error;
      }

      // フォームをリセット
      setSelectedSubjectId("");
      setStudyTime("");
      setComment("");
      onTimeRecorded?.();

      alert("学習時間を記録しました！");
    } catch (error) {
      console.error("時間の記録に失敗:", error);
      
      // エラーをアラートで表示
      if (error instanceof Error) {
        alert(`記録に失敗しました: ${error.message}`);
      } else {
        alert(`記録に失敗しました: ${JSON.stringify(error)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          学習時間記録
        </CardTitle>
        <CardDescription>今日の学習時間を記録しましょう</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">科目</Label>
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="科目を選択してください" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">学習時間（分）</Label>
          <Input
            id="time"
            type="number"
            value={studyTime}
            onChange={(e) => setStudyTime(e.target.value)}
            placeholder="例: 60"
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            一言コメント（任意）
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="今日の学習について一言..."
            rows={3}
          />
        </div>

        <Button onClick={recordTime} className="w-full" disabled={isLoading || !selectedSubjectId || !studyTime}>
          {isLoading ? "記録中..." : "学習時間を記録"}
        </Button>
      </CardContent>
    </Card>
  )
}
