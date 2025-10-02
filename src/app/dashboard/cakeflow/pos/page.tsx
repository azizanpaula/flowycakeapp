"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getProducts, Product, Order, OrderItem } from "@/lib/cakeflow-database"
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Smartphone } from "lucide-react"
import { toast } from "sonner"

interface CartItem {
  product: Product
  quantity: number
  price_per_item: number
}

type OrderWithItems = Order & {
  items?: Array<OrderItem & { product?: Product }>
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer' | 'debit' | 'credit'>('cash')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Kesalahan saat memuat produk:', error)
      toast.error('Gagal memuat produk')
    }
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        product,
        quantity: 1,
        price_per_item: product.price
      }])
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price_per_item * item.quantity), 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong')
      return
    }

    setLoading(true)
    try {
      const orderData = {
        customer_name: customerName || undefined,
        payment_method: paymentMethod,
        notes: `Pesanan via POS - ${new Date().toLocaleString('id-ID')}`,
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price_per_item: item.price_per_item
        }))
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error('Gagal membuat pesanan')
      }

      const createdOrder = (await response.json()) as OrderWithItems

      printReceipt(createdOrder, cart)

      toast.success('Pesanan berhasil dibuat!')
      setCart([])
      setCustomerName("")
      setPaymentMethod('cash')
    } catch (error) {
      console.error('Kesalahan saat membuat pesanan:', error)
      toast.error('Gagal membuat pesanan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-8 h-8" />
        <h1 className="text-3xl font-bold">Kasir (POS)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Produk Tersedia</CardTitle>
              <CardDescription>
                Klik produk untuk menambah ke keranjang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={400}
                              height={400}
                              className="w-full h-full object-cover rounded-lg"
                              unoptimized
                            />
                          ) : (
                            <div className="text-4xl">🍰</div>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                        <p className="text-lg font-bold text-green-600">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stok: {product.current_stock}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada produk ditemukan
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart and Checkout */}
        <div className="space-y-6">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle>Keranjang</CardTitle>
              <CardDescription>
                {cart.length} item di keranjang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Rp {item.price_per_item.toLocaleString('id-ID')} per item
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">
                      Rp {getTotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Keranjang kosong
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checkout */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selesaikan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer">Nama Pelanggan (opsional)</Label>
                  <Input
                    id="customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Masukkan nama pelanggan"
                  />
                </div>

                <div>
                  <Label>Metode Pembayaran</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('cash')}
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Tunai
                    </Button>
                    <Button
                      variant={paymentMethod === 'qris' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('qris')}
                      className="flex items-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      QRIS
                    </Button>
                    <Button
                      variant={paymentMethod === 'transfer' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('transfer')}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Transfer Bank
                    </Button>
                    <Button
                      variant={paymentMethod === 'debit' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentMethod('debit')}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Debet
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Memproses...' : 'Selesaikan Pesanan'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

const paymentLabels: Record<Order['payment_method'], string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
  debit: 'Kartu Debit',
  credit: 'Kartu Kredit',
}

function printReceipt(order: OrderWithItems, cartItems: CartItem[]) {
  if (typeof window === 'undefined') {
    return
  }

  const fallbackItems = (order.items && order.items.length > 0)
    ? order.items
    : cartItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price_per_item: item.price_per_item,
        total_price: item.price_per_item * item.quantity,
      }))

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price_per_item * item.quantity, 0)
  const totalAmount = order.total_amount != null ? Number(order.total_amount) : cartTotal

  const currency = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })

  const documentItems = (fallbackItems.length > 0
    ? fallbackItems.map((item) => ({
        name: item.product?.name ?? 'Produk',
        quantity: Number(item.quantity ?? 0),
        unitPrice: Number(item.price_per_item ?? 0),
        total: Number(item.total_price ?? Number(item.price_per_item ?? 0) * Number(item.quantity ?? 0)),
      }))
    : [])

  const generatedItems = documentItems.length > 0
    ? documentItems
    : fallbackItems

  if (generatedItems.length === 0 && order.total_amount == null) {
    // Nothing to print
    return
  }

  const itemsHtml = generatedItems.map((item) => {
    const lineTotal = 'total' in item
      ? item.total
      : Number((item as OrderItem).total_price ?? Number((item as OrderItem).price_per_item ?? 0) * Number((item as OrderItem).quantity ?? 0))
    const unitPrice = 'unitPrice' in item
      ? item.unitPrice
      : Number((item as OrderItem).price_per_item ?? 0)
    const quantity = 'quantity' in item ? item.quantity : Number((item as OrderItem).quantity ?? 0)
    const name = 'name' in item ? item.name : (item as OrderItem & { product?: Product }).product?.name ?? 'Produk'

    return `
      <tr>
        <td>${name}</td>
        <td>${quantity}</td>
        <td>${currency.format(unitPrice)}</td>
        <td>${currency.format(lineTotal)}</td>
      </tr>
    `
  }).join('')

  const receiptWindow = window.open('', 'PRINT', 'width=600,height=800')

  if (!receiptWindow) {
    return
  }

  const orderDate = order.created_at ? new Date(order.created_at) : new Date()
  const paymentText = paymentLabels[order.payment_method] ?? order.payment_method
  const orderNumber = `CF-${String(order.id).padStart(6, '0')}`

  receiptWindow.document.write(`
    <html>
      <head>
        <title>Struk Pembayaran - CakeFlow</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 0; padding: 16px; background: #f5f5f5; }
          .receipt { max-width: 360px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; }
          h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
          .meta { text-align: center; font-size: 12px; color: #666; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { font-size: 12px; padding: 4px 0; text-align: left; }
          th { border-bottom: 1px dashed #ccc; }
          td:last-child, th:last-child { text-align: right; }
          .totals { border-top: 1px dashed #ccc; padding-top: 8px; font-size: 12px; }
          .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .footer { text-align: center; font-size: 11px; margin-top: 16px; color: #666; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h1>CakeFlow Bakery</h1>
          <div class="meta">
            ${orderDate.toLocaleString('id-ID')}<br />
            No. Pesanan: ${orderNumber}<br />
            ${order.customer_name ? `Pelanggan: ${order.customer_name}` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="totals">
            <div>
              <span>Pembayaran</span>
              <span>${paymentText}</span>
            </div>
            <div>
              <strong>Total</strong>
              <strong>${currency.format(totalAmount)}</strong>
            </div>
          </div>
          <div class="footer">
            Terima kasih telah berbelanja!<br />
            www.cakeflow.com
          </div>
        </div>
      </body>
    </html>
  `)

  receiptWindow.document.close()
  receiptWindow.focus()
  receiptWindow.print()
  receiptWindow.close()
}
