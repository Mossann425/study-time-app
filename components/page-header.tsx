"use client"

import { Button } from "@/components/ui/button"
import { supabase } from "@/utils/supabase"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LogOut, Settings, Home, BarChart3 } from "lucide-react"

export function PageHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Home className="h-6 w-6" />
            <span className="font-bold">学習時間管理</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Button variant={isActive("/") ? "default" : "ghost"} size="sm" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                メイン
              </Link>
            </Button>
            <Button variant={isActive("/review") ? "default" : "ghost"} size="sm" asChild>
              <Link href="/review">
                <BarChart3 className="h-4 w-4 mr-2" />
                振り返り
              </Link>
            </Button>
            <Button variant={isActive("/settings") ? "default" : "ghost"} size="sm" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
