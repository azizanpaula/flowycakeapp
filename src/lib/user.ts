import { currentUser } from "@clerk/nextjs/server";

type AppUserRole = "admin" | "kasir" | "staf_dapur";

export async function getCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

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
