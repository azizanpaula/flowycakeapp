import { currentUser } from "@clerk/nextjs/server"

export type AppUserRole = "admin" | "kasir" | "staf_dapur"

export type AppUser = {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  role: AppUserRole
}

type ClerkUser = {
  id: string
  emailAddresses: Array<{ emailAddress: string }>
  firstName?: string | null
  lastName?: string | null
  publicMetadata?: Record<string, unknown>
}

function mapClerkUser(clerkUser: ClerkUser): AppUser {
  const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? undefined
  const inferredRole = (clerkUser.publicMetadata?.role as AppUserRole | undefined) ?? "kasir"

  return {
    id: clerkUser.id,
    email: primaryEmail,
    firstName: clerkUser.firstName ?? undefined,
    lastName: clerkUser.lastName ?? undefined,
    role: inferredRole,
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    return null
  }

  return mapClerkUser(clerkUser)
}