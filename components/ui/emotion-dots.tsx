import type { EmotionInput } from "@/lib/data/types";
import { getCore } from "@/lib/emotions";

export function EmotionDots({ emotions, size = 10 }: { emotions: EmotionInput[]; size?: number }) {
  if (!emotions.length) return null;
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {emotions.map((e, i) => (
        <span key={i} className="rounded-full" style={{ width: size, height: size, background: getCore(e.core).color }} />
      ))}
    </span>
  );
}
