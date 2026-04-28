import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  baseURL: "https://router.huggingface.co/v1",
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    // ... PDF extraction logic yahan rahegi ...
    
    const completion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: "Extract critical concepts from this text." },
        { role: "user", content: "Extracted text..." }
      ],
    });
    return NextResponse.json({ text: completion.choices[0]?.message?.content });
  } catch (error) {
    return NextResponse.json({ error: "PDF Processing failed" }, { status: 500 });
  }
}