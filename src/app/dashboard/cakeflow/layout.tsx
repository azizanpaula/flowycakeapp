import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ChefHat,
  BarChart3,
  Menu,
  Cake
} from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
  { name: "Dasbor", href: "/dashboard/cakeflow", icon: LayoutDashboard },
  { name: "POS", href: "/dashboard/cakeflow/pos", icon: ShoppingCart },
  { name: "Produk", href: "/dashboard/cakeflow/products", icon: Package },
  { name: "Bahan", href: "/dashboard/cakeflow/ingredients", icon: Package },
  { name: "Produksi", href: "/dashboard/cakeflow/production", icon: ChefHat },
  { name: "Pesanan", href: "/dashboard/cakeflow/orders", icon: BarChart3 },
  { name: "Resep", href: "/dashboard/cakeflow/recipes", icon: ChefHat },
  { name: "Laporan", href: "/dashboard/cakeflow/reports", icon: BarChart3 },
]

function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Cake className="w-6 h-6" />
          CakeFlow
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}

export default function CakeFlowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r bg-card">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Cake className="w-5 h-5" />
          CakeFlow
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
