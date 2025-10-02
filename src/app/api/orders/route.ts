import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createOrder, getOrders } from "@/lib/cakeflow-database";
import { getCurrentUser as getDemoUser } from "@/lib/user";

let clerkWarningLogged = false;

type ResolvedUser = {
  id: string;
};

async function resolveUser(): Promise<ResolvedUser | null> {
  const { userId } = auth();

  if (userId) {
    return { id: userId };
  }

  if (!clerkWarningLogged) {
    clerkWarningLogged = true;
    console.warn("Clerk user tidak tersedia, fallback ke pengguna demo.");
  }

  const demoUser = await getDemoUser();
  return demoUser ? { id: demoUser.id } : null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    const orderData = await request.json();

    const order = await createOrder(orderData, user.id);

    if (!order) {
      return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Kesalahan saat membuat pesanan:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const safeLimit = typeof limit === "number" && !Number.isNaN(limit) ? limit : undefined;

    const orders = await getOrders(safeLimit);

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Kesalahan saat mengambil pesanan:", error);
    return NextResponse.json({ error: "Kesalahan server internal" }, { status: 500 });
  }
}
