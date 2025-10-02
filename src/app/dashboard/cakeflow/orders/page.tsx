import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getOrders } from "@/lib/cakeflow-database"
import { ShoppingCart, CircleDollarSign, Clock, CreditCard } from "lucide-react"

async function OrdersContent() {
  const orders = await getOrders()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Pesanan POS
          </CardTitle>
          <CardDescription>
            Riwayat transaksi penjualan terbaru di kasir CakeFlow
          </CardDescription>
          <div className="pt-2">
            <Link href="/dashboard/cakeflow/pos">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Buat Pesanan Baru via POS
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Belum ada pesanan tercatat. Buat pesanan melalui halaman POS.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-base">
                          Pesanan #{order.id}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name || 'Pelanggan umum'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CircleDollarSign className="w-3 h-3" />
                          Rp {order.total_amount.toLocaleString('id-ID')}
                        </Badge>
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                          {order.status === 'completed'
                            ? 'Selesai'
                            : order.status === 'pending'
                              ? 'Menunggu'
                              : 'Dibatalkan'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleString('id-ID')}
                      </span>
                      <span>Metode: {order.payment_method.toUpperCase()}</span>
                      {order.notes && <span>Catatan: {order.notes}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <OrdersContent />
      </Suspense>
    </div>
  )
}
