"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createProduct } from "@/lib/cakeflow-database"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(100, "Nama terlalu panjang"),
  price: z.coerce.number({ invalid_type_error: "Harga harus berupa angka" }).min(0, "Harga minimal 0"),
  current_stock: z.coerce.number({ invalid_type_error: "Stok harus berupa angka" }).min(0, "Stok minimal 0"),
  low_stock_threshold: z
    .union([z.coerce.number().min(0, "Batas minimal 0"), z.literal("")])
    .optional(),
  image_url: z
    .union([z.string().url("URL tidak valid"), z.literal("")])
    .optional(),
  description: z
    .union([z.string().max(300, "Deskripsi terlalu panjang"), z.literal("")])
    .optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export function ProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      current_stock: 0,
      low_stock_threshold: undefined,
      image_url: undefined,
      description: undefined,
    },
  })

  const onSubmit = async (values: ProductFormData) => {
    setIsSubmitting(true)

    try {
      const transformedValues = {
        ...values,
        low_stock_threshold: values.low_stock_threshold === "" ? undefined : values.low_stock_threshold,
        image_url: values.image_url === "" ? undefined : values.image_url,
        description: values.description === "" ? undefined : values.description,
      }

      const result = await createProduct({
        name: transformedValues.name.trim(),
        price: transformedValues.price,
        current_stock: transformedValues.current_stock,
        low_stock_threshold: transformedValues.low_stock_threshold,
        image_url: transformedValues.image_url,
        description: transformedValues.description?.trim(),
      })

      if (!result) {
        toast.error("Gagal menambahkan produk")
        return
      }

      toast.success("Produk berhasil ditambahkan")
      form.reset({
        name: "",
        price: 0,
        current_stock: 0,
        low_stock_threshold: undefined,
        image_url: undefined,
        description: undefined,
      })
      router.refresh()
    } catch (error) {
      console.error("Kesalahan saat menambahkan produk:", error)
      toast.error("Terjadi kesalahan saat menyimpan produk")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Produk *</FormLabel>
              <FormControl>
                <Input placeholder="Misal: Black Forest" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harga (Rp) *</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="1000" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="current_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stok Saat Ini *</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="1" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="low_stock_threshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batas Stok Rendah</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="1"
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
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Gambar</FormLabel>
              <FormControl>
                <Input
                  type="url"
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
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Produk
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
