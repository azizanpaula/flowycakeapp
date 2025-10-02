"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { updateTask, type Task } from "@/lib/database"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RecentTasksProps {
  tasks: Task[]
}

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
  in_progress: { icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
  completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" }
}

const statusLabels: Record<Task['status'], string> = {
  pending: 'Menunggu',
  in_progress: 'Sedang dikerjakan',
  completed: 'Selesai'
}

const priorityConfig = {
  low: { color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800", label: "Rendah" },
  medium: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20", label: "Sedang" },
  high: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20", label: "Tinggi" }
}

export function RecentTasks({ tasks }: RecentTasksProps) {
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())
  const router = useRouter()

  const handleStatusChange = async (taskId: string, completed: boolean) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId))

    try {
      const newStatus = completed ? 'completed' : 'pending'
      const result = await updateTask(taskId, { status: newStatus })

      if (result) {
        toast.success(`Tugas ditandai sebagai ${statusLabels[newStatus].toLowerCase()}`)
        router.refresh()
      } else {
        toast.error("Gagal memperbarui tugas")
      }
    } catch (error) {
      console.error("Kesalahan saat memperbarui tugas:", error)
      toast.error("Gagal memperbarui tugas")
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Belum ada tugas. Buat tugas pertama Anda untuk mulai!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const StatusIcon = statusConfig[task.status].icon
        const isUpdating = updatingTasks.has(task.id)
        
        return (
          <div 
            key={task.id} 
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={(checked) => handleStatusChange(task.id, !!checked)}
              disabled={isUpdating}
              className="mt-0.5"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium truncate ${
                  task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                }`}>
                  {task.title}
                </h4>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusLabels[task.status]}
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}
                  >
                    {priorityConfig[task.priority].label}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: localeId })}
                </span>
                
                {task.category && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: task.category.color }}
                    />
                    <span>{task.category.name}</span>
                  </div>
                )}

                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Jatuh tempo {formatDistanceToNow(new Date(task.due_date), { addSuffix: true, locale: localeId })}
                    </span>
                  </div>
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {task.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${task.id}`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Ubah
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => {
                    // TODO: Implement delete functionality
                    toast.info("Fitur hapus segera hadir!")
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </div>
  )
}
