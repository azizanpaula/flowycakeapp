import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCakeFlowDashboardStats, getCakeFlowFinancialReport } from "@/lib/cakeflow-database"
import {
  BarChart3,
  ShoppingCart,
  Package,
  Sprout,
  ChefHat,
  AlertTriangle,
  CircleDollarSign,
  Wallet,
  Calculator,
  TrendingUp
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function ReportsContent() {
  const [stats, financial] = await Promise.all([
    getCakeFlowDashboardStats(),
    getCakeFlowFinancialReport(),
  ])

  const currency = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })

  const percentage = (value: number) => `${(value * 100).toFixed(2)}%`

  const financialCards = [
    {
      title: 'Pendapatan Bulan Ini',
      value: currency.format(financial.total_revenue),
      description: 'Total pemasukan dari penjualan',
      icon: Wallet,
    },
    {
      title: 'HPP (COGS)',
      value: currency.format(financial.total_cogs),
      description: 'Biaya pokok penjualan periode ini',
      icon: Calculator,
    },
    {
      title: 'Laba Kotor',
      value: currency.format(financial.gross_profit),
      description: 'Pendapatan dikurangi HPP',
      icon: TrendingUp,
    },
    {
      title: 'Margin Kotor',
      value: percentage(financial.gross_margin),
      description: 'Persentase laba kotor terhadap pendapatan',
      icon: BarChart3,
    },
  ]

  const reportCards = [
    {
      title: 'Total Produk',
      value: stats.totalProducts,
      description: 'Jumlah varian kue siap jual',
      icon: Package,
    },
    {
      title: 'Total Bahan',
      value: stats.totalIngredients,
      description: 'Bahan baku yang tersedia',
      icon: Sprout,
    },
    {
      title: 'Stok Produk Rendah',
      value: stats.lowStockProducts,
      description: 'Produk perlu restock',
      icon: AlertTriangle,
    },
    {
      title: 'Stok Bahan Rendah',
      value: stats.lowStockIngredients,
      description: 'Bahan baku perlu restock',
      icon: AlertTriangle,
    },
    {
      title: 'Penjualan Hari Ini',
      value: stats.todayOrders,
      description: 'Transaksi POS tercatat hari ini',
      icon: ShoppingCart,
    },
    {
      title: 'Pendapatan Hari Ini',
      value: `Rp ${stats.todayRevenue.toLocaleString('id-ID')}`,
      description: 'Total pemasukan dari POS',
      icon: CircleDollarSign,
    },
    {
      title: 'Produksi Hari Ini',
      value: stats.todayProduction,
      description: 'Unit produk selesai diproduksi',
      icon: ChefHat,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Laporan Ringkasan Bisnis
          </CardTitle>
          <CardDescription>
            Pantau performa penjualan, produksi, dan stok usaha kue Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reportCards.map(({ title, value, description, icon: Icon }) => (
              <Card key={title} className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-base">{title}</h3>
                  </div>
                  <div className="text-2xl font-bold">
                    {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                  </div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Ringkasan Keuangan Bulanan
          </CardTitle>
          <CardDescription>
            Periode {new Date(financial.period_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}–{' '}
            {new Date(new Date(financial.period_end).getTime() - 1).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pb-6">
            {financialCards.map(({ title, value, description, icon: Icon }) => (
              <Card key={title} className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-base">{title}</h3>
                  </div>
                  <div className="text-2xl font-bold">{value}</div>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-base">HPP per Produk</h3>
            {financial.product_costs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada data resep atau penjualan untuk menghitung HPP.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">HPP / Unit</TableHead>
                      <TableHead className="text-right">Harga Jual</TableHead>
                      <TableHead className="text-right">Laba / Unit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Terjual (estimasi)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financial.product_costs.map((cost) => (
                      <TableRow key={cost.product_id}>
                        <TableCell>
                          <div className="font-medium">{cost.product_name}</div>
                        </TableCell>
                        <TableCell className="text-right">{currency.format(cost.hpp_per_unit)}</TableCell>
                        <TableCell className="text-right">
                          {cost.selling_price != null ? currency.format(cost.selling_price) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {cost.gross_profit_per_unit != null
                            ? currency.format(cost.gross_profit_per_unit)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {cost.gross_margin_percentage != null
                            ? `${cost.gross_margin_percentage.toFixed(2)}%`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {cost.total_quantity_sold != null && cost.total_quantity_sold > 0
                            ? `${cost.total_quantity_sold} pcs`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <ReportsContent />
      </Suspense>
    </div>
  )
}
