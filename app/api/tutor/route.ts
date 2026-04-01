import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const { history, step, topic } = await req.json();

    if (!history || !topic) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine AI behavior based on the current step
    let stepInstruction = "";
    switch (step) {
      case 1:
        stepInstruction = `The user wants to learn about "${topic}". Step 1: Explain the core concept, or the Input/Output if it's an algorithm. Keep it brief and factual. Do NOT use bullet points heavily. End by asking the user to provide their initial intuition or logic.`;
        break;
      case 2:
        stepInstruction = `Step 2: Review the user's intuition. If they asked you to teach them the optimal approach, provide a comprehensive paragraph-style explanation with a 'Common Pitfalls' section (e.g., Reddit/StackOverflow mistakes), and then strictly demand that they type out a summary of the core logic before moving on. If they provided their own logic, critique it gently without giving away the final code.`;
        break;
      case 3:
        stepInstruction = `Step 3: Discuss Data Structures or core mechanisms. Focus on 'Why' a specific structure/approach is best. Keep responses under 150 words. Check if their proposed data structure fits the optimal time/space complexity.`;
        break;
      case 4:
        stepInstruction = `Step 4: Pseudocode. Provide clear, structural pseudocode. If the user uploaded PDF notes, analyze them and point out how their notes map to the proper pseudocode.`;
        break;
      case 5:
        stepInstruction = `Step 5: Final Review. The user will provide their final syntax/code. Review it for accuracy. Do not run the code, just review the syntax and logic. If correct, congratulate them and tell them to move to the Final Q&A.`;
        break;
      case 6:
        stepInstruction = `Step 6: Final Q&A Challenge. Generate 1 multiple-choice question and 1 open-ended conceptual question based on the topic and pitfalls discussed in this session. Wait for the user to answer, then grade them.`;
        break;
      default:
        stepInstruction = "You are a helpful coding mentor.";
    }

    // Build the payload for Groq
    const messages = [
      { role: "system", content: "You are an expert, encouraging computer science tutor. You prioritize active learning. You format responses in clean text. If a user asks for the optimal answer, you provide it but FORCE them to type out a summary of it to ensure they aren't just passively reading." },
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