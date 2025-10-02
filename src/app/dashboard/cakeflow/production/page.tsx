import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProductionLogs, getRecipes, getProducts } from "@/lib/cakeflow-database"
import { ChefHat, Package, CalendarClock, ClipboardList } from "lucide-react"
import { ProductionLogForm } from "@/components/cakeflow/production-log-form"

async function ProductionContent() {
  const [productionLogs, recipes, products] = await Promise.all([
    getProductionLogs(25),
    getRecipes(),
    getProducts(),
  ])

  const recipeOptions = recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    productId: recipe.product_id,
    productName: recipe.product?.name ?? null,
  }))

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Catat Produksi Baru
            </CardTitle>
            <CardDescription>
              Simpan log produksi beserta batch dan catatan tanpa keluar aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductionLogForm recipes={recipeOptions} products={productOptions} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Produksi Harian
            </CardTitle>
            <CardDescription>
              Catatan batch produksi terbaru beserta jumlah yang dihasilkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productionLogs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Belum ada log produksi. Gunakan formulir di sebelah kiri untuk mencatat produksi pertama.
              </div>
            ) : (
              <div className="space-y-3">
                {productionLogs.map((log) => (
                  <Card key={log.id} className="border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-base">
                            {log.product?.name || 'Produk'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Resep: {log.recipe?.name || 'Tidak diketahui'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {log.quantity_produced} unit
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </span>
                        {log.batch_number && <span>Batch: {log.batch_number}</span>}
                        {log.user?.full_name && <span>Oleh: {log.user.full_name}</span>}
                      </div>

                      {log.notes && (
                        <p className="text-sm text-muted-foreground">
                          Catatan: {log.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProductionPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <ProductionContent />
      </Suspense>
    </div>
  )
}
