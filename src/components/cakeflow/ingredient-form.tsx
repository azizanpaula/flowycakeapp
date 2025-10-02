"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createIngredient } from "@/lib/cakeflow-database"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

const ingredientSchema = z.object({
  name: z.string().min(1, "Nama bahan wajib diisi").max(100, "Nama terlalu panjang"),
  current_stock: z.coerce.number({ invalid_type_error: "Stok harus berupa angka" }).min(0, "Stok minimal 0"),
  unit: z.string().min(1, "Satuan wajib diisi").max(20, "Satuan terlalu panjang"),
  low_stock_threshold: z
    .union([z.coerce.number().min(0, "Batas minimal 0"), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  purchase_price: z
    .union([z.coerce.number({ invalid_type_error: "Harga harus berupa angka" }).min(0, "Harga minimal 0"), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  purchase_quantity: z
    .union([z.coerce.number({ invalid_type_error: "Jumlah harus berupa angka" }).positive("Minimal 0.01"), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  purchase_unit: z.string().max(20).optional(),
})

type IngredientFormData = z.infer<typeof ingredientSchema>

const commonUnits = ["kg", "gram", "pcs", "liter", "ml", "buah"]

export function IngredientForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      current_stock: 0,
      unit: "kg",
      low_stock_threshold: undefined,
      purchase_price: undefined,
      purchase_quantity: undefined,
      purchase_unit: "kg",
    },
  })

  const unitValue = form.watch("unit")

  useEffect(() => {
    const currentPurchaseUnit = form.getValues("purchase_unit")
    if (!currentPurchaseUnit) {
      form.setValue("purchase_unit", unitValue)
    }
  }, [unitValue, form])

  const onSubmit = async (values: IngredientFormData) => {
    setIsSubmitting(true)

    try {
      const result = await createIngredient({
        name: values.name.trim(),
        current_stock: values.current_stock,
        unit: values.unit.trim(),
        low_stock_threshold: values.low_stock_threshold,
        purchase_price: values.purchase_price,
        purchase_quantity: values.purchase_quantity,
        purchase_unit: values.purchase_unit?.trim() || values.unit.trim(),
      })

      if (!result) {
        toast.error("Gagal menambahkan bahan")
        return
      }

      toast.success("Bahan berhasil ditambahkan")
      form.reset({
        name: "",
        current_stock: 0,
        unit: values.unit,
        low_stock_threshold: undefined,
        purchase_price: undefined,
        purchase_quantity: undefined,
        purchase_unit: values.unit,
      })
      router.refresh()
    } catch (error) {
      console.error("Kesalahan saat menambahkan bahan:", error)
      toast.error("Terjadi kesalahan saat menyimpan bahan")
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
              <FormLabel>Nama Bahan *</FormLabel>
              <FormControl>
                <Input placeholder="Misal: Tepung Terigu" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="current_stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stok Saat Ini *</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step="0.01" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Satuan *</FormLabel>
                <FormControl>
                  <Input list="ingredient-units" placeholder="kg, gram, pcs" {...field} disabled={isSubmitting} />
                </FormControl>
                <datalist id="ingredient-units">
                  {commonUnits.map((unit) => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
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
                  step="0.01"
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
          name="purchase_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Harga Beli Terakhir (Rp)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step="100"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  placeholder="Opsional"
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Masukkan total harga transaksi terakhir untuk jumlah pembelian di bawah.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchase_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah Pembelian</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="Opsional"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Gunakan satuan yang sama dengan bahan ini (misal 0.5 untuk 500 gram jika satuan utama kg).
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchase_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Satuan Pembelian</FormLabel>
                <FormControl>
                  <Input
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    placeholder="Opsional (misal: kg, gram)"
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
              Simpan Bahan
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
