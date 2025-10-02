"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/user"

export async function createTaskAction(input: {
  title: string
  description?: string
  category_id?: string
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: "Pengguna tidak ditemukan" }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      category_id: input.category_id,
      priority: input.priority ?? 'medium',
      due_date: input.due_date,
    })

  if (error) {
    console.error('Error creating task:', error)
    return { success: false, message: "Gagal membuat tugas" }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateTaskAction(taskId: string, updates: {
  title?: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  category_id?: string
  due_date?: string
}) {
  const supabase = await createSupabaseServerClient()

  const payload = { ...updates }

  if (updates.status === 'completed') {
    Object.assign(payload, { completed_at: new Date().toISOString() })
  }

  const { error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task:', error)
    return { success: false, message: "Gagal memperbarui tugas" }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}
