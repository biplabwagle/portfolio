"use client";

export function PlaySnakeButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-snake"))}
      data-cursor-label="Play"
      aria-label="Play Snake"
      className={className}
    >
      🐍 Play Snake
    </button>
  );
}
