"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { updateTask, deleteTask, type Task } from "@/lib/database"
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  RotateCcw
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

interface TasksListProps {
  tasks: Task[]
}

const statusConfig = {
  pending: { 
    icon: Clock, 
    color: "text-yellow-600", 
    bg: "bg-yellow-100 dark:bg-yellow-900/20",
    label: "Menunggu"
  },
  in_progress: { 
    icon: AlertCircle, 
    color: "text-blue-600", 
    bg: "bg-blue-100 dark:bg-blue-900/20",
    label: "Sedang dikerjakan"
  },
  completed: { 
    icon: CheckCircle, 
    color: "text-green-600", 
    bg: "bg-green-100 dark:bg-green-900/20",
    label: "Selesai"
  }
}

const priorityConfig = {
  low: { color: "text-gray-600", bg: "bg-gray-100 dark:bg-gray-800", label: "Rendah" },
  medium: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20", label: "Sedang" },
  high: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20", label: "Tinggi" }
}

export function TasksList({ tasks }: TasksListProps) {
  const [updatingTasks, setUpdatingTasks] = useState<Set<string>>(new Set())
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const router = useRouter()

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    setUpdatingTasks(prev => new Set(prev).add(taskId))

    try {
      const result = await updateTask(taskId, { status: newStatus })

      if (result) {
        toast.success(`Tugas ditandai sebagai ${statusConfig[newStatus].label.toLowerCase()}`)
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

  const handleDeleteTask = async (task: Task) => {
    try {
      const result = await deleteTask(task.id)

      if (result) {
        toast.success("Tugas berhasil dihapus")
        router.refresh()
      } else {
        toast.error("Gagal menghapus tugas")
      }
    } catch (error) {
      console.error("Kesalahan saat menghapus tugas:", error)
      toast.error("Gagal menghapus tugas")
    } finally {
      setTaskToDelete(null)
    }
  }

  const getStatusActions = (task: Task) => {
    const actions = []
    
    if (task.status !== 'pending') {
      actions.push({
        icon: RotateCcw,
        label: 'Tandai Menunggu',
        action: () => handleStatusChange(task.id, 'pending')
      })
    }
    
    if (task.status !== 'in_progress') {
      actions.push({
        icon: Play,
        label: 'Mulai Kerjakan',
        action: () => handleStatusChange(task.id, 'in_progress')
      })
    }
    
    if (task.status !== 'completed') {
      actions.push({
        icon: CheckCircle,
        label: 'Tandai Selesai',
        action: () => handleStatusChange(task.id, 'completed')
      })
    }

    return actions
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Tugas tidak ditemukan</h3>
        <p>Sesuaikan filter Anda atau buat tugas baru untuk mulai.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => {
          const StatusIcon = statusConfig[task.status].icon
          const isUpdating = updatingTasks.has(task.id)
          const statusActions = getStatusActions(task)
          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
          
          return (
            <Card key={task.id} className={`transition-all hover:shadow-md ${
              task.status === 'completed' ? 'opacity-75' : ''
            } ${isOverdue ? 'border-red-200 dark:border-red-800' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={(checked) => 
                      handleStatusChange(task.id, checked ? 'completed' : 'pending')
                    }
                    disabled={isUpdating}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link 
                        href={`/dashboard/tasks/${task.id}`}
                        className="flex-1 min-w-0"
                      >
                        <h3 className={`font-medium text-lg hover:text-primary transition-colors ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.title}
                        </h3>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tasks/${task.id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Ubah Tugas
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {statusActions.map((action, index) => (
                            <DropdownMenuItem 
                              key={index}
                              onClick={action.action}
                              disabled={isUpdating}
                            >
                              <action.icon className="w-4 h-4 mr-2" />
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setTaskToDelete(task)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Tugas
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {task.description && (
                      <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge 
                        variant="secondary" 
                        className={`${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[task.status].label}
                      </Badge>
                      
                      <Badge 
                        variant="outline" 
                        className={`${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}
                      >
                        Prioritas {priorityConfig[task.priority].label}
                      </Badge>

                      {task.category && (
                        <Badge 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-secondary/80"
                          style={{ backgroundColor: `${task.category.color}20`, borderColor: task.category.color }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full mr-2" 
                            style={{ backgroundColor: task.category.color }}
                          />
                          {task.category.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Dibuat {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: localeId })}
                      </span>

                      {task.due_date && (
                        <div className={`flex items-center gap-1 ${
                          isOverdue ? 'text-red-600 font-medium' : ''
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>
                            Jatuh tempo {format(new Date(task.due_date), 'd MMMM yyyy', { locale: localeId })}
                            {isOverdue && ' (Terlambat)'}
                          </span>
                        </div>
                      )}

                      {task.completed_at && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            Selesai {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true, locale: localeId })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tugas</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus tugas {taskToDelete?.title}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => taskToDelete && handleDeleteTask(taskToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
