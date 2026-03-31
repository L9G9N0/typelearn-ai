import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize Groq
const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY, 
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // YOUR FIX: Dynamic import to bypass Next.js Webpack issues with pdf-parse
    const pdfParseModule: any = await import("pdf-parse");
    const pdfParse = pdfParseModule.default ?? pdfParseModule;

    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text?.trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Could not read any text from this PDF." },
        { status: 400 }
      );
    }

    // --- DEEP AI INTEGRATION ---
    // 1. Slice the text to 5000 characters so we don't blow up Groq's token limit
    const safeText = rawText.slice(0, 5000);

    // 2. Ask Groq Llama-3 to distill the messy PDF into a typing lesson
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

    // Return the clean, AI-generated typing lesson
    return NextResponse.json({ text: lessonText });

  } catch (error) {
    console.error("PDF Parse/AI Error:", error);
    return NextResponse.json({ error: "Server error processing PDF" }, { status: 500 });
  }
}