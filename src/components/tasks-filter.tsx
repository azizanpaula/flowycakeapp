"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { type Category } from "@/lib/database"

interface TasksFilterProps {
  categories: Category[]
  activeFilters: {
    status?: string
    category?: string
    priority?: string
    search?: string
  }
}

export function TasksFilter({ categories, activeFilters }: TasksFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(activeFilters.search || "")

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    in_progress: 'Sedang dikerjakan',
    completed: 'Selesai'
  }

  const priorityLabels: Record<string, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi'
  }

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    router.push(`/dashboard/tasks?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter("search", searchValue || null)
  }

  const clearAllFilters = () => {
    setSearchValue("")
    router.push("/dashboard/tasks")
  }

  const removeFilter = (key: string) => {
    if (key === "search") {
      setSearchValue("")
    }
    updateFilter(key, null)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cari tugas..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="outline">
          Cari
        </Button>
      </form>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status Filter */}
        <Select 
          value={activeFilters.status || "all"} 
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="in_progress">Sedang dikerjakan</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select 
          value={activeFilters.priority || "all"} 
          onValueChange={(value) => updateFilter("priority", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Prioritas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prioritas</SelectItem>
            <SelectItem value="low">Prioritas Rendah</SelectItem>
            <SelectItem value="medium">Prioritas Sedang</SelectItem>
            <SelectItem value="high">Prioritas Tinggi</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select 
          value={activeFilters.category || "all"} 
          onValueChange={(value) => updateFilter("category", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="uncategorized">Tanpa kategori</SelectItem>
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
      </div>

      {/* Active Filters */}
      {Object.values(activeFilters).some(Boolean) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter aktif:</span>
          
          {activeFilters.search && (
            <Badge variant="secondary" className="gap-1">
              Cari: {activeFilters.search}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => removeFilter("search")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {activeFilters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusLabels[activeFilters.status] || activeFilters.status}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => removeFilter("status")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {activeFilters.priority && (
            <Badge variant="secondary" className="gap-1">
              Prioritas: {priorityLabels[activeFilters.priority] || activeFilters.priority}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => removeFilter("priority")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          {activeFilters.category && (
            <Badge variant="secondary" className="gap-1">
              Kategori: {
                activeFilters.category === "uncategorized" 
                  ? "Tanpa kategori"
                  : categories.find(c => c.id === activeFilters.category)?.name || "Tidak diketahui"
              }
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4"
                onClick={() => removeFilter("category")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Hapus semua
          </Button>
        </div>
      )}
    </div>
  )
}
