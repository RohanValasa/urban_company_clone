import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

const BUBBLE = { stiffness: 130, damping: 15, mass: 0.6 };
const CORE = { stiffness: 900, damping: 42, mass: 0.3 };
const INTERACTIVE =
  "a, button, input, textarea, select, label, [role='button'], .tile, .chip, .card, .cat-item, .promo";

export default function CursorBubble() {
  const reduced = useReducedMotion();
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
  const [visible, setVisible] = useState(false);
  const [hot, setHot] = useState(false);
  const [down, setDown] = useState(false);

  const x = useMotionValue(-300);
  const y = useMotionValue(-300);
  const bubbleX = useSpring(x, BUBBLE);
  const bubbleY = useSpring(y, BUBBLE);
  const coreX = useSpring(x, CORE);
  const coreY = useSpring(y, CORE);

  const active = supported && !reduced;

  useEffect(() => {
    if (!active) return undefined;

    document.body.classList.add("cursor-hidden");

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      setHot(Boolean(e.target?.closest?.(INTERACTIVE)));
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

  return (
    <>
      <motion.div
        className={`cursor-bubble ${hot ? "cursor-hot" : ""}`}
        style={{ x: bubbleX, y: bubbleY }}
        animate={{
          scale: down ? 0.75 : hot ? 2.05 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20, mass: 0.5 }}
        aria-hidden="true"
      >
        <span className="cursor-film" />
        <span className="cursor-shine" />
      </motion.div>

      <motion.div
        className="cursor-core"
        style={{ x: coreX, y: coreY }}
        animate={{
          scale: down ? 1.6 : hot ? 0.35 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        aria-hidden="true"
      />
    </>
  );
}
