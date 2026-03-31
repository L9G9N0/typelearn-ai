"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (!topic && !notes) {
      alert("Please enter a topic or paste some notes to begin.");
      return;
    }

    // Save the user's input to the browser's local storage
    if (notes) {
      localStorage.setItem("typelearn-mode", "notes");
      localStorage.setItem("typelearn-content", notes);
    } else {
      localStorage.setItem("typelearn-mode", "topic");
      localStorage.setItem("typelearn-content", topic);
    }

    // Redirect to the typing lesson page
    router.push("/learn");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">TypeLearn AI</h1>
          <p className="text-neutral-400">Convert your study material into interactive typing exercises.</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-2xl">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Option 1: Enter a Subject/Topic</label>
            <input
              type="text"
              placeholder="e.g., deadlock in os, binary search"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setNotes(""); // Clear notes if they decide to type a topic instead
              }}
            />
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-500 text-sm font-medium uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Option 2: Paste Your Notes</label>
            <textarea
              rows={5}
              placeholder="Paste your paragraphs, textbook text, or study notes here..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setTopic(""); // Clear topic if they decide to paste notes instead
              }}
            />
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-white text-black font-bold rounded-lg p-3 hover:bg-neutral-200 active:scale-[0.98] transition-all"
          >
            Start Learning Session
          </button>

        </div>
      </div>
    </main>
  );
}