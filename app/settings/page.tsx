"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, type Subject } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Settings, Target, User, BookOpen, Save, Edit, Database, Trash2 } from "lucide-react"

// 科目データの型（必要なカラムのみ）
interface SubjectSummary {
  id: string;
  name: string;
  created_at: string;
  last_accessed_at?: string;
  access_count?: number;
}

export default function SettingsPage() {
  const [goalText, setGoalText] = useState<string>("")
  const [currentUser, setCurrentUser] = useState("")
  const [subjects, setSubjects] = useState<SubjectSummary[]>([])
  const [editingSubject, setEditingSubject] = useState<string | null>(null)
  const [editingSubjectName, setEditingSubjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      } else {
        await loadUserData()
        await loadSubjects()
      }
    }

    checkSession()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: userInfo, error } = await supabase
        .from("users")
        .select("name, study_goal")
        .eq("id", userData.user.id)
        .maybeSingle()

      if (error) {
        console.error("ユーザー情報の取得に失敗:", error)
      } else if (userInfo) {
        setCurrentUser(userInfo.name || "")
        setGoalText(userInfo.study_goal || "")
      }
    } catch (error) {
      console.error("予期せぬエラー:", error)
    }
  }

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, created_at, last_accessed_at, access_count")
        .order("created_at", { ascending: false })
      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error("科目の読み込みに失敗:", error)
    }
  }

  const handleSaveUserInfo = async () => {
    if (!currentUser.trim()) {
      setError("ユーザー名を入力してください")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (!userData.user) {
        setError("ユーザー情報の取得に失敗しました。ログインしてください。")
        return
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          study_goal: goalText.trim() || "未設定",
          name: currentUser.trim(),
        })
        .eq("id", userData.user.id)

      if (updateError) {
        setError("保存に失敗しました。もう一度お試しください。")
        console.error("更新エラー:", updateError.message)
      } else {
        setMessage("設定が保存されました！")
      }
    } catch (error: any) {
      setError("予期せぬエラーが発生しました。")
      console.error("予期せぬエラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSubject = (subject: SubjectSummary) => {
    setEditingSubject(subject.id)
    setEditingSubjectName(subject.name)
  }

  const handleSaveSubject = async (subjectId: string) => {
    if (!editingSubjectName.trim()) return

    try {
      const { error } = await supabase.from("subjects").update({ name: editingSubjectName.trim() }).eq("id", subjectId)

      if (error) throw error

      setEditingSubject(null)
      setEditingSubjectName("")
      await loadSubjects()
      setMessage("科目名を更新しました！")
    } catch (error) {
      console.error("科目名の更新に失敗:", error)
      setError("科目名の更新に失敗しました")
    }
  }

  const handleCancelEdit = () => {
    setEditingSubject(null)
    setEditingSubjectName("")
  }

  // 並び替えロジック
  const sortedSubjects = (() => {
    if (!subjects.length) return []
    // last_accessed_atが最大のsubject
    const latestAccessed = subjects.reduce((prev, curr) =>
      (prev.last_accessed_at || '') > (curr.last_accessed_at || '') ? prev : curr
    )
    // access_countが最大のsubject
    const mostAccessed = subjects.reduce((prev, curr) =>
      (prev.access_count || 0) > (curr.access_count || 0) ? prev : curr
    )
    // latestAccessed, mostAccessed以外
    const others = subjects.filter(
      (s) => s.id !== latestAccessed.id && s.id !== mostAccessed.id
    )
    // latestAccessed, mostAccessedが同じ場合は重複しないように
    const result = [latestAccessed]
    if (mostAccessed.id !== latestAccessed.id) result.push(mostAccessed)
    return [
      ...result,
      ...others.sort((a, b) => (b.last_accessed_at || '').localeCompare(a.last_accessed_at || '')),
    ]
  })()

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* ユーザー情報設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              ユーザー設定
            </CardTitle>
            <CardDescription>ユーザー情報と学習目標を設定してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                ユーザー名
              </Label>
              <Input
                id="username"
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                placeholder="あなたの名前を入力してください"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                学習目標
              </Label>
              <Textarea
                id="goal"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="例: 毎日2時間勉強する、TOEIC800点を目指す"
                rows={4}
                disabled={isLoading}
              />
            </div>

            <Button onClick={handleSaveUserInfo} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "保存中..." : "設定を保存"}
            </Button>
          </CardContent>
        </Card>

        {/* 科目管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              科目管理
            </CardTitle>
            <CardDescription>科目名を編集できます</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground">まだ科目が登録されていません</p>
            ) : (
              <div className="space-y-3">
                {sortedSubjects.map((subject, idx) => (
                  <div key={subject.id} className="flex items-center gap-2 p-3 border rounded-lg">
                    {editingSubject === subject.id ? (
                      <>
                        <Input
                          value={editingSubjectName}
                          onChange={(e) => setEditingSubjectName(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveSubject(subject.id)}
                          disabled={!editingSubjectName.trim()}
                        >
                          保存
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          キャンセル
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="flex-1 justify-start">
                          {subject.name}
                        </Badge>
                        {/* タグ表示 */}
                        {idx === 0 && (
                          <Badge variant="default" className="ml-2">latest</Badge>
                        )}
                        {subject.id === (subjects.reduce((prev, curr) => (prev.access_count || 0) > (curr.access_count || 0) ? prev : curr).id) && (
                          <Badge variant="default" className="ml-2">最もアクセスしている</Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleEditSubject(subject)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
