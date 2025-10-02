"use server"

import { revalidatePath } from "next/cache"
import { updateIngredient, deleteIngredient } from "@/lib/cakeflow-database"

export async function updateIngredientAction(input: {
  id: string
  name: string
  unit: string
  current_stock: number
  low_stock_threshold?: number
  purchase_price?: number
  purchase_quantity?: number
  purchase_unit?: string
}) {
  const { id, name, unit, current_stock, low_stock_threshold, purchase_price, purchase_quantity, purchase_unit } = input

  const result = await updateIngredient(id, {
    name,
    unit,
    current_stock,
    low_stock_threshold,
    purchase_price,
    purchase_quantity,
    purchase_unit,
  })

  if (!result) {
    return { success: false, message: "Gagal memperbarui bahan" }
  }

  revalidatePath("/dashboard/cakeflow/ingredients")
  return { success: true }
}

export async function deleteIngredientAction(id: string) {
  const success = await deleteIngredient(id)

  if (!success) {
    return { success: false, message: "Gagal menghapus bahan" }
  }

  revalidatePath("/dashboard/cakeflow/ingredients")
  return { success: true }
}
