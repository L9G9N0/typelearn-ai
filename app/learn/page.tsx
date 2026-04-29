"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { chunkText } from "../../lib/chunkText";
import { calculateAccuracy, calculateWPM } from "../../lib/calculateStats";
import { recordSession } from "../../lib/userStats";

export default function LearnPage() {
  const router = useRouter();
  
  // 1. ALL STATE HOOKS AT THE TOP
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isHardcore, setIsHardcore] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [lessonStats, setLessonStats] = useState<{wpm: number, acc: number}[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 2. FIRST USE EFFECT: Fetching Content
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

  // 3. SECOND USE EFFECT: Recording Stats safely at the top!
  useEffect(() => {
    if (isFinished && lessonStats.length > 0) {
      const avgWpm = Math.round(lessonStats.reduce((sum, stat) => sum + stat.wpm, 0) / lessonStats.length) || 0;
      const avgAcc = Math.round(lessonStats.reduce((sum, stat) => sum + stat.acc, 0) / lessonStats.length) || 0;
      recordSession(avgWpm, avgAcc);
    }
  }, [isFinished, lessonStats]);

  // 4. HELPER FUNCTIONS
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const currentChunk = chunks[currentIndex];

    if (!startTime && value.length > 0) setStartTime(Date.now());
    if (value.length > currentChunk.length) return;

    setTypedText(value);

    if (startTime) setWpm(calculateWPM(value, startTime, Date.now()));
    setAccuracy(calculateAccuracy(currentChunk, value));
  };

  const handleNext = () => {
    setLessonStats((prev) => [...prev, { wpm, acc: accuracy }]);

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

  // 5. EARLY RETURNS (Must happen AFTER all hooks)
  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 font-mono animate-pulse">AI is writing your lesson...</p>
      </main>
    );
  }

  if (isFinished) {
    const avgWpm = Math.round(lessonStats.reduce((sum, stat) => sum + stat.wpm, 0) / lessonStats.length) || 0;
    const avgAcc = Math.round(lessonStats.reduce((sum, stat) => sum + stat.acc, 0) / lessonStats.length) || 0;

    return (
      <main className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 w-full max-w-md text-center space-y-8 shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Lesson Complete</h2>
            <p className="text-neutral-400">Here is how you performed.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-lg">
              <span className="block text-4xl font-mono font-bold text-blue-400">{avgWpm}</span>
              <span className="text-sm text-neutral-500 uppercase tracking-wider mt-1 block">Avg WPM</span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-lg">
              <span className="block text-4xl font-mono font-bold text-green-400">{avgAcc}%</span>
              <span className="text-sm text-neutral-500 uppercase tracking-wider mt-1 block">Avg ACC</span>
            </div>
          </div>

          <button 
            onClick={() => router.push("/")}
            className="w-full bg-white text-black font-bold rounded-lg p-4 hover:bg-neutral-200 active:scale-[0.98] transition-all"
          >
            Learn a New Topic
          </button>
        </div>
      </main>
    );
  }

  // 6. MAIN RENDER
  const currentChunk = chunks[currentIndex];
  const isChunkComplete = typedText === currentChunk;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center pt-24 p-6 font-sans">
      <div className="max-w-3xl w-full space-y-8">
        
        <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-neutral-400">Chunk {currentIndex + 1} of {chunks.length}</div>
          
          {/* Hardcore Toggle */}
          <div className="flex items-center space-x-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => setIsHardcore(!isHardcore)}>
            <div className={`w-3 h-3 rounded-full ${isHardcore ? 'bg-red-500 animate-pulse' : 'bg-neutral-700'}`}></div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isHardcore ? 'text-red-500' : 'text-neutral-500'}`}>Hardcore</span>
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

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl text-xl leading-relaxed font-medium">
          {currentChunk.split("").map((char, index) => {
            let colorClass = "text-neutral-500"; 
            if (index < typedText.length) {
              if (isHardcore && !isChunkComplete && typedText.length !== currentChunk.length) {
                colorClass = "text-neutral-300"; 
              } else {
                colorClass = typedText[index] === char ? "text-green-400" : "text-red-500 bg-red-500/10"; 
              }
            }
            return <span key={index} className={colorClass}>{char}</span>;
          })}
        </div>

        <div className="space-y-4">
          <textarea
            ref={inputRef}
            autoFocus
            rows={3}
            value={typedText}
            onChange={handleTyping}
            disabled={isChunkComplete}
            placeholder="Start typing the text above..."
            className={`w-full bg-neutral-950 border-2 border-neutral-800 rounded-xl p-4 text-lg focus:outline-none focus:border-blue-500/50 resize-none font-mono transition-all disabled:opacity-50 ${isHardcore && !isChunkComplete ? 'text-transparent caret-white selection:bg-transparent' : 'text-white'}`}
            spellCheck={false}
          />
          {isChunkComplete && (
            <button
              onClick={handleNext}
              className="w-full bg-blue-600 text-white font-bold rounded-lg p-4 hover:bg-blue-500 active:scale-[0.98] transition-all"
            >
              {currentIndex < chunks.length - 1 ? "Next Chunk →" : "View Results"}
            </button>
          )}
        </div>

      </div>
    </main>
  );
}