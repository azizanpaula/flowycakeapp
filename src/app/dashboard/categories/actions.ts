"use server"

import { revalidatePath } from "next/cache"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/user"

export async function createCategoryAction(input: {
  name: string
  color?: string
  description?: string
}) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, message: "Pengguna tidak ditemukan" }
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: input.name,
      color: input.color || '#3B82F6',
      description: input.description,
    })

  if (error) {
    console.error('Error creating category:', error)
    return { success: false, message: "Gagal membuat kategori" }
  }

  revalidatePath('/dashboard/categories')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateCategoryAction(categoryId: string, updates: {
  name?: string
  color?: string
  description?: string
}) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)

  if (error) {
    console.error('Error updating category:', error)
    return { success: false, message: "Gagal memperbarui kategori" }
  }

  revalidatePath('/dashboard/categories')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteCategoryAction(categoryId: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    console.error('Error deleting category:', error)
    return { success: false, message: "Gagal menghapus kategori" }
  }

  revalidatePath('/dashboard/categories')
  revalidatePath('/dashboard')
  return { success: true }
}
