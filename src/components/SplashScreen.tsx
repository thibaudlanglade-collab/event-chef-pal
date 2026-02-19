import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      style={{ background: "linear-gradient(180deg, #1E2D45 0%, #312E81 100%)" }}
    >
      <img
        src={logo}
        alt="CaterPilot"
        className="h-16 w-16 rounded-2xl object-contain animate-fade-in mb-6"
      />
      <h1 className="text-5xl font-bold text-white animate-fade-in">CaterPilot</h1>
      <p className="mt-3 text-lg text-white/70 animate-fade-in-delayed">
        L'assistant du traiteur moderne
      </p>
      <div className="mt-8 animate-fade-in-delayed">
        <div className="h-8 w-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
}
