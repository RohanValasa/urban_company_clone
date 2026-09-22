import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const HOLD = 3600;

/**
 * Plays `src` when a real video file is supplied, otherwise runs the shots as
 * a ken-burns sequence so the stage always looks like a playing video.
 */
export default function VideoStage({ shots = [], src, caption, className = "" }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const count = shots.length;

  useEffect(() => {
    if (src || reduced || count < 2) return undefined;
    const t = setInterval(() => setI((prev) => (prev + 1) % count), HOLD);
    return () => clearInterval(t);
  }, [src, reduced, count]);

  return (
    <div className={`stage ${className}`}>
      {src ? (
        <video className="stage-media" src={src} autoPlay muted loop playsInline />
      ) : (
        <AnimatePresence initial={false}>
          <motion.img
            key={shots[i]}
            src={shots[i]}
            alt=""
            className="stage-media"
            initial={{ opacity: 0, scale: 1.14 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ opacity: { duration: 0.9 }, scale: { duration: HOLD / 1000 + 1, ease: "linear" } }}
          />
        </AnimatePresence>
      )}

      {caption && (
        <motion.span
          className="stage-caption"
          key={`cap-${i}`}
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {caption}
        </motion.span>
      )}

      {!src && count > 1 && (
        <div className="stage-bars">
          {shots.map((s, n) => (
            <span className="stage-bar" key={s}>
              <motion.i
                animate={{ scaleX: n === i ? 1 : n < i ? 1 : 0 }}
                transition={{ duration: n === i && !reduced ? HOLD / 1000 : 0.3, ease: "linear" }}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
