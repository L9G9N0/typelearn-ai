import { NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY || "missing-key";
const client = new OpenAI({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  baseURL: "https://router.huggingface.co/v1",
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // --- THE FIX: Use the server-safe PDF extractor ---
    const pdfExtract = require("pdf-extraction");
    
    const pdfData = await pdfExtract(buffer);
    const rawText = pdfData.text?.trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Could not extract any text from this PDF. It might be an image-only PDF." },
        { status: 400 }
      );
    }

    // --- DEEP AI INTEGRATION ---
    const safeText = rawText.slice(0, 5000);

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert tutor. The user is providing raw, messy text extracted from a PDF textbook or slides. Your job is to extract the 5 to 6 most critical concepts from this text and rewrite them as a sequence of short, clear, factual sentences. Do NOT use bullet points, markdown, or special formatting. Output ONLY the plain text sentences.",
        },
        {
          role: "user",
          content: safeText,
        },
      ],
      temperature: 0.5,
    });

    const lessonText = completion.choices[0]?.message?.content?.trim();

    if (!lessonText) {
      throw new Error("Empty AI response");
    }

    return NextResponse.json({ text: lessonText });

  } catch (error: any) {
    console.error("PDF/AI Error:", error.message || error);
    return NextResponse.json({ error: "Server error processing PDF" }, { status: 500 });
  }
}