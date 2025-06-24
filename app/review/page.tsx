"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { StudyChart } from "@/components/study-chart"
import { StudyLog } from "@/components/study-log"

export default function ReviewPage() {
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
      }
    }

    checkSession()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-6">
          <StudyChart />
          <StudyLog />
        </div>
      </div>
    </div>
  )
}
