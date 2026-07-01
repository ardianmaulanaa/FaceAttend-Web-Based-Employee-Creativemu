"use client";

import { useEffect } from "react";

const PULL_THRESHOLD_PX = 90;
const WHEEL_THRESHOLD_PX = 120;
const RELOAD_COOLDOWN_MS = 1500;
const STORAGE_KEY = "faceattend-last-scroll-reload";

function canReloadNow() {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  const lastReload = raw ? Number(raw) : 0;
  return Number.isFinite(lastReload)
    ? Date.now() - lastReload > RELOAD_COOLDOWN_MS
    : true;
}

function triggerReload() {
  if (!canReloadNow()) return;
  window.sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  window.location.reload();
}

export default function ScrollReloadGuard() {
  useEffect(() => {
    let touchStartY = 0;
    let wheelPullDistance = 0;

    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? 0;
      const pullDistance = currentY - touchStartY;

      if (window.scrollY <= 0 && pullDistance > PULL_THRESHOLD_PX) {
        triggerReload();
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (window.scrollY > 0) {
        wheelPullDistance = 0;
        return;
      }

      if (event.deltaY < 0) {
        wheelPullDistance += Math.abs(event.deltaY);
      } else {
        wheelPullDistance = 0;
      }

      if (wheelPullDistance >= WHEEL_THRESHOLD_PX) {
        triggerReload();
        wheelPullDistance = 0;
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return null;
}
