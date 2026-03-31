"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { chunkText } from "../../lib/chunkText";
import { calculateAccuracy, calculateWPM } from "../../lib/calculateStats";

export default function LearnPage() {
  const router = useRouter();
  
  // Data State
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // New loading state for AI
  
  // Typing State
  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Stats State
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 1. Load data & Fetch AI on mount
  useEffect(() => {
    const fetchContent = async () => {
      const mode = localStorage.getItem("typelearn-mode");
      const content = localStorage.getItem("typelearn-content");

      if (!mode || !content) {
        router.push("/");
        return;
      }

      if (mode === "notes") {
        setChunks(chunkText(content));
        setIsLoading(false);
      } else if (mode === "topic") {
        try {
          // Ask our backend to generate content
          const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: content }),
          });
          
          const data = await response.json();
          
          if (data.text) {
            setChunks(chunkText(data.text));
          } else {
            alert("Failed to generate content. Please try again.");
            router.push("/");
          }
        } catch (error) {
          console.error(error);
          alert("Something went wrong with the AI.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchContent();
  }, [router]);

  // 2. Handle Typing Input
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const currentChunk = chunks[currentIndex];

    if (!startTime && value.length > 0) setStartTime(Date.now());
    if (value.length > currentChunk.length) return;

    setTypedText(value);

    if (startTime) setWpm(calculateWPM(value, startTime, Date.now()));
    setAccuracy(calculateAccuracy(currentChunk, value));
  };

  // 3. Move to next chunk
  const handleNext = () => {
    if (currentIndex < chunks.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTypedText("");
      setStartTime(null);
      setWpm(0);
      setAccuracy(100);
      inputRef.current?.focus();
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 font-mono animate-pulse">AI is writing your lesson...</p>
      </main>
    );
  }

  if (isFinished) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-4 shadow-2xl">
          <h2 className="text-3xl font-bold text-green-400">Lesson Complete!</h2>
          <button 
            onClick={() => router.push("/")}
            className="mt-4 bg-white text-black font-bold rounded-lg px-6 py-2 hover:bg-neutral-200 transition-all"
          >
            Learn a New Topic
          </button>
        </div>
      </main>
    );
  }

  const currentChunk = chunks[currentIndex];
  const isChunkComplete = typedText === currentChunk;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center pt-24 p-6 font-sans">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Top Bar: Stats */}
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-neutral-400">Chunk {currentIndex + 1} of {chunks.length}</div>
          <div className="flex space-x-6">
            <div className="text-center">
              <span className="block text-2xl font-mono font-bold text-white">{wpm}</span>
              <span className="text-xs text-neutral-500 uppercase tracking-wider">WPM</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-mono font-bold text-white">{accuracy}%</span>
              <span className="text-xs text-neutral-500 uppercase tracking-wider">ACC</span>
            </div>
          </div>
        </div>

        {/* Text to Type */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl text-xl leading-relaxed font-medium">
          {currentChunk.split("").map((char, index) => {
            let colorClass = "text-neutral-500"; 
            if (index < typedText.length) {
              colorClass = typedText[index] === char ? "text-green-400" : "text-red-500 bg-red-500/10"; 
            }
            return <span key={index} className={colorClass}>{char}</span>;
          })}
        </div>

        {/* Input Field */}
        <div className="space-y-4">
          <textarea
            ref={inputRef}
            autoFocus
            rows={3}
            value={typedText}
            onChange={handleTyping}
            disabled={isChunkComplete}
            placeholder="Start typing the text above..."
            className="w-full bg-neutral-950 border-2 border-neutral-800 rounded-xl p-4 text-white text-lg focus:outline-none focus:border-blue-500/50 resize-none font-mono transition-all disabled:opacity-50"
            spellCheck={false}
          />
          {isChunkComplete && (
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white font-bold rounded-lg p-4 hover:bg-blue-500 active:scale-[0.98] transition-all"
            >
              {currentIndex < chunks.length - 1 ? "Next Chunk →" : "Finish Lesson"}
            </button>
          )}
        </div>

      </div>
    </main>
  );
}