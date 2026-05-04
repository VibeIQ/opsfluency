"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Small floating button that appears after the user scrolls 300px down.
 * Positioned above the bottom nav using safe-area-inset so it clears
 * the iOS home indicator on notched devices.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={[
        "fixed right-4 z-40 flex size-10 items-center justify-center rounded-full",
        "border border-[color:var(--dc-edge)] bg-dc-surface/90 text-dc-text-2 shadow-md backdrop-blur",
        "transition-all duration-200",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-2 pointer-events-none",
      ].join(" ")}
      // Sit 1.25rem above the bottom nav (5rem nav height + safe-area).
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
    >
      <ArrowUp className="size-4" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
