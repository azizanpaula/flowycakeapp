"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { logProduction } from "@/lib/cakeflow-database"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

const NO_RECIPE_VALUE = "__none__"

type RecipeOption = {
  id: string
  name: string
  productId?: string | null
  productName?: string | null
}

type ProductOption = {
  id: string
  name: string
}

const productionSchema = z.object({
  recipe_id: z
    .union([z.string().min(1), z.literal(NO_RECIPE_VALUE)])
    .optional()
    .transform((value) => (!value || value === NO_RECIPE_VALUE ? undefined : value)),
  product_id: z.string().min(1, "Produk wajib dipilih"),
  quantity_produced: z.coerce
    .number({ invalid_type_error: "Jumlah harus berupa angka" })
    .min(1, "Minimal 1 unit"),
  batch_number: z
    .union([z.string().max(50, "Kode batch terlalu panjang"), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  notes: z
    .union([z.string().max(200, "Catatan terlalu panjang"), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
})

type ProductionFormData = z.infer<typeof productionSchema>

interface ProductionLogFormProps {
  recipes: RecipeOption[]
  products: ProductOption[]
}

export function ProductionLogForm({ recipes, products }: ProductionLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const recipeMap = useMemo(() => {
    const map = new Map<string, RecipeOption>()
    recipes.forEach((recipe) => map.set(recipe.id, recipe))
    return map
  }, [recipes])

  const form = useForm<ProductionFormData>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      recipe_id: recipes.length > 0 ? recipes[0].id : NO_RECIPE_VALUE,
      product_id: products.length > 0 ? products[0].id : "",
      quantity_produced: 1,
      batch_number: undefined,
      notes: undefined,
    },
  })

  const noProducts = products.length === 0

  const selectedRecipeId = form.watch("recipe_id")

  useEffect(() => {
    if (noProducts || !selectedRecipeId || selectedRecipeId === NO_RECIPE_VALUE) {
      return
    }

    const recipe = recipeMap.get(selectedRecipeId)
    if (recipe && recipe.productId) {
      form.setValue("product_id", recipe.productId)
    }
  }, [selectedRecipeId, recipeMap, form, noProducts])

  const onSubmit = async (values: ProductionFormData) => {
    setIsSubmitting(true)

    try {
      const result = await logProduction(
        {
          recipe_id: values.recipe_id,
          product_id: values.product_id,
          quantity_produced: values.quantity_produced,
          batch_number: values.batch_number,
          notes: values.notes,
        },
        undefined,
      )

      if (!result) {
        toast.error("Gagal mencatat produksi")
        return
      }

      toast.success("Produksi berhasil dicatat")
      form.reset({
        recipe_id: values.recipe_id ?? NO_RECIPE_VALUE,
        product_id: values.product_id,
        quantity_produced: 1,
        batch_number: undefined,
        notes: undefined,
      })
      router.refresh()
    } catch (error) {
      console.error("Kesalahan saat mencatat produksi:", error)
      toast.error("Terjadi kesalahan saat menyimpan produksi")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (noProducts) {
    return (
      <div className="text-sm text-muted-foreground">
        Tambahkan produk terlebih dahulu sebelum mencatat produksi.
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {recipes.length > 0 && (
          <FormField
            control={form.control}
            name="recipe_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resep (opsional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih resep" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                        {recipe.productName ? ` • ${recipe.productName}` : ""}
                      </SelectItem>
                    ))}
                    <SelectItem value={NO_RECIPE_VALUE}>
                      Tanpa resep
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produk *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity_produced"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jumlah Produksi *</FormLabel>
              <FormControl>
                <Input type="number" min={1} step="1" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="batch_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Batch</FormLabel>
                <FormControl>
                  <Input value={field.value ?? ""} onChange={field.onChange} disabled={isSubmitting} placeholder="Opsional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catatan</FormLabel>
                <FormControl>
                  <Textarea
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="Opsional"
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Catat Produksi
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
