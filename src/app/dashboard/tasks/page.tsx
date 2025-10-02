import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTasks, getCategories } from "@/lib/database"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"
import { TasksFilter } from "@/components/tasks-filter"
import { TasksList } from "@/components/tasks-list"

interface TasksPageProps {
  searchParams: {
    status?: string
    category?: string
    priority?: string
    search?: string
  }
}

async function TasksContent({ searchParams }: TasksPageProps) {
  const [tasks, categories] = await Promise.all([
    getTasks({
      status: searchParams.status,
      category_id: searchParams.category,
      priority: searchParams.priority,
    }),
    getCategories()
  ])

  // Filter by search term if provided
  const filteredTasks = searchParams.search
    ? tasks.filter(task => 
        task.title.toLowerCase().includes(searchParams.search!.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchParams.search!.toLowerCase())
      )
    : tasks

  const activeFilters = {
    status: searchParams.status,
    category: searchParams.category,
    priority: searchParams.priority,
    search: searchParams.search,
  }

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
          <h1 className="text-3xl font-bold tracking-tight">Tugas</h1>
          <p className="text-muted-foreground">
            Kelola dan atur tugas Anda
          </p>
        </div>
        <Link href="/dashboard/tasks/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tugas Baru
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Saring dan cari tugas Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TasksFilter 
            categories={categories}
            activeFilters={activeFilters}
          />
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Tugas ({filteredTasks.length})
            </span>
            {activeFilterCount > 0 && (
              <Link href="/dashboard/tasks">
                <Button variant="outline" size="sm">
                  Hapus Filter
                </Button>
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TasksList tasks={filteredTasks} />
        </CardContent>
      </Card>
    </div>
  )
}

export default function TasksPage({ searchParams }: TasksPageProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <TasksContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
