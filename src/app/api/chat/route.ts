import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Tidak diizinkan", { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Kunci API OpenAI belum dikonfigurasi. Tambahkan OPENAI_API_KEY ke variabel lingkungan Anda.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Kesalahan API chat:", error);
    return new Response(
      JSON.stringify({
        error:
          "Gagal memproses permintaan chat. Periksa kembali konfigurasi API Anda.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
