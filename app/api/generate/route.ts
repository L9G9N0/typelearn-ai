import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the Gemini SDK with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // We use the fast flash model for quick typing generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // The Prompt Engineering: We force the AI to write in typing-friendly chunks
    const prompt = `You are an expert computer science tutor. 
    Explain the topic "${topic}" in exactly 4 to 5 short, simple sentences. 
    Make it factual and easy to understand. 
    Do NOT use bullet points, bold text, markdown, or special formatting. Just output plain, clean text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}