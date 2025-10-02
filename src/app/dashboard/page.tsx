import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getDashboardStats, getTasks, getCategories, createOrUpdateProfile } from "@/lib/database"
import { getCurrentUser } from "@/lib/user"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Calendar,
  FolderOpen,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { TaskQuickAdd } from "@/components/task-quick-add"
import { RecentTasks } from "@/components/recent-tasks"

async function DashboardContent() {
  const user = await getCurrentUser()
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Silakan masuk untuk melihat dasbor Anda.</p>
      </div>
    )
  }

  // Ensure user profile exists
  await createOrUpdateProfile({})

  const [stats, recentTasks, categories] = await Promise.all([
    getDashboardStats(),
    getTasks(),
    getCategories()
  ])

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Selamat datang kembali, {user.firstName || 'Pengguna'}!
        </h1>
        <p className="text-muted-foreground">
          Berikut perkembangan tugas Anda hari ini.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/dashboard/tasks/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tugas Baru
          </Button>
        </Link>
        <Link href="/dashboard/categories">
          <Button variant="outline">
            <FolderOpen className="w-4 h-4 mr-2" />
            Kategori
          </Button>
        </Link>
      </div>
    </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tugas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCategories} kategori
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% tingkat penyelesaian
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sedang Dikerjakan</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingTasks} tertunda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prioritas Tinggi</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highPriorityTasks}</div>
            <p className="text-xs text-muted-foreground">
              Perlu perhatian
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Task */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Tambah Tugas Kilat
          </CardTitle>
          <CardDescription>
            Buat tugas baru tanpa meninggalkan dasbor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskQuickAdd categories={categories} />
        </CardContent>
      </Card>

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tugas Terbaru
            </CardTitle>
            <CardDescription>
              Daftar tugas terbaru beserta statusnya
            </CardDescription>
          </div>
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="sm">
              Lihat Semua
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <RecentTasks tasks={recentTasks.slice(0, 5)} />
        </CardContent>
      </Card>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Kategori
            </CardTitle>
            <CardDescription>
              Kategori tugas Anda dan pengelolaannya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link 
                  key={category.id} 
                  href={`/dashboard/tasks?category=${category.id}`}
                >
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80"
                    style={{ backgroundColor: `${category.color}20`, borderColor: category.color }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
