"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// Added Step 6 for the Final Q&A
const steps = [
  "Core Concept & I/O",
  "Your Intuition & Logic",
  "Data Structures & Edge Cases",
  "Pseudocode Checkpoint",
  "Final Implementation Review",
  "Final Q&A Challenge"
];

export default function TutorPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  const [history, setHistory] = useState<{role: string, content: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTopic = localStorage.getItem("typelearn-tutor-topic");
    if (!savedTopic) {
      router.push("/");
      return;
    }
    setTopic(savedTopic);
    triggerAiResponse([], savedTopic, 1);
  }, [router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiFeedback]);

  const triggerAiResponse = async (currentHistory: any[], currentTopic: string, stepNumber: number) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: currentHistory, step: stepNumber, topic: currentTopic }),
      });
      
      const data = await response.json();
      if (data.reply) {
        setAiFeedback(data.reply);
        setHistory([...currentHistory, { role: "assistant", content: data.reply }]);
      }
    } catch (error) {
      console.error(error);
      setAiFeedback("Something went wrong connecting to the AI Mentor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSubmit = (overrideText?: string) => {
    const textToSubmit = overrideText || userInput;
    if (!textToSubmit.trim()) return;
    
    const newHistory = [...history, { role: "user", content: textToSubmit }];
    setHistory(newHistory);
    setUserInput(""); 
    
    triggerAiResponse(newHistory, topic, currentStep + 1);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      setAiFeedback(""); 
      triggerAiResponse(history, topic, nextStepNum + 1);
    }
  };

  // Reuses your existing /api/pdf route to extract text!
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPdfLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/pdf", { method: "POST", body: formData });
      const data = await response.json();
      
      if (data.text) {
        // Drop the extracted text into the input area for the user to review/submit
        setUserInput(`[Extracted from uploaded PDF]:\n${data.text}`);
      } else {
        alert("Could not extract text from this PDF.");
      }
    } catch (err) {
      alert("Error processing PDF.");
    } finally {
      setIsPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  if (!topic) return null;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center pt-24 p-6 font-sans">
      <div className="max-w-4xl w-full space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-white">Learning: {topic}</h1>
            <p className="text-sm text-neutral-400">Step {currentStep + 1} of {steps.length}: {steps[currentStep]}</p>
          </div>
          <button onClick={() => router.push("/")} className="text-sm text-neutral-500 hover:text-white transition-colors">
            Exit Session
          </button>
        </div>

        {/* AI Mentor Output Box */}
        <div 
          ref={scrollRef}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl min-h-[250px] max-h-[400px] overflow-y-auto"
        >
          {isLoading && !aiFeedback ? (
            <div className="flex items-center space-x-3 text-blue-400">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Mentor is thinking...</span>
            </div>
          ) : (
            <div className="space-y-4 text-lg leading-relaxed whitespace-pre-wrap">
              {aiFeedback}
            </div>
          )}
        </div>

        {/* User Input Area */}
        <div className="space-y-4">
          <textarea
            rows={5}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={
              currentStep === 4 ? "Type your final implementation syntax here..." : 
              currentStep === 5 ? "Answer the Q&A challenge here..." : 
              "Type your intuition, logic, or summarize the optimal approach..."
            }
            className="w-full bg-neutral-950 border-2 border-neutral-800 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-blue-500/50 resize-none font-mono transition-all"
          />
          
          <div className="flex flex-wrap gap-4 justify-between items-center">
            
            {/* Left Side Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleUserSubmit()}
                disabled={isLoading || !userInput.trim()}
                className="bg-blue-600 text-white font-bold rounded-lg px-6 py-3 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Submit
              </button>

              {/* The "Teach Me" Mechanism */}
              {currentStep > 0 && currentStep < 4 && (
                <button
                  onClick={() => handleUserSubmit("I am stuck. Please teach me the optimal approach, including common developer pitfalls. Then, ask me to summarize the core logic back to you before we proceed.")}
                  disabled={isLoading}
                  className="bg-neutral-800 text-neutral-300 font-bold rounded-lg px-4 py-3 hover:bg-neutral-700 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                >
                  Teach Me Optimal Approach
                </button>
              )}

              {/* PDF Upload for Intuition/Notes */}
              <div className="relative flex items-center">
                <input 
                  type="file" 
                  accept=".pdf" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  disabled={isPdfLoading || isLoading}
                />
                <button disabled={isPdfLoading || isLoading} className="bg-neutral-800 text-neutral-300 font-bold rounded-lg px-4 py-3 hover:bg-neutral-700 transition-all disabled:opacity-50 text-sm">
                  {isPdfLoading ? "Extracting..." : "📄 Upload PDF Notes"}
                </button>
              </div>
            </div>
            
            {/* Right Side Actions */}
            <button
              onClick={handleNextStep}
              disabled={isLoading || currentStep === steps.length - 1}
              className="bg-white text-black font-bold rounded-lg px-8 py-3 hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Next Step →
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}