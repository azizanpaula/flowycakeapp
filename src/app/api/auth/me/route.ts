import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(null, { status: 401 });
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return NextResponse.json(null, { status: 401 });
  }

  const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? undefined;
  const role = (clerkUser.publicMetadata?.role as string | undefined) ?? "kasir";

  return NextResponse.json({
    id: clerkUser.id,
    email: primaryEmail,
    firstName: clerkUser.firstName ?? undefined,
    lastName: clerkUser.lastName ?? undefined,
    role,
  });
}
