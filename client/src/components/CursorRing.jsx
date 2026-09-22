import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

const RING = { stiffness: 320, damping: 26, mass: 0.35 };
const DOT = { stiffness: 1200, damping: 45, mass: 0.2 };
const INTERACTIVE =
  "a, button, input, textarea, select, label, [role='button'], .tile, .chip, .card, .cat-item, .promo";
const TEXTUAL = "input, textarea, [contenteditable='true']";

export default function CursorRing() {
  const reduced = useReducedMotion();
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | hot | text
  const [down, setDown] = useState(false);

  const x = useMotionValue(-300);
  const y = useMotionValue(-300);
  const ringX = useSpring(x, RING);
  const ringY = useSpring(y, RING);
  const dotX = useSpring(x, DOT);
  const dotY = useSpring(y, DOT);

  const active = supported && !reduced;

  useEffect(() => {
    if (!active) return undefined;

    document.body.classList.add("cursor-hidden");

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target;
      if (target?.closest?.(TEXTUAL)) setMode("text");
      else if (target?.closest?.(INTERACTIVE)) setMode("hot");
      else setMode("idle");
    };
    const leave = () => setVisible(false);
    const press = () => setDown(true);
    const release = () => setDown(false);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    document.addEventListener("pointerleave", leave);

    return () => {
      document.body.classList.remove("cursor-hidden");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      document.removeEventListener("pointerleave", leave);
    };
  }, [active, x, y]);

  if (!active) return null;

  const ring =
    mode === "text"
      ? { scaleX: 0.12, scaleY: 1.5, opacity: visible ? 1 : 0 }
      : {
          scaleX: down ? 0.82 : mode === "hot" ? 1.45 : 1,
          scaleY: down ? 0.82 : mode === "hot" ? 1.45 : 1,
          opacity: visible ? 1 : 0,
        };

  return (
    <>
      <motion.div
        className={`cursor-ring ${mode === "hot" ? "is-hot" : ""}`}
        style={{ x: ringX, y: ringY }}
        animate={ring}
        transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.4 }}
        aria-hidden="true"
      />
      <motion.div
        className="cursor-dot"
        style={{ x: dotX, y: dotY }}
        animate={{
          scale: mode === "hot" ? 0.4 : down ? 1.5 : 1,
          opacity: visible && mode !== "text" ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        aria-hidden="true"
      />
    </>
  );
}
