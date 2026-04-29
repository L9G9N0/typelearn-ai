"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { recordSession } from "../../lib/userStats";

// IMPORTS FOR BEAUTIFUL CODE FORMATTING
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const steps = [
  "Core Concept & I/O",
  "Your Intuition & Logic",
  "Data Structures & Edge Cases",
  "Pseudocode & Real Code", 
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
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in your browser. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setUserInput(transcript); 
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  };

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
    
    if (isListening) toggleListening();

    const newHistory = [...history, { role: "user", content: textToSubmit }];
    setHistory(newHistory);
    setUserInput(""); 
    
    triggerAiResponse(newHistory, topic, currentStep + 1);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      if (isListening) toggleListening();
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      setAiFeedback(""); 
      triggerAiResponse(history, topic, nextStepNum + 1);
    } else {
      recordSession(0, 0); 
      router.push("/dashboard"); 
    }
  };

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
        setUserInput(`[Extracted from uploaded PDF]:\n${data.text}`);
      } else {
        alert("Could not extract text from this PDF.");
      }
    } catch (err) {
      alert("Error processing PDF.");
    } finally {
      setIsPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!topic) return null;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center pt-24 p-6 font-sans">
      <div className="max-w-4xl w-full space-y-6">
        
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-white">Learning: {topic}</h1>
            <p className="text-sm text-neutral-400">Step {currentStep + 1} of {steps.length}: {steps[currentStep]}</p>
          </div>
          <button onClick={() => router.push("/")} className="text-sm text-neutral-500 hover:text-white transition-colors">
            Exit Session
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl min-h-[250px] max-h-[500px] overflow-y-auto"
        >
          {isLoading && !aiFeedback ? (
            <div className="flex items-center space-x-3 text-blue-400">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Mentor is thinking...</span>
            </div>
          ) : (
            <div className="text-lg leading-relaxed text-neutral-300 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mb-2 [&>h3]:mt-6 [&>strong]:text-white">
              <ReactMarkdown
                components={{
                  code(props) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <div className="my-4 rounded-lg overflow-hidden border border-neutral-700">
                        {/* @ts-ignore */}
                        <SyntaxHighlighter
                          {...rest}
                          PreTag="div"
                          children={String(children).replace(/\n$/, "")}
                          language={match[1]}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: "1.5rem", fontSize: "0.95rem" }}
                        />
                      </div>
                    ) : (
                      <code {...rest} className="bg-neutral-800 text-blue-300 px-1.5 py-0.5 rounded font-mono text-sm">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {aiFeedback}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <textarea
              rows={5}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                currentStep === 4 ? "Type the final real code implementation here from memory..." : 
                currentStep === 5 ? "Answer the Q&A challenge here..." : 
                "Type your intuition, or click the microphone to speak..."
              }
              className={`w-full bg-neutral-950 border-2 rounded-xl p-4 pr-16 text-white text-lg focus:outline-none resize-none font-mono transition-all ${isListening ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-neutral-800 focus:border-blue-500/50'}`}
            />
            
            <button
              onClick={toggleListening}
              className={`absolute right-4 bottom-4 p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'}`}
              title="Voice to Text"
            >
              {isListening ? "🛑" : "🎙️"}
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => handleUserSubmit()}
                disabled={isLoading || !userInput.trim()}
                className="bg-blue-600 text-white font-bold rounded-lg px-6 py-3 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Submit
              </button>

              {currentStep > 0 && currentStep < 4 && (
                <button
                  onClick={() => handleUserSubmit("I am stuck. Please teach me the optimal approach, including common developer pitfalls. Then, ask me to summarize the core logic back to you before we proceed.")}
                  disabled={isLoading}
                  className="bg-neutral-800 text-neutral-300 font-bold rounded-lg px-4 py-3 hover:bg-neutral-700 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
                >
                  Teach Me Optimal Approach
                </button>
              )}

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
                  {isPdfLoading ? "Extracting..." : "📄 Upload PDF"}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleNextStep}
              disabled={isLoading}
              className="bg-white text-black font-bold rounded-lg px-8 py-3 hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {currentStep === steps.length - 1 ? "Finish Session" : "Next Step →"}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}