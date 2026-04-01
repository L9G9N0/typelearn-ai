"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [tutorTopic, setTutorTopic] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    // FIX: Added tutorTopic to the empty check
    if (!topic && !notes && !file && !tutorTopic) {
      alert("Please enter a topic, paste notes, or upload a PDF to begin.");
      return;
    }

    // SCENARIO 0: Interactive Tutor Mode
    if (tutorTopic) {
      localStorage.setItem("typelearn-tutor-topic", tutorTopic);
      router.push("/tutor");
      return;
    }
    
    // SCENARIO 1: Smart PDF Upload
    if (file) {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/pdf", {
          method: "POST",
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.text) {
          localStorage.setItem("typelearn-mode", "notes");
          localStorage.setItem("typelearn-content", data.text);
          router.push("/learn");
        } else {
          alert("Could not process PDF.");
          setIsProcessing(false);
        }
      } catch (err) {
        console.error(err);
        alert("Server error while reading PDF.");
        setIsProcessing(false);
      }
      return; 
    }

    // SCENARIO 2: Pasted Notes
    if (notes) {
      localStorage.setItem("typelearn-mode", "notes");
      localStorage.setItem("typelearn-content", notes);
      router.push("/learn");
      return;
    } 
    
    // SCENARIO 3: AI Topic Generation
    if (topic) {
      localStorage.setItem("typelearn-mode", "topic");
      localStorage.setItem("typelearn-content", topic);
      router.push("/learn");
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">TypeLearn AI</h1>
          <p className="text-neutral-400">Convert your study material into interactive typing exercises.</p>
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
          
          {/* Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-400 font-mono font-medium animate-pulse">AI is reading your PDF...</p>
            </div>
          )}

          {/* NEW FEATURE: AI MENTOR (Moved INSIDE the card) */}
          <div className="space-y-2 bg-blue-950/20 p-4 rounded-lg border border-blue-900/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-blue-400">
                ✨ Guided AI Mentor (Step-by-Step)
              </label>
              <span className="text-[10px] uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">New</span>
            </div>
            <input
              type="text"
              placeholder="e.g., Two Sum problem, Graph Theory..."
              className="w-full bg-neutral-950 border border-blue-900/50 focus:border-blue-500 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-neutral-600"
              value={tutorTopic}
              onChange={(e) => {
                setTutorTopic(e.target.value);
                setTopic(""); 
                setNotes("");
                setFile(null);
              }}
            />
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs font-medium uppercase tracking-widest">OR CLASSIC TYPING</span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Learn any Topic (Typing)</label>
            <input
              type="text"
              placeholder="e.g., deadlock in os, binary search"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-neutral-600"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setTutorTopic("");
                setNotes("");
                setFile(null);
              }}
            />
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs font-medium uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Upload a PDF Document</label>
            <input
              type="file"
              accept=".pdf"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 transition-all cursor-pointer"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
                setTopic("");
                setTutorTopic("");
                setNotes("");
              }}
            />
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs font-medium uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Paste Raw Notes</label>
            <textarea
              rows={3}
              placeholder="Paste text directly..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all placeholder:text-neutral-600"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setTopic("");
                setTutorTopic("");
                setFile(null);
              }}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={isProcessing}
            className="w-full bg-white text-black font-bold rounded-lg p-3 hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
          >
            Start Learning Session
          </button>

        </div>
      </div>
    </main>
  );
}