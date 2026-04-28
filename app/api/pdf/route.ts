import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  baseURL: "https://router.huggingface.co/v1",
});

export async function POST(req: Request) {
  try {
    const { history, step, topic } = await req.json();
    const completion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: "You are an expert CS tutor." },
        ...history,
        { role: "system", content: `Current step: ${step} for topic: ${topic}` }
      ],
      temperature: 0.6,
    });
    return NextResponse.json({ reply: completion.choices[0]?.message?.content });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}