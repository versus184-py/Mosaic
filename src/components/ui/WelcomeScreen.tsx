import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeScreenProps {
  onStart: () => void;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  targetX: number;
  targetY: number;
  size: number;
  opacity: number;
  speed: number;
  hue: number;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const [phase, setPhase] = useState<"idle" | "burst" | "gone">("idle");
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const animEnabledRef = useRef(animationEnabled);
  animEnabledRef.current = animationEnabled;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    function resize() {
      if (!canvas) return;
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      if (w > 0 && h > 0) {
        const scaleX = newW / w;
        const scaleY = newH / h;
        for (const p of particlesRef.current) {
          p.baseX *= scaleX; p.baseY *= scaleY;
          p.x *= scaleX; p.y *= scaleY;
          p.targetX *= scaleX; p.targetY *= scaleY;
        }
      }
      w = canvas.width = newW;
      h = canvas.height = newH;
    }

    resize();
    window.addEventListener("resize", resize);

    const count = 200;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        targetX: x,
        targetY: y,
        size: Math.random() * 2 + 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.008 + 0.003,
        hue: 30 + Math.random() * 40,
      });
    }

    particlesRef.current = particles;

    function animate() {
      if (!ctx || !canvas || !animEnabledRef.current) return;
      const currentPhase = phaseRef.current;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        if (currentPhase === "burst") {
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.x += dx * 0.08;
          p.y += dy * 0.08;
        } else {
          const dx = p.baseX - p.x;
          const dy = p.baseY - p.y;
          p.x += dx * 0.02;
          p.y += dy * 0.02;
        }

        if (currentPhase === "idle" && mx > 0 && my > 0) {
          const dist = Math.hypot(mx - p.x, my - p.y);
          if (dist < 200) {
            const force = (200 - dist) / 200;
            const angle = Math.atan2(my - p.y, mx - p.x);
            p.x -= Math.cos(angle) * force * 1.5;
            p.y -= Math.sin(angle) * force * 1.5;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 60%, 60%, ${(1 - dist / 80) * 0.06})`;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    }

    setReady(true);
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
    };
  }, []);

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (phaseRef.current === "gone") return;
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("mousemove", onMouse);
    return () => window.removeEventListener("mousemove", onMouse);
  }, []);

  const handleClick = () => {
    if (phase !== "idle" || !ready) return;
    setPhase("burst");
    const particles = particlesRef.current;
    for (const p of particles) {
      p.targetX = p.x + (Math.random() - 0.5) * 1200;
      p.targetY = p.y + (Math.random() - 0.5) * 1200;
      p.speed = Math.random() * 0.04 + 0.02;
    }
    setTimeout(() => {
      setPhase("gone");
      onStart();
    }, 500);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5,
        pointerEvents: phase === "gone" ? "none" : "auto",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={handleClick}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), transparent 70%)",
                  boxShadow: "0 0 60px rgba(120,160,255,0.08), 0 0 120px rgba(120,160,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 32,
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: "center" }}
            >
              <h1
                style={{
                  fontSize: 40,
                  fontWeight: 600,
                  color: "transparent",
                  background: "linear-gradient(135deg, #e8e8f0 30%, #9090b8 70%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: -1,
                  marginBottom: 10,
                }}
              >
                Mosaic
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  letterSpacing: 1.5,
                  fontWeight: 400,
                  textTransform: "uppercase",
                }}
              >
                a spatial canvas for conversations
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: [0, 0.4, 0],
                y: [0, -6, 0],
              }}
              transition={{
                delay: 2,
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ marginTop: 80 }}
            >
              <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: 2 }}>
                click anywhere to begin
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
