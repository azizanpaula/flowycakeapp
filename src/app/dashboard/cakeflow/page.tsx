import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCakeFlowDashboardStats, getOrders, getProductionLogs } from "@/lib/cakeflow-database"
import { getCurrentUser } from "@/lib/user"
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  DollarSign,
  ChefHat,
  BarChart3
} from "lucide-react"
import Link from "next/link"

async function CakeFlowDashboardContent() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Silakan masuk untuk melihat dasbor Anda.</p>
      </div>
    )
  }

  const [stats, recentOrders, recentProduction] = await Promise.all([
    getCakeFlowDashboardStats(),
    getOrders(5), // Últimas 5 vendas
    getProductionLogs(5) // Últimas 5 produções
  ])

  const orderStatusLabels: Record<string, string> = {
    completed: 'Selesai',
    pending: 'Menunggu',
    processing: 'Diproses',
    cancelled: 'Dibatalkan'
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dasbor CakeFlow
          </h1>
          <p className="text-muted-foreground">
            Kelola usaha kue Anda: penjualan, produksi, dan inventaris
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/cakeflow/pos">
            <Button>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Penjualan Baru
            </Button>
          </Link>
          <Link href="/dashboard/cakeflow/production">
            <Button variant="outline">
              <ChefHat className="w-4 h-4 mr-2" />
              Produksi
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              pesanan tercatat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {stats.todayRevenue.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              pendapatan hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produksi Hari Ini</CardTitle>
            <ChefHat className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.todayProduction}</div>
            <p className="text-xs text-muted-foreground">
              unit diproduksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peringatan Stok</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.lowStockProducts + stats.lowStockIngredients}
            </div>
            <p className="text-xs text-muted-foreground">
              item stok rendah
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/cakeflow/products">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">produk terdaftar</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cakeflow/ingredients">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Bahan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIngredients}</div>
              <p className="text-xs text-muted-foreground">item di stok</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cakeflow/orders">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Laporan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Lihat</div>
              <p className="text-xs text-muted-foreground">penjualan dan laba</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/cakeflow/recipes">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ChefHat className="w-4 h-4" />
                Resep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Kelola</div>
              <p className="text-xs text-muted-foreground">resep produksi</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Penjualan Terbaru
              </CardTitle>
              <CardDescription>
                Transaksi terbaru
              </CardDescription>
            </div>
            <Link href="/dashboard/cakeflow/orders">
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        {order.customer_name || 'Pelanggan tidak tercantum'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </div>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {orderStatusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Belum ada penjualan terbaru
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Production */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Produksi Terbaru
              </CardTitle>
              <CardDescription>
                Aktivitas produksi terbaru
              </CardDescription>
            </div>
            <Link href="/dashboard/cakeflow/production">
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentProduction.length > 0 ? (
              <div className="space-y-3">
                {recentProduction.map((production) => (
                  <div key={production.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">
                        {production.product?.name || 'Produk'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(production.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {production.quantity_produced} unit
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {production.user?.full_name || 'Pengguna'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Belum ada produksi terbaru
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CakeFlowDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <CakeFlowDashboardContent />
      </Suspense>
    </div>
  )
}
