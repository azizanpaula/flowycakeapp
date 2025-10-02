import { createSupabaseServerClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/user"

// Types
export type ProfileRole = 'admin' | 'kasir' | 'staf_dapur'

export interface Profile {
  id: string
  full_name?: string
  role: ProfileRole
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  category_id?: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
  category?: Category
}

// Profile functions
export async function createOrUpdateProfile(profileData: {
  full_name?: string
  role?: ProfileRole
}) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createSupabaseServerClient()

  const fallbackName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  const fullName = profileData.full_name
    ?? (fallbackName.length > 0 ? fallbackName : undefined)
    ?? user.email
    ?? user.id

  const allowedRoles = new Set<ProfileRole>(['admin', 'kasir', 'staf_dapur'])
  const fallbackRole: ProfileRole = 'kasir'
  const userRole = (user.role && allowedRoles.has(user.role as ProfileRole))
    ? (user.role as ProfileRole)
    : fallbackRole
  const role: ProfileRole = profileData.role ?? userRole

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      user_id: user.id,
      email: user.email,
      full_name: fullName,
      role,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating/updating profile:', error?.message, error?.details, error?.code)
    return null
  }

  return data as Profile
}

export async function getProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

// Category functions
export async function getCategories() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data as Category[]
}

export async function createCategory(categoryData: {
  name: string
  color?: string
  description?: string
}) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: categoryData.name,
      color: categoryData.color || '#3B82F6',
      description: categoryData.description,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    return null
  }

  return data as Category
}

export async function updateCategory(categoryId: string, updates: {
  name?: string
  color?: string
  description?: string
}) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    return null
  }

  return data as Category
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    console.error('Error deleting category:', error)
    return false
  }

  return true
}

// Task functions
export async function getTasks(filters?: {
  status?: string
  category_id?: string
  priority?: string
}) {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('tasks')
    .select(`
      *,
      category:categories(*)
    `)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }

  return data as Task[]
}

export async function createTask(taskData: {
  title: string
  description?: string
  category_id?: string
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
}) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: taskData.title,
      description: taskData.description,
      category_id: taskData.category_id,
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date,
    })
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) {
    console.error('Error creating task:', error)
    return null
  }

  return data as Task
}

export async function updateTask(taskId: string, updates: {
  title?: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  category_id?: string
  due_date?: string
  completed_at?: string | null
}) {
  const supabase = await createSupabaseServerClient()

  // Handle completed_at timestamp based on status
  if (updates.status === 'completed') {
    updates = { ...updates, completed_at: new Date().toISOString() }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) {
    console.error('Error updating task:', error)
    return null
  }

  return data as Task
}

export async function deleteTask(taskId: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    return false
  }

  return true
}

// Dashboard stats
export async function getDashboardStats() {
  const supabase = await createSupabaseServerClient()

  const [tasksResult, categoriesResult] = await Promise.all([
    supabase.from('tasks').select('status, priority'),
    supabase.from('categories').select('id')
  ])

  const tasks = tasksResult.data || []
  const categories = categoriesResult.data || []

  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    highPriorityTasks: tasks.filter(t => t.priority === 'high').length,
    totalCategories: categories.length,
  }

  return stats
}
