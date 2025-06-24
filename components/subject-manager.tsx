"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase, type Subject } from "@/utils/supabase"
import { Plus, BookOpen } from "lucide-react"

interface SubjectManagerProps {
  onSubjectAdded?: () => void
}

export function SubjectManager({ onSubjectAdded }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [newSubjectName, setNewSubjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase.from("subjects").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error("科目の読み込みに失敗:", error)
    }
  }

  const addSubject = async () => {
    if (!newSubjectName.trim()) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("subjects").insert([{ name: newSubjectName.trim() }])

      if (error) throw error

      setNewSubjectName("")
      await loadSubjects()
      onSubjectAdded?.()
    } catch (error) {
      console.error("科目の追加に失敗:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          科目管理
        </CardTitle>
        <CardDescription>新しい科目を追加できます</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="subject-name" className="sr-only">
              科目名
            </Label>
            <Input
              id="subject-name"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="科目名を入力"
              onKeyPress={(e) => e.key === "Enter" && addSubject()}
            />
          </div>
          <Button onClick={addSubject} disabled={isLoading || !newSubjectName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            追加
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <Badge key={subject.id} variant="secondary">
              {subject.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
