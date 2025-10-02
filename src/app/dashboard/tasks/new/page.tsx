import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategories } from "@/lib/database"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TaskForm } from "@/components/task-form"

async function NewTaskContent() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Tugas
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buat Tugas Baru</h1>
          <p className="text-muted-foreground">
            Tambahkan tugas baru ke alur kerja Anda
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Detail Tugas
          </CardTitle>
          <CardDescription>
            Lengkapi informasi berikut untuk membuat tugas baru
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <NewTaskContent />
      </Suspense>
    </div>
  )
}
