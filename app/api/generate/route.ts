import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  baseURL: "https://router.huggingface.co/v1",
});

export async function POST(req: Request) {
  let topic = "";
  try {
    const body = await req.json();
    topic = body.topic?.trim();
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 });

    const completion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: "You are an expert tutor. Write short, clear, factual typing lessons." },
        { role: "user", content: `Explain "${topic}" in 4-5 simple sentences. No markdown, no formatting.` },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    return NextResponse.json({ text: text || "Fallback text here." });
  } catch (error) {
    return NextResponse.json({ text: "Service temporarily unavailable." });
  }
}