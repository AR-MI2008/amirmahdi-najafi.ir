'use client';

import { useEffect, useRef } from 'react';

/**
 * Hero substrate: a lattice of measurement points that brighten near the
 * pointer, like a sensor field registering presence. Canvas 2D — no WebGL,
 * because nothing here justifies a GPU context.
 *
 * Pauses when off-screen or when the tab is hidden. Renders nothing at all
 * under prefers-reduced-motion; the static CSS grid behind it remains.
 */
export function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const spacing = coarse ? 44 : 34;
    const radius = coarse ? 0 : 160;

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    let phase = 0;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function accent(): string {
      const value = getComputedStyle(document.documentElement).getPropertyValue('--accent');
      return value.trim() || '#42d9ff';
    }

    let accentColor = accent();

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      pointer.x += (pointer.tx - pointer.x) * 0.09;
      pointer.y += (pointer.ty - pointer.y) * 0.09;
      phase += 0.006;

      for (let x = spacing / 2; x < width; x += spacing) {
        for (let y = spacing / 2; y < height; y += spacing) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          const near = radius > 0 ? Math.max(0, 1 - dist / radius) : 0;
          // Slow ambient breathing so the field is alive without motion noise.
          const ambient = 0.06 + 0.03 * Math.sin(phase + (x + y) * 0.01);
          const alpha = ambient + near * 0.55;
          const size = 1 + near * 1.6;

          ctx.globalAlpha = Math.min(alpha, 0.75);
          ctx.fillStyle = near > 0.08 ? accentColor : 'currentColor';
          ctx.beginPath();
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    function start() {
      if (raf) return;
      accentColor = accent();
      raf = requestAnimationFrame(draw);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onPointerMove(event: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointer.tx = event.clientX - rect.left;
      pointer.ty = event.clientY - rect.top;
    }
    function onPointerLeave() {
      pointer.tx = -9999;
      pointer.ty = -9999;
    }
    function onVisibility() {
      if (document.hidden || !visible) stop();
      else start();
    }

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    if (!coarse) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerleave', onPointerLeave);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        onVisibility();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-muted"
    />
  );
}
