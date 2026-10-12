"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  isIos: boolean;
  toggleFullscreen: () => Promise<void>;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
}

/**
 * Custom hook for True Fullscreen mode across Desktop and Mobile devices.
 * Handles Native Fullscreen API (Android Chrome, Desktop) with smart fallbacks
 * for iOS Safari (iPhone) to auto-scroll & minimize the native address/search bar,
 * locking overscroll bouncing and setting dynamic 100dvh viewport height.
 */
export function useFullscreen(targetRef?: React.RefObject<HTMLElement | null>): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Detect platform and native Fullscreen API support
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent || "";
    const isIosDevice =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);

    setIsIos(isIosDevice);

    const doc = document as FullscreenDocument;
    const nativeSupported = Boolean(
      doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    );

    // On standard iPhone Safari, element-level requestFullscreen is not supported
    setIsSupported(nativeSupported && !isIosDevice);
  }, []);

  // 2. Synchronize state with browser native fullscreen events
  useEffect(() => {
    if (typeof document === "undefined") return;

    const checkNativeFs = (): boolean => {
      const doc = document as FullscreenDocument;
      return Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
    };

    const handleFullscreenChange = () => {
      const active = checkNativeFs();
      setIsFullscreen((prev) => {
        // If native fullscreen was dismissed (e.g., Esc key, browser swipe gesture)
        if (!active && prev && !isIos) {
          return false;
        }
        return active;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isIos, isFullscreen]);

  // 3. Viewport & Body scroll management for Mobile / iOS Safari
  useEffect(() => {
    if (typeof document === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalTouchAction = document.body.style.touchAction;

    if (isFullscreen) {
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
      document.body.style.touchAction = "manipulation";
      document.documentElement.classList.add("exam-fullscreen-active");

      // Auto-scroll trick for mobile Safari / Chrome:
      // Scrolling 1px collapses Safari's top URL address bar and bottom navigation bar
      if (typeof window !== "undefined") {
        scrollTimeoutRef.current = setTimeout(() => {
          window.scrollTo({ top: 1, behavior: "instant" });
        }, 100);
      }
    } else {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.body.style.touchAction = originalTouchAction;
      document.documentElement.classList.remove("exam-fullscreen-active");

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.body.style.touchAction = originalTouchAction;
      document.documentElement.classList.remove("exam-fullscreen-active");
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  // 4. Enter Fullscreen (Native + iOS Fallback)
  const enterFullscreen = useCallback(async () => {
    const target = (targetRef?.current || document.documentElement) as FullscreenElement;

    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else if (target.webkitRequestFullscreen) {
        await target.webkitRequestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else if (target.mozRequestFullScreen) {
        await target.mozRequestFullScreen().catch(() => {});
        setIsFullscreen(true);
      } else if (target.msRequestFullscreen) {
        await target.msRequestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        // Fallback for iOS Safari (Pseudo-fullscreen with 100dvh & collapsed address bar)
        setIsFullscreen(true);
      }
    } catch {
      // Graceful fallback if browser permissions restrict native API
      setIsFullscreen(true);
    }

    // Scroll 1px to nudge iOS Safari address bar into minimized state
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.scrollTo({ top: 1, behavior: "instant" });
      }, 50);
    }
  }, [targetRef]);

  // 5. Exit Fullscreen
  const exitFullscreen = useCallback(async () => {
    const doc = document as FullscreenDocument;

    try {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen().catch(() => {});
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen().catch(() => {});
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore
    } finally {
      setIsFullscreen(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }, []);

  // 6. Toggle Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    isIos,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
}
