import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getIngredients } from "@/lib/cakeflow-database"
import { Sprout, AlertTriangle, PlusCircle } from "lucide-react"
import { IngredientForm } from "@/components/cakeflow/ingredient-form"
import { IngredientActions } from "@/components/cakeflow/ingredient-actions"

async function IngredientsContent() {
  const ingredients = await getIngredients()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Tambah Bahan Baru
            </CardTitle>
            <CardDescription>
              Catat stok awal bahan baku langsung dari aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IngredientForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5" />
              Bahan Produksi
            </CardTitle>
            <CardDescription>
              Pantau stok bahan baku dan batas minimum untuk produksi harian
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ingredients.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Belum ada data bahan. Gunakan formulir di sebelah kiri untuk menambahkan bahan pertama.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ingredients.map((ingredient) => {
                  const stock = Number(ingredient.current_stock ?? 0)
                  const threshold = Number(ingredient.low_stock_threshold ?? 0)
                  const isLowStock = threshold > 0 && stock <= threshold

                  return (
                    <Card key={ingredient.id} className="border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">
                              {ingredient.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{ingredient.unit}</Badge>
                            <IngredientActions ingredient={ingredient} />
                          </div>
                        </div>

                        <div className="text-sm space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Stok saat ini</span>
                            <span className="font-medium">{stock}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Batas rendah</span>
                            <span>{threshold > 0 ? threshold : 'Belum ditentukan'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">HPP per {ingredient.unit}</span>
                            <span>
                              {ingredient.average_cost
                                ? `Rp ${Number(ingredient.average_cost).toLocaleString('id-ID')}`
                                : '-'}
                            </span>
                          </div>
                          {ingredient.last_purchase_price != null && ingredient.last_purchase_quantity != null && (
                            <div className="text-xs text-muted-foreground">
                              Pembelian terakhir: Rp {Number(ingredient.last_purchase_price).toLocaleString('id-ID')} untuk {Number(ingredient.last_purchase_quantity).toLocaleString('id-ID')} {ingredient.last_purchase_unit ?? ingredient.unit}
                            </div>
                          )}
                          {ingredient.last_purchase_price != null && ingredient.last_purchase_quantity == null && (
                            <div className="text-xs text-muted-foreground">
                              Pembelian terakhir: Rp {Number(ingredient.last_purchase_price).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>

                        {isLowStock && (
                          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-100/60 dark:bg-amber-900/20 rounded-md px-2 py-1">
                            <AlertTriangle className="w-4 h-4" />
                            Stok berada di bawah batas minimum. Segera lakukan pemesanan ulang.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function IngredientsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <IngredientsContent />
      </Suspense>
    </div>
  )
}
