"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { Category } from "@/lib/database"
import { Loader2, Save, Palette } from "lucide-react"
import { toast } from "sonner"
import { createCategoryAction, updateCategoryAction } from "@/app/dashboard/categories/actions"

const categorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(50, "Nama tidak boleh lebih dari 50 karakter"),
  description: z.string().max(200, "Deskripsi tidak boleh lebih dari 200 karakter").optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Masukkan kode warna hex yang valid"),
})

type CategoryFormData = z.infer<typeof categorySchema>

interface CategoryFormProps {
  category?: Category
  mode?: "create" | "edit"
  onSuccess?: () => void
}

const predefinedColors = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
]

export function CategoryForm({ category, mode = "create", onSuccess }: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      color: category?.color || "#3B82F6",
    },
  })

  const selectedColor = form.watch("color")

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true)

    try {
      let result
      if (mode === "edit" && category) {
        result = await updateCategory(category.id, data)
      } else {
        result = await createCategory(data)
      }

      if (result) {
        const successMessage = mode === "edit" 
          ? "Kategori berhasil diperbarui!" 
          : "Kategori berhasil dibuat!"
        toast.success(successMessage)
        form.reset()
        router.refresh()
        onSuccess?.()
      } else {
        const errorMessage = mode === "edit" 
          ? "Gagal memperbarui kategori"
          : "Gagal membuat kategori"
        toast.error(errorMessage)
      }
    } catch (error) {
      const actionVerb = mode === "edit" ? "memperbarui" : "membuat"
      console.error(`Kesalahan saat ${actionVerb} kategori:`, error)
      const errorMessage = mode === "edit" 
        ? "Gagal memperbarui kategori"
        : "Gagal membuat kategori"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Masukkan nama kategori..." 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
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
                  placeholder="Deskripsi opsional..."
                  className="min-h-[80px]"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Warna *
              </FormLabel>
              <FormControl>
                <div className="space-y-3">
                  {/* Color Input */}
                  <div className="flex items-center gap-2">
                    <Input 
                      type="color"
                      className="w-12 h-10 p-1 border rounded cursor-pointer"
                      {...field}
                      disabled={isLoading}
                    />
                    <Input 
                      type="text"
                      placeholder="#3B82F6"
                      className="flex-1 font-mono text-sm"
                      {...field}
                      disabled={isLoading}
                    />
                  </div>
                  
                  {/* Predefined Colors */}
                  <div className="grid grid-cols-5 gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          selectedColor === color 
                            ? "border-foreground shadow-md" 
                            : "border-border hover:border-foreground/50"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => field.onChange(color)}
                        disabled={isLoading}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Pilih warna untuk membedakan kategori ini
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview */}
        <div className="p-3 rounded-lg border bg-muted/50">
          <div className="text-sm text-muted-foreground mb-2">Pratinjau:</div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedColor }}
            />
            <span className="font-medium">
              {form.watch("name") || "Nama Kategori"}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {mode === "edit" ? "Memperbarui..." : "Membuat..."}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === "edit" ? "Perbarui Kategori" : "Buat Kategori"}
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
