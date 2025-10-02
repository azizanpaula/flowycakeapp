"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTask, type Category } from "@/lib/database"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const UNCATEGORIZED_VALUE = "__none__"

interface TaskQuickAddProps {
  categories: Category[]
}

export function TaskQuickAdd({ categories }: TaskQuickAddProps) {
  const [title, setTitle] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [categoryId, setCategoryId] = useState<string>(UNCATEGORIZED_VALUE)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error("Harap masukkan judul tugas")
      return
    }

    setIsLoading(true)

    try {
      const task = await createTask({
        title: title.trim(),
        priority,
        category_id: categoryId === UNCATEGORIZED_VALUE ? undefined : categoryId,
      })

      if (task) {
        toast.success("Tugas berhasil dibuat!")
        setTitle("")
        setPriority("medium")
        setCategoryId(UNCATEGORIZED_VALUE)
        router.refresh()
      } else {
        toast.error("Gagal membuat tugas")
      }
    } catch (error) {
      console.error("Kesalahan saat membuat tugas:", error)
      toast.error("Gagal membuat tugas")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Apa yang perlu dilakukan?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        
        <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Rendah</SelectItem>
            <SelectItem value="medium">Sedang</SelectItem>
            <SelectItem value="high">Tinggi</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNCATEGORIZED_VALUE}>Tanpa kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button type="submit" disabled={isLoading || !title.trim()}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </div>
    </form>
  )
}
