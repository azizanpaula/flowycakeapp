"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createTask, updateTask, type Category, type Task } from "@/lib/database"
import { CalendarIcon, Loader2, Save } from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const UNCATEGORIZED_VALUE = "__none__"

const taskSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200, "Judul tidak boleh lebih dari 200 karakter"),
  description: z.string().max(1000, "Deskripsi tidak boleh lebih dari 1000 karakter").optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  category_id: z.string().optional(),
  due_date: z.date().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  categories: Category[]
  task?: Task
  mode?: "create" | "edit"
}

export function TaskForm({ categories, task, mode = "create" }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "medium",
      status: task?.status || "pending",
      category_id: task?.category_id ?? UNCATEGORIZED_VALUE,
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
    },
  })

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true)

    try {
      const taskData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category_id: data.category_id === UNCATEGORIZED_VALUE ? undefined : data.category_id,
        due_date: data.due_date?.toISOString(),
      }

      let result
      if (mode === "edit" && task) {
        result = await updateTask(task.id, {
          ...taskData,
          status: data.status,
        })
      } else {
        result = await createTask(taskData)
      }

      if (result) {
        const successMessage = mode === "edit" 
          ? "Tugas berhasil diperbarui!"
          : "Tugas berhasil dibuat!"
        toast.success(successMessage)
        router.push("/dashboard/tasks")
        router.refresh()
      } else {
        const errorMessage = mode === "edit" 
          ? "Gagal memperbarui tugas"
          : "Gagal membuat tugas"
        toast.error(errorMessage)
      }
    } catch (error) {
      const actionVerb = mode === "edit" ? "memperbarui" : "membuat"
      console.error(`Kesalahan saat ${actionVerb} tugas:`, error)
      const errorMessage = mode === "edit" 
        ? "Gagal memperbarui tugas"
        : "Gagal membuat tugas"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Judul *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Masukkan judul tugas..." 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Judul yang jelas untuk tugas ini
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Jelaskan tugas Anda secara detail..."
                  className="min-h-[100px]"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Detail tambahan opsional mengenai pekerjaan yang harus dilakukan
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioritas *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? UNCATEGORIZED_VALUE}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih prioritas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        Prioritas Rendah
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Prioritas Sedang
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Prioritas Tinggi
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status (only show in edit mode) */}
          {mode === "edit" && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Menunggu
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Sedang dikerjakan
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Selesai
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Category */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem className={mode === "create" ? "md:col-span-1" : ""}>
                <FormLabel>Kategori</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? UNCATEGORIZED_VALUE}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormDescription>
                  Kelompokkan tugas dengan kategori
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Due Date */}
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Jatuh Tempo</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: localeId })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Tenggat opsional untuk tugas ini
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "edit" ? "Memperbarui..." : "Membuat..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === "edit" ? "Perbarui Tugas" : "Buat Tugas"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
