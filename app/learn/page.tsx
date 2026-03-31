"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { chunkText } from "../../lib/chunkText";
import { calculateAccuracy, calculateWPM } from "../../lib/calculateStats";

// Hardcoded topics for MVP Version 0.1
const HARDCODED_TOPICS: Record<string, string> = {
  "transaction in dbms": "A transaction is a sequence of database operations treated as one logical unit. ACID properties are Atomicity, Consistency, Isolation, and Durability. COMMIT saves changes permanently. ROLLBACK undoes changes.",
  "deadlock in os": "A deadlock is a situation where a set of processes are blocked because each process is holding a resource and waiting for another resource acquired by some other process. The four necessary conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.",
  "binary search": "Binary search is an efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, until you've narrowed down the possible locations to just one."
};

export default function LearnPage() {
  const router = useRouter();
  
  // Data State
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Typing State
  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Stats State
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 1. Load data on mount
  useEffect(() => {
    const mode = localStorage.getItem("typelearn-mode");
    const content = localStorage.getItem("typelearn-content");

    if (!mode || !content) {
      router.push("/");
      return;
    }

    let rawText = "";
    if (mode === "notes") {
      rawText = content;
    } else if (mode === "topic") {
      // Normalize to lowercase to match our hardcoded keys
      const normalizedTopic = content.toLowerCase().trim();
      rawText = HARDCODED_TOPICS[normalizedTopic] || `We don't have hardcoded data for "${content}" yet. Please try "transaction in dbms", "deadlock in os", or "binary search" for the MVP.`;
    }

    const processedChunks = chunkText(rawText);
    setChunks(processedChunks);
  }, [router]);

  // 2. Handle Typing Input
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const currentChunk = chunks[currentIndex];

    // Start timer on first keystroke
    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }

    // Prevent typing beyond the chunk length
    if (value.length > currentChunk.length) return;

    setTypedText(value);

    // Calculate live stats
    if (startTime) {
      setWpm(calculateWPM(value, startTime, Date.now()));
    }
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

  if (chunks.length === 0) return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Loading...</div>;

  if (isFinished) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center space-y-4 shadow-2xl">
          <h2 className="text-3xl font-bold text-green-400">Lesson Complete!</h2>
          <p className="text-neutral-400">Great job typing through the material.</p>
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
        
        {/* Top Bar: Stats & Progress */}
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-neutral-400">
            Chunk {currentIndex + 1} of {chunks.length}
          </div>
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

        {/* The Text to Type */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl text-xl leading-relaxed font-medium">
          {currentChunk.split("").map((char, index) => {
            let colorClass = "text-neutral-500"; // Untyped
            if (index < typedText.length) {
              colorClass = typedText[index] === char ? "text-green-400" : "text-red-500 bg-red-500/10"; // Correct vs Incorrect
            }
            return (
              <span key={index} className={colorClass}>
                {char}
              </span>
            );
          })}
        </div>

        {/* The Input Field */}
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
              className="w-full bg-blue-600 text-white font-bold rounded-lg p-4 hover:bg-blue-500 active:scale-[0.98] transition-all animate-fade-in"
            >
              {currentIndex < chunks.length - 1 ? "Next Chunk →" : "Finish Lesson"}
            </button>
          )}
        </div>

      </div>
    </main>
  );
}