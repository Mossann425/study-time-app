"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { UserPlus, Mail, Lock } from "lucide-react"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const doRegister = async () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        const { data: userIdData, error: userIdError } = await supabase
          .from("user")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle()

        if (userIdError) {
          setError(userIdError.message)
          return
        }

        if (!userIdData) {
          const { error: insertError } = await supabase.from("user").insert({
            id: data.user.id,
            name: "ユーザー",
            created_at: data.user.created_at,
            study_goal: "未設定",
          })

          if (insertError) {
            setError(`ユーザーの新規登録に失敗しました: ${insertError.message}`)
            return
          }

          const { error: timeInsertError } = await supabase.from("study-time").insert({
            user_id: data.user.id,
            time: 0,
            created_at: data.user.created_at,
            subject: "未設定",
          })

          if (timeInsertError) {
            console.error("時間情報の保存に失敗しました:", timeInsertError.message)
          }
        }
        router.push("/")
      }
    } catch (error: any) {
      setError("予期せぬエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <UserPlus className="h-6 w-6" />
            新規登録
          </CardTitle>
          <CardDescription className="text-center">アカウントを作成して学習時間の管理を始めましょう</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              メールアドレス
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              パスワード
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              disabled={isLoading}
            />
          </div>

          <Button onClick={doRegister} className="w-full" disabled={isLoading}>
            {isLoading ? "登録中..." : "登録"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">すでにアカウントをお持ちですか？ </span>
            <Link href="/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
