import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.HUGGINGFACE_API_KEY, 
baseURL: "https://router.huggingface.co/v1", // Hugging Face ka OpenAI-compatible URL
});

export async function POST(req: Request) {
  let topic = "";

  try {
    const body = await req.json();
    topic = body.topic?.trim();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const completion = await client.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        {
          role: "system",
          content:
            "You are an expert computer science tutor. Write short, clear, factual typing lessons.",
        },
        {
          role: "user",
          content: `Explain the topic "${topic}" in exactly 4 to 5 short, simple sentences. Do NOT use bullet points, markdown, or special formatting. Output only plain clean text.`,
        },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("Empty AI response");
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI Generation Error:", error);

    const fallbackText = `${topic} is an important concept worth understanding clearly. It is used in real systems and helps build stronger technical thinking. Learning it step by step makes it easier to remember and apply. Practice and repetition improve both speed and understanding. This typing lesson was generated in fallback mode because the AI service is temporarily unavailable.`;

    return NextResponse.json({ text: fallbackText });
  }
}