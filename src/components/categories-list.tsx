"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Category } from "@/lib/database"
import { deleteCategoryAction } from "@/app/dashboard/categories/actions"
import { 
  MoreHorizontal,
  Edit,
  Trash2,
  FolderOpen
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CategoryForm } from "./category-form"
import Link from "next/link"

interface CategoriesListProps {
  categories: Category[]
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  const router = useRouter()

  const handleDeleteCategory = async (category: Category) => {
    try {
      const result = await deleteCategoryAction(category.id)

      if (result.success) {
        toast.success("Kategori berhasil dihapus")
        router.refresh()
      } else {
        toast.error(result.message || "Gagal menghapus kategori")
      }
    } catch (error) {
      console.error("Kesalahan saat menghapus kategori:", error)
      toast.error("Gagal menghapus kategori")
    } finally {
      setCategoryToDelete(null)
    }
  }

  const handleEditSuccess = () => {
    setCategoryToEdit(null)
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Belum ada kategori</h3>
        <p>Buat kategori pertama Anda untuk mengatur tugas.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {categories.map((category) => (
          <Card key={category.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: category.color }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/dashboard/tasks?category=${category.id}`}
                      className="block hover:text-primary transition-colors"
                    >
                      <h3 className="font-medium text-lg truncate">
                        {category.name}
                      </h3>
                    </Link>
                    
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${category.color}20`, 
                          borderColor: category.color 
                        }}
                      >
                        {category.color}
                      </Badge>
                      
                      <span className="text-xs text-muted-foreground">
                        Dibuat {new Date(category.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCategoryToEdit(category)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Ubah Kategori
                  </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                    <Link href={`/dashboard/tasks?category=${category.id}`}>
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Lihat Tugas
                    </Link>
                  </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setCategoryToDelete(category)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Kategori
                  </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={!!categoryToEdit} onOpenChange={() => setCategoryToEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Kategori</DialogTitle>
            <DialogDescription>
              Perbarui detail kategori Anda.
            </DialogDescription>
          </DialogHeader>
          {categoryToEdit && (
            <CategoryForm 
              category={categoryToEdit} 
              mode="edit" 
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus kategori {categoryToDelete?.name}?
              Tindakan ini tidak dapat dibatalkan. Tugas dalam kategori ini akan menjadi tanpa kategori.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
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
