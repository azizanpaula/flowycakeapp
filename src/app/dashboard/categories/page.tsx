import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategories } from "@/lib/database"
import { Plus, FolderOpen } from "lucide-react"
import { CategoriesList } from "@/components/categories-list"
import { CategoryForm } from "@/components/category-form"

async function CategoriesContent() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategori</h1>
          <p className="text-muted-foreground">
            Atur tugas Anda dengan kategori khusus
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Category Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Kategori Baru
            </CardTitle>
            <CardDescription>
              Buat kategori baru untuk mengatur tugas Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Kategori Anda ({categories.length})
            </CardTitle>
            <CardDescription>
              Kelola kategori yang sudah ada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoriesList categories={categories} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <CategoriesContent />
      </Suspense>
    </div>
  )
}
