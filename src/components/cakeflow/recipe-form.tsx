"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createRecipe, addRecipeItem, deleteRecipe } from "@/lib/cakeflow-database"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

type ProductOption = {
  id: string
  name: string
}

type IngredientOption = {
  id: string
  name: string
  unit?: string | null
}

const recipeItemSchema = z.object({
  ingredient_id: z.string().min(1, "Bahan wajib dipilih"),
  quantity_needed: z.coerce
    .number({ invalid_type_error: "Jumlah harus berupa angka" })
    .gt(0, "Jumlah minimal 0.01"),
  unit: z.string().min(1, "Satuan wajib diisi").max(20, "Satuan terlalu panjang"),
})

const recipeSchema = z.object({
  product_id: z.string().min(1, "Produk wajib dipilih"),
  name: z.string().min(2, "Nama resep wajib diisi").max(120, "Nama terlalu panjang"),
  description: z
    .union([z.string().max(400, "Deskripsi terlalu panjang"), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value?.trim() || undefined)),
  preparation_time: z
    .union([z.coerce.number().min(0, "Minimal 0 menit"), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  items: z.array(recipeItemSchema).min(1, "Minimal 1 bahan untuk resep"),
})

type RecipeFormData = z.infer<typeof recipeSchema>

interface RecipeFormProps {
  products: ProductOption[]
  ingredients: IngredientOption[]
}

export function RecipeForm({ products, ingredients }: RecipeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ingredientMap = useMemo(() => {
    const map = new Map<string, IngredientOption>()
    ingredients.forEach((ingredient) => map.set(ingredient.id, ingredient))
    return map
  }, [ingredients])

  const productMap = useMemo(() => {
    const map = new Map<string, ProductOption>()
    products.forEach((product) => map.set(product.id, product))
    return map
  }, [products])

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      product_id: products[0]?.id ?? "",
      name: products[0]?.name ?? "",
      description: undefined,
      preparation_time: undefined,
      items: [{
        ingredient_id: ingredients[0]?.id ?? "",
        quantity_needed: 1,
        unit: ingredients[0]?.unit ?? "",
      }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const noProducts = products.length === 0
  const noIngredients = ingredients.length === 0

  const selectedProductId = form.watch("product_id")
  const currentName = form.watch("name")

  useEffect(() => {
    if (noProducts || !selectedProductId) {
      return
    }

    const product = productMap.get(selectedProductId)
    if (product && (!currentName || currentName.trim().length === 0)) {
      form.setValue("name", product.name)
    }
  }, [selectedProductId, currentName, productMap, form, noProducts])

  const onSubmit = async (values: RecipeFormData) => {
    setIsSubmitting(true)

    try {
      const recipe = await createRecipe({
        product_id: values.product_id,
        name: values.name.trim(),
        description: values.description,
        preparation_time: values.preparation_time,
      })

      if (!recipe) {
        toast.error("Gagal menyimpan resep")
        return
      }

      let hasItemError = false

      for (const item of values.items) {
        const result = await addRecipeItem({
          recipe_id: recipe.id,
          ingredient_id: item.ingredient_id,
          quantity_needed: item.quantity_needed,
          unit: item.unit,
        })

        if (!result) {
          hasItemError = true
          break
        }
      }

      if (hasItemError) {
        await deleteRecipe(recipe.id)
        toast.error("Resep gagal disimpan karena bahan tidak valid. Coba lagi.")
        return
      }

      toast.success("Resep berhasil ditambahkan")
      router.refresh()
      form.reset({
        product_id: values.product_id,
        name: productMap.get(values.product_id)?.name ?? "",
        description: undefined,
        preparation_time: undefined,
        items: [{
          ingredient_id: ingredients[0]?.id ?? "",
          quantity_needed: 1,
          unit: ingredients[0]?.unit ?? "",
        }],
      })
    } catch (error) {
      console.error("Kesalahan saat membuat resep:", error)
      toast.error("Terjadi kesalahan saat menyimpan resep")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (noProducts) {
    return (
      <div className="text-sm text-muted-foreground">
        Tambahkan produk terlebih dahulu sebelum membuat resep.
      </div>
    )
  }

  if (noIngredients) {
    return (
      <div className="text-sm text-muted-foreground">
        Tambahkan data bahan di menu Inventaris untuk mulai membuat resep.
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produk Jadi *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Resep *</FormLabel>
              <FormControl>
                <Input placeholder="Misal: Resep Black Forest" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="preparation_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waktu Persiapan (menit)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="Opsional"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel className="text-base">Bahan Resep *</FormLabel>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const defaultIngredient = ingredients[0]
                append({
                  ingredient_id: defaultIngredient?.id ?? "",
                  quantity_needed: 1,
                  unit: defaultIngredient?.unit ?? "",
                })
              }}
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-1" /> Tambah Bahan
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">Tambahkan setidaknya satu bahan untuk resep ini.</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-md p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.ingredient_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bahan *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value)
                            const ingredient = ingredientMap.get(value)
                            if (ingredient && ingredient.unit) {
                              form.setValue(`items.${index}.unit`, ingredient.unit)
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih bahan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ingredients.map((ingredient) => (
                              <SelectItem key={ingredient.id} value={ingredient.id}>
                                {ingredient.name}
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
                    name={`items.${index}.quantity_needed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kuantitas *</FormLabel>
                        <FormControl>
                          <Input type="number" min={0.01} step="0.01" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Satuan *</FormLabel>
                        <FormControl>
                          <Input placeholder="misal: gram" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {fields.length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Hapus
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
              Simpan Resep
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
