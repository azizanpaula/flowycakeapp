import { revalidatePath } from "next/cache"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getProfile, createOrUpdateProfile, ProfileRole } from "@/lib/database"
import { getCurrentUser } from "@/lib/user"
import { User as UserIcon, Shield, Info } from "lucide-react"
import type { ReactNode } from "react"

const ROLE_LABELS: Record<ProfileRole, string> = {
  admin: "Admin (akses penuh)",
  kasir: "Kasir (penjualan)",
  staf_dapur: "Staf Dapur (produksi)",
}

const ROLE_DESCRIPTIONS: Record<ProfileRole, string> = {
  admin: "Dapat mengelola semua modul termasuk inventaris, POS, dan produksi.",
  kasir: "Fokus pada pencatatan penjualan dan melihat riwayat transaksi.",
  staf_dapur: "Mencatat produksi dan memantau kebutuhan resep.",
}

const ALLOWED_ROLES: ProfileRole[] = ["admin", "kasir", "staf_dapur"]

async function updateProfile(formData: FormData) {
  "use server"

  const user = await getCurrentUser()
  if (!user) {
    return
  }

  const fullNameRaw = formData.get("full_name")?.toString() ?? ""
  const full_name = fullNameRaw.trim() === "" ? undefined : fullNameRaw.trim()

  const requestedRole = formData.get("role")?.toString() ?? undefined
  const canManageRole = user.role === "admin"
  const currentProfile = await getProfile()

  const role = canManageRole && requestedRole && ALLOWED_ROLES.includes(requestedRole as ProfileRole)
    ? (requestedRole as ProfileRole)
    : currentProfile?.role

  await createOrUpdateProfile({
    full_name,
    role,
  })

  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard")
}

function InfoRow({ label, value, icon }: { label: string; value: string | ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border p-3">
      <div className="flex items-start gap-2">
        {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
        <div>
          <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">{label}</p>
          <div className="text-sm font-medium text-foreground mt-1">
            {value || <span className="text-muted-foreground">Tidak tersedia</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Profil Pengguna</CardTitle>
            <CardDescription>Masuk untuk melihat dan mengelola informasi profil Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kami tidak dapat menemukan sesi aktif. Silakan masuk kembali untuk melanjutkan.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  let profile = await getProfile()
  if (!profile) {
    profile = await createOrUpdateProfile({}) ?? undefined
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Profil Pengguna</CardTitle>
            <CardDescription>Terjadi kesalahan saat menyiapkan data profil.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coba muat ulang halaman. Jika masalah berlanjut, periksa log Supabase untuk memastikan tabel
              <code className="mx-1 rounded bg-muted px-1 py-0.5">profiles</code>
              tersedia.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManageRole = user.role === "admin"
  const fallbackName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim()
  const displayName =
    profile.full_name ??
    (fallbackName.length > 0 ? fallbackName : undefined) ??
    user.email ??
    profile.id

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Profil</CardTitle>
            <CardDescription>Informasi dasar akun dan peran aplikasi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              label="Nama Lengkap"
              value={displayName}
              icon={<UserIcon className="w-4 h-4" />}
            />
            <InfoRow
              label="Email"
              value={user.email ?? "Tidak tersedia"}
              icon={<Info className="w-4 h-4" />}
            />
            <InfoRow
              label="ID Pengguna"
              value={<span className="font-mono text-xs break-all">{profile.id}</span>}
            />
            <div className="rounded-md border p-3 bg-muted/40">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase font-medium text-muted-foreground tracking-wide">Peran Saat Ini</p>
                  <p className="text-sm font-semibold mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="w-3 h-3" />
                      {ROLE_LABELS[profile.role]}
                    </Badge>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {ROLE_DESCRIPTIONS[profile.role]}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perbarui Profil</CardTitle>
            <CardDescription>
              Sesuaikan nama tampilan dan, jika Anda Admin, kelola peran aplikasi untuk pengguna ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={profile.full_name ?? ""}
                  placeholder="Masukkan nama lengkap"
                />
                <p className="text-xs text-muted-foreground">
                  Nama ini digunakan di seluruh aplikasi saat menampilkan aktivitas Anda.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="role">Peran Aplikasi</Label>
                {canManageRole ? (
                  <select
                    id="role"
                    name="role"
                    defaultValue={profile.role}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {ALLOWED_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <Input value={ROLE_LABELS[profile.role]} readOnly disabled />
                    <input type="hidden" name="role" value={profile.role} />
                    <p className="text-xs text-muted-foreground">
                      Hubungi Admin untuk mengubah peran Anda.
                    </p>
                  </>
                )}
              </div>

              <ProfileSubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProfileSubmitButton() {
  return (
    <button
      type="submit"
      className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      Simpan Perubahan
    </button>
  )
}
