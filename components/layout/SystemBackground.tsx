"use client";

import { useEffect, useRef, Suspense } from "react";

function SystemBackgroundContent() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hàm sinh toạ độ sao ngẫu nhiên trong vùng 2000x2000 gán cho box-shadow
    function generateShadows(n: number) {
      const out: string[] = [];
      for (let i = 0; i < n; i++) {
        out.push(
          `${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px var(--star-color)`
        );
      }
      return out.join(", ");
    }

    if (rootRef.current) {
      rootRef.current.style.setProperty("--s1", generateShadows(700));
      rootRef.current.style.setProperty("--s2", generateShadows(200));
      rootRef.current.style.setProperty("--s3", generateShadows(100));
    }
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="stars-system-container pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 3 lớp sao động bay từ dưới lên liên tục */}
      <div className="stars-layer-1" />
      <div className="stars-layer-2" />
      <div className="stars-layer-3" />
    </div>
  );
}

export function SystemBackground() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at bottom, #dbeafe 0%, #f1f5f9 55%, #ffffff 100%)",
          }}
        />
      }
    >
      <SystemBackgroundContent />
    </Suspense>
  );
}
