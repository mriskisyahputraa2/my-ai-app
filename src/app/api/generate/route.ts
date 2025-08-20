import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Definisikan tipe untuk pesan, harus sama dengan di frontend
interface Message {
  role: "user" | "model";
  content: string;
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(request: Request) {
  try {
    // Terima seluruh riwayat percakapan dari body
    const { conversation } = await request.json();

    if (!conversation || conversation.length === 0) {
      return NextResponse.json(
        { error: "Conversation history is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Kirim riwayat percakapan ke model AI
    const result = await model.generateContent({
      contents: conversation.map((m) => ({
        role: m.role === "user" ? "user" : "model", // Sesuaikan peran
        parts: [{ text: m.content }],
      })),
    });

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
