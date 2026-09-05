"use client";

import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export function CobeGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let globe: ReturnType<typeof createGlobe> | null = null;
    let rafId = 0;
    let phi = 0;

    // A muted, continuous decorative loop: it must stop entirely for
    // prefers-reduced-motion rather than keep spinning in the background.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const init = () => {
      const side = canvas.offsetWidth;
      if (side === 0 || globe) {
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: side * dpr,
        height: side * dpr,
        phi: 0,
        theta: 0.2,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 16_000,
        mapBrightness: 6,
        baseColor: [0.3, 0.3, 0.3],
        markerColor: [0.1, 0.8, 1],
        glowColor: [1, 1, 1],
        markers: [],
      });

      if (reduced) {
        globe.update({ phi: 0 });
        return;
      }

      const loop = () => {
        globe?.update({ phi });
        phi += 0.005;
        rafId = requestAnimationFrame(loop);
      };
      loop();
    };

    let ro: ResizeObserver | null = null;

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width && entries[0]?.contentRect.width > 0) {
          ro?.disconnect();
          ro = null;
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      ro?.disconnect();
      cancelAnimationFrame(rafId);
      globe?.destroy();
    };
  }, []);

  return <canvas className={className} ref={canvasRef} style={{ width: "115%", aspectRatio: 1 }} />;
}
