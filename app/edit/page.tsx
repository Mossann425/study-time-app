"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Target, User, Save } from "lucide-react"

export default function EditPage() {
  const [goalText, setGoalText] = useState<string>("")
  const [currentUser, setCurrentUser] = useState("")
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
      }
    }

    checkSession()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data: userInfo, error } = await supabase
        .from("user")
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

  const handleSaveGoal = async () => {
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

      const { data, error: updateError } = await supabase
        .from("user")
        .update({
          study_goal: goalText.trim() || "未設定",
          name: currentUser.trim(),
        })
        .eq("id", userData.user.id)
        .select()

      if (updateError) {
        setError("保存に失敗しました。もう一度お試しください。")
        console.error("更新エラー:", updateError.message)
      } else {
        setMessage("設定が保存されました！")
        setTimeout(() => {
          router.push("/")
        }, 1500)
      }
    } catch (error: any) {
      setError("予期せぬエラーが発生しました。")
      console.error("予期せぬエラー:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              設定
            </CardTitle>
            <CardDescription>ユーザー情報と学習目標を設定してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <Button onClick={handleSaveGoal} className="w-full" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "保存中..." : "設定を保存"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
