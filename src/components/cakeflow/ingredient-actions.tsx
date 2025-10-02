"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Ingredient } from "@/lib/cakeflow-database"
import { updateIngredientAction, deleteIngredientAction } from "@/app/dashboard/cakeflow/ingredients/actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Edit2, Trash2, Loader2 } from "lucide-react"

const ingredientSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
  unit: z.string().min(1, "Satuan wajib diisi").max(20, "Satuan terlalu panjang"),
  current_stock: z.coerce.number({ invalid_type_error: "Stok harus berupa angka" }).min(0, "Minimal 0"),
  low_stock_threshold: z
    .union([z.coerce.number().min(0, "Minimal 0"), z.literal("")])
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

type IngredientFormValues = z.infer<typeof ingredientSchema>

const commonUnits = ["kg", "gram", "pcs", "liter", "ml", "buah"]

interface IngredientActionsProps {
  ingredient: Ingredient
}

export function IngredientActions({ ingredient }: IngredientActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: ingredient.name ?? "",
      unit: ingredient.unit ?? "",
      current_stock: Number(ingredient.current_stock ?? 0),
      low_stock_threshold: ingredient.low_stock_threshold ?? undefined,
      purchase_price: ingredient.last_purchase_price ?? undefined,
      purchase_quantity: ingredient.last_purchase_quantity ?? undefined,
      purchase_unit: ingredient.last_purchase_unit ?? ingredient.unit ?? undefined,
    },
  })

  const unitValue = form.watch("unit")

  useEffect(() => {
    if (editOpen) {
      form.reset({
        name: ingredient.name ?? "",
        unit: ingredient.unit ?? "",
        current_stock: Number(ingredient.current_stock ?? 0),
        low_stock_threshold: ingredient.low_stock_threshold ?? undefined,
        purchase_price: ingredient.last_purchase_price ?? undefined,
        purchase_quantity: ingredient.last_purchase_quantity ?? undefined,
        purchase_unit: ingredient.last_purchase_unit ?? ingredient.unit ?? undefined,
      })
    }
  }, [editOpen, ingredient, form])

  useEffect(() => {
    const currentPurchaseUnit = form.getValues("purchase_unit")
    if (!currentPurchaseUnit) {
      form.setValue("purchase_unit", unitValue)
    }
  }, [unitValue, form])

  const handleSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateIngredientAction({
        id: ingredient.id,
        name: values.name.trim(),
        unit: values.unit.trim(),
        current_stock: values.current_stock,
        low_stock_threshold: values.low_stock_threshold,
        purchase_price: values.purchase_price,
        purchase_quantity: values.purchase_quantity,
        purchase_unit: values.purchase_unit?.trim() || values.unit.trim(),
      })

      if (!result.success) {
        toast.error(result.message ?? "Gagal memperbarui bahan")
        return
      }

      toast.success("Bahan berhasil diperbarui")
      setEditOpen(false)
      router.refresh()
    })
  })

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteIngredientAction(ingredient.id)

      if (!result.success) {
        toast.error(result.message ?? "Gagal menghapus bahan")
        return
      }

      toast.success("Bahan berhasil dihapus")
      setDeleteOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ubah bahan">
            <Edit2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Bahan</DialogTitle>
            <DialogDescription>
              Perbarui detail bahan, stok, dan catatan harga pembelian terakhir.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Satuan</FormLabel>
                      <FormControl>
                        <Input
                          list={`ingredient-units-${ingredient.id}`}
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <datalist id={`ingredient-units-${ingredient.id}`}>
                        {commonUnits.map((unit) => (
                          <option key={unit} value={unit} />
                        ))}
                      </datalist>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Saat Ini</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" disabled={isPending} {...field} />
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
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        disabled={isPending}
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
                        disabled={isPending}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Total harga saat pembelian terakhir untuk jumlah di bawah.
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
                          disabled={isPending}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Sesuaikan dengan satuan utama bahan, misal 0.5 untuk 500 gram jika satuan utama kg.
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
                          disabled={isPending}
                          placeholder="Opsional (misal: kg, gram)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending} className="w-full md:w-auto">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Hapus bahan">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus bahan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus {ingredient.name}. Data terkait tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
