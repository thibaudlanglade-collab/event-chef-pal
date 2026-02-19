import { useState, useEffect } from "react";
import logoBird from "@/assets/logo-bird.png";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [showLetters, setShowLetters] = useState(false);

  useEffect(() => {
    // Start letter animation after a brief pause
    const letterTimer = setTimeout(() => setShowLetters(true), 300);
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 3500);
    return () => {
      clearTimeout(letterTimer);
      clearTimeout(fadeTimer);
    };
  }, [onComplete]);

  const letters = "sur le passe".split("");

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{ background: "#f5f0e8" }}
    >
      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Bird logo */}
      <img
        src={logoBird}
        alt="Sur le Passe"
        className="h-48 w-auto object-contain animate-fade-in mb-8"
      />

      {/* Animated letters */}
      <div className="flex flex-wrap justify-center gap-0" aria-label="sur le passe">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{
              color: "#1a1a1a",
              opacity: showLetters ? 1 : 0,
              transform: showLetters ? "scale(1)" : "scale(0.3)",
              transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`,
              transitionDelay: `${i * 80}ms`,
              display: letter === " " ? "inline" : "inline-block",
              width: letter === " " ? "0.35em" : "auto",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </div>

      {/* Spinner */}
      <div className="mt-10 animate-fade-in-delayed">
        <div className="h-8 w-8 border-3 border-[#1a1a1a]/20 border-t-[#1a1a1a] rounded-full animate-spin" />
      </div>
    </div>
  );
}
