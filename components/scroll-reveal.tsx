"use client";

import { useEffect } from "react";

const targets = "#content:not([aria-busy]) .card, #content:not([aria-busy]) section h2";

// Fades elements in as they scroll into view. Elements already visible when they appear are never hidden,
// so there is no flash, and nothing is hidden at all for users who prefer reduced motion.
// Pages stream in after navigation, so new content is picked up with a MutationObserver instead of per route.
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.replace("reveal-hidden", "reveal-in");
        io.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    const scan = () => {
      document.querySelectorAll<HTMLElement>(targets).forEach((element) => {
        // Streamed content first lands in a hidden container (no layout); wait until it is moved into place.
        if (seen.has(element) || element.getClientRects().length === 0) return;
        seen.add(element);
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        const index = Array.prototype.indexOf.call(element.parentElement?.children ?? [], element);
        element.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 70}ms`);
        element.classList.add("reveal-hidden");
        io.observe(element);
      });
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const mo = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(scan, 60); });
    mo.observe(document.getElementById("site-content") ?? document.body, { childList: true, subtree: true });
    scan();
    return () => { clearTimeout(timer); mo.disconnect(); io.disconnect(); };
  }, []);
  return null;
}
