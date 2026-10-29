import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Headphones } from 'lucide-react';
import type { BlogArticle } from '../types';

interface AudioStoryPlayerProps {
  article: BlogArticle;
}

export default function AudioStoryPlayer({ article }: AudioStoryPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [supported, setSupported] = useState(true);

  const chunksRef = useRef<string[]>([]);
  const currentIdxRef = useRef<number>(0);
  const speedRef = useRef<number>(1.0);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
    }
  }, []);

  // When article changes, cancel speech and build text chunks
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIdx(0);
    currentIdxRef.current = 0;
    isPlayingRef.current = false;

    // Build speech chunks
    const chunks: string[] = [];
    chunks.push(`${article.title}. ${article.subtitle}`);

    if (article.quickFacts && article.quickFacts.length > 0) {
      const factsText = 'Quick Journey Facts: ' + article.quickFacts.map(f => `${f.label}: ${f.value}`).join('. ');
      chunks.push(factsText);
    }

    article.sections.forEach(sec => {
      if (sec.type === 'heading' && sec.title) {
        chunks.push(sec.title);
      } else if (sec.type === 'paragraph' && sec.content) {
        // Split long paragraphs into natural sentences for flawless, pause-free audio
        const sentences = sec.content.match(/[^.!?]+[.!?]+/g) || [sec.content];
        sentences.forEach(s => chunks.push(s.trim()));
      } else if (sec.type === 'tip' && sec.content) {
        chunks.push('Traveler Tip: ' + sec.content);
      } else if (sec.type === 'trivia' && sec.content) {
        chunks.push('Railway Trivia: ' + sec.content);
      } else if (sec.type === 'quote' && sec.content) {
        chunks.push('Historical Quote: ' + sec.content);
      }
    });

    chunksRef.current = chunks;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [article]);

  const speakChunk = (index: number) => {
    if (!('speechSynthesis' in window)) return;
    if (index >= chunksRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentIdx(0);
      currentIdxRef.current = 0;
      isPlayingRef.current = false;
      return;
    }

    window.speechSynthesis.cancel();

    const text = chunksRef.current[index];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speedRef.current;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN'; // Indian English accent preferred for authentic railway journey narration

    utterance.onend = () => {
      if (isPlayingRef.current) {
        const nextIdx = index + 1;
        currentIdxRef.current = nextIdx;
        setCurrentIdx(nextIdx);
        speakChunk(nextIdx);
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('Speech synthesis error:', e);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (!supported) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    speakChunk(currentIdxRef.current);
  };

  const handlePause = () => {
    if (!supported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (!supported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      handlePlay();
    }
  };

  const handleStop = () => {
    if (!supported) return;
    isPlayingRef.current = false;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIdx(0);
    currentIdxRef.current = 0;
  };

  const handleSpeedToggle = () => {
    const speeds = [0.8, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    speedRef.current = nextSpeed;
    if (isPlaying && !isPaused) {
      speakChunk(currentIdxRef.current);
    }
  };

  if (!supported) return null;

  const totalChunks = chunksRef.current.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentIdx + 1) / totalChunks) * 100));

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/40 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Indicator & Title */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border transition-all ${
            isPlaying && !isPaused
              ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-lg shadow-indigo-500/20'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Audio Narration</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Hands-Free Mode
                </span>
              </h4>
              {isPlaying && !isPaused && (
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 h-3 bg-indigo-400 animate-pulse" />
                  <span className="w-0.5 h-2 bg-indigo-400 animate-bounce" />
                  <span className="w-0.5 h-3.5 bg-indigo-400 animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-indigo-400 animate-bounce" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {isPlaying
                ? isPaused
                  ? 'Narration paused • Tap resume to continue'
                  : `Narrating: part ${currentIdx + 1} of ${totalChunks}`
                : 'Listen to this railway history & scenic guide while looking out the train window'}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Speed Toggle */}
          <button
            type="button"
            onClick={handleSpeedToggle}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
            title="Change Narration Speed"
          >
            {speed}x
          </button>

          {/* Play / Pause / Resume */}
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Listen</span>
            </button>
          ) : isPaused ? (
            <button
              type="button"
              onClick={handleResume}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
            >
              <Pause className="w-3.5 h-3.5 fill-white" />
              <span>Pause</span>
            </button>
          )}

          {/* Stop Button */}
          {isPlaying && (
            <button
              type="button"
              onClick={handleStop}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
              title="Stop Narration"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* Audio Progress Bar */}
      {isPlaying && (
        <div className="mt-3 pt-2 border-t border-slate-800/80">
          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
