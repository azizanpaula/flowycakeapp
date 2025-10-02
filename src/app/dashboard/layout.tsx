import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  User,
  Menu,
  Home
} from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navigation = [
  { name: "Dasbor", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tugas", href: "/dashboard/tasks", icon: CheckSquare },
  { name: "Kategori", href: "/dashboard/categories", icon: FolderOpen },
  { name: "Profil", href: "/dashboard/profile", icon: User },
]

function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Home className="w-6 h-6" />
          TaskFlow
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

      <div className="p-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
        <SignedOut>
          <SignInButton mode="modal">
            <Button className="w-full" variant="outline">Masuk</Button>
          </SignInButton>
        </SignedOut>
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

export default function DashboardLayout({
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
          <Home className="w-5 h-5" />
          TaskFlow
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">Masuk</Button>
            </SignInButton>
          </SignedOut>
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
