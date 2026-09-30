import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const SPRING = { stiffness: 220, damping: 18, mass: 0.4 };

export default function Tilt({ children, className, max = 10, lift = 8, ...rest }) {
  const reduced = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), SPRING);
  const glowX = useTransform(px, (v) => `${v * 100}%`);
  const glowY = useTransform(py, (v) => `${v * 100}%`);

  if (reduced) return <div className={className}>{children}</div>;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      className={`tilt ${className || ""}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ y: -lift, transition: { type: "spring", stiffness: 260, damping: 20 } }}
      {...rest}
    >
      {children}
      <motion.span
        className="tilt-glow"
        style={{ left: glowX, top: glowY }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
