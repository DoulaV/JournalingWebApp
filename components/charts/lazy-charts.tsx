"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentProps } from "react";

// Recharts is heavy; load it after the page so text appears first.
export const TrendsChart = dynamic(() => import("./insight-charts").then((m) => m.TrendsChart), {
  ssr: false,
  loading: () => <div className="bg-surface-2 h-[22rem] animate-pulse rounded-xl" />,
});

const WeekdayChartInner = dynamic(() => import("./insight-charts").then((m) => m.WeekdayChart), {
  ssr: false,
  loading: () => <div className="bg-surface-2 h-56 animate-pulse rounded-xl" />,
});

/** Mounts only when scrolled near the viewport. */
export function WeekdayChart(props: ComponentProps<typeof WeekdayChartInner>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref}>
      {visible ? (
        <WeekdayChartInner {...props} />
      ) : (
        <div className="bg-surface-2 h-56 rounded-xl" />
      )}
    </div>
  );
}
