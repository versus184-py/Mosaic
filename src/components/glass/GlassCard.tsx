import React, { useRef } from "react";
import { motion } from "framer-motion";
import type { LensParams } from "../../liquid-glass/types";
import { createGridBackgroundNode } from "../../liquid-glass/capture";
import { Lens } from "./Lens";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tint?: string;
  clickEffect?: boolean;
  noAnimation?: boolean;
  lens?: LensParams;
  refractionTarget?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

export function GlassCard({
  children,
  className = "",
  style,
  tint,
  clickEffect,
  noAnimation,
  lens,
  refractionTarget,
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
}: GlassCardProps) {
  const rippleRef = useRef<HTMLDivElement>(null);

  const handleRipple = (e: React.MouseEvent) => {
    if (!clickEffect) return;
    const el = rippleRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const ripple = document.createElement("div");
    ripple.className = "glass-ripple";
    ripple.style.left = `${x}%`;
    ripple.style.top = `${y}%`;
    el.appendChild(ripple);
    requestAnimationFrame(() => ripple.classList.add("glass-ripple-active"));
    setTimeout(() => ripple.remove(), 600);
  };

  const handleClick = (e: React.MouseEvent) => {
    handleRipple(e);
    onClick?.(e);
  };

  if (lens) {
    const target = refractionTarget ?? createGridBackgroundNode(lens.width, lens.height);
    return (
      <motion.div
        className={className}
        style={{
          ...style,
          ...(tint ? { "--glass-tint-a": tint } as React.CSSProperties : {}),
        } as React.CSSProperties}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        initial={noAnimation ? false : { opacity: 0, scale: 0.95 }}
        animate={noAnimation ? undefined : { opacity: 1, scale: 1 }}
        transition={noAnimation ? undefined : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <Lens
          params={lens}
          refractionTarget={target}
          onClick={handleClick}
          onContextMenu={onContextMenu}
        >
          {children}
        </Lens>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`glass-container ${className}`}
      style={{
        ...style,
        ...(tint ? { "--glass-tint-a": tint } as React.CSSProperties : {}),
      } as React.CSSProperties}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      initial={noAnimation ? false : { opacity: 0, scale: 0.95 }}
      animate={noAnimation ? undefined : { opacity: 1, scale: 1 }}
      transition={noAnimation ? undefined : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="glass-filter-layer" />
      <div className="glass-tint-layer" />
      <div className="glass-shine-layer" />
      <div ref={rippleRef} className="glass-ripple-container" />
      <div className="glass-content-layer">{children}</div>
    </motion.div>
  );
}
