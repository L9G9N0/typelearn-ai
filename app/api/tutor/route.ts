import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.HUGGINGFACE_API_KEY, 
  baseURL: "https://router.huggingface.co/v1",
});

export async function POST(req: Request) {
  try {
    const { history, step, topic } = await req.json();

    if (!history || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let stepInstruction = "";
    switch (step) {
      case 1:
        stepInstruction = `The user wants to learn about "${topic}". Step 1: Explain the core concept or I/O. Keep it brief. Ask for their initial intuition.`;
        break;
      case 2:
        stepInstruction = `Step 2: Review the user's intuition. If they asked for the optimal approach, explain it with a 'Common Pitfalls' section, then ask them to summarize it back.`;
        break;
      case 3:
        stepInstruction = `Step 3: Discuss Data Structures or core mechanisms. Focus on 'Why'. Check if their proposed data structure is optimal.`;
        break;
      case 4:
        // FIX: Explicitly require REAL CODE here
        stepInstruction = `Step 4: Pseudocode & Real Code. First, provide clear pseudocode. THEN, provide the actual, real code implementation in C++ or Python. Explain the real syntax briefly so they learn how the pseudocode translates to real code.`;
        break;
      case 5:
        // FIX: User now tries to type it out themselves from memory
        stepInstruction = `Step 5: Final Review. Ask the user to type out the real implementation from memory to build muscle memory. Review their syntax. Do not run the code, just review it.`;
        break;
      case 6:
        stepInstruction = `Step 6: Final Q&A Challenge. Generate 1 multiple-choice question and 1 open-ended conceptual question based on this session.`;
        break;
      default:
        stepInstruction = "You are a helpful coding mentor.";
    }

    const messages = [
      { role: "system", content: "You are an expert, encouraging computer science tutor. You prioritize active learning." },
      ...history, 
      { role: "system", content: stepInstruction } 
    ];

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages as any,
      temperature: 0.6,
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("Empty AI response");
    }

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Tutor AI Error:", error.message || error);
    return NextResponse.json({ error: "Server error processing tutor request" }, { status: 500 });
  }
}