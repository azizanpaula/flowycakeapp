export type AppUserRole = "admin" | "kasir" | "staf_dapur";

export type AppUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: AppUserRole;
};

export async function getCurrentUser(): Promise<AppUser | null> {
  if (typeof window === "undefined") {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    return mapClerkUser(clerkUser);
  }

  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AppUser | null;
    return data;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
}

type ClerkUser = {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  publicMetadata?: Record<string, unknown>;
};

function mapClerkUser(clerkUser: ClerkUser): AppUser {
  const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? undefined;
  const inferredRole = (clerkUser.publicMetadata?.role as AppUserRole | undefined) ?? "kasir";

  return {
    id: clerkUser.id,
    email: primaryEmail,
    firstName: clerkUser.firstName ?? undefined,
    lastName: clerkUser.lastName ?? undefined,
    role: inferredRole,
  };
}
