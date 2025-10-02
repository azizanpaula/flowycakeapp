import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProducts } from "@/lib/cakeflow-database"
import { Package, AlertTriangle, CircleDollarSign, PlusCircle } from "lucide-react"
import Image from "next/image"
import { ProductForm } from "@/components/cakeflow/product-form"

async function ProductsContent() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Tambah Produk Baru
            </CardTitle>
            <CardDescription>
              Simpan produk baru beserta stok awal langsung dari aplikasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Daftar Produk CakeFlow
            </CardTitle>
            <CardDescription>
              Pantau status stok dan harga produk yang dijual di POS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Belum ada produk terdaftar. Gunakan formulir di sebelah kiri untuk menambahkan produk pertama.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => {
                  const stock = Number(product.current_stock ?? 0)
                  const threshold = Number(product.low_stock_threshold ?? 0)
                  const isLowStock = threshold > 0 && stock <= threshold

                  return (
                    <Card key={product.id} className="border">
                      <CardContent className="p-4 space-y-3">
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={320}
                              height={180}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-4xl">🍰</span>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <CircleDollarSign className="w-3 h-3" />
                            Rp {Number(product.price).toLocaleString("id-ID")}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Stok:</span>
                            <span>{stock}</span>
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {threshold > 0
                              ? `Batas rendah: ${threshold}`
                              : 'Batas rendah belum ditentukan'}
                          </span>
                        </div>

                        {isLowStock && (
                          <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-100/60 dark:bg-amber-900/20 rounded-md px-2 py-1">
                            <AlertTriangle className="w-4 h-4" />
                            Stok mendekati batas minimum. Pertimbangkan untuk restock.
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

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <ProductsContent />
      </Suspense>
    </div>
  )
}
