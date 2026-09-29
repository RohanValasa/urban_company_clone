import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Scene } from "./Art";

const HOLD = 3600;

/**
 * Plays `src` when a real video file is supplied, otherwise runs the scenes
 * as a ken-burns sequence so the stage always looks like a playing video.
 */
export default function VideoStage({ shots = [], src, caption, className = "" }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const count = shots.length;
  const at = count ? i % count : 0;

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
          <motion.div
            key={at}
            className="stage-media"
            initial={{ opacity: 0, scale: 1.14 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ opacity: { duration: 0.9 }, scale: { duration: HOLD / 1000 + 1, ease: "linear" } }}
          >
            <Scene scene={shots[at]} />
          </motion.div>
        </AnimatePresence>
      )}

      {caption && (
        <motion.span
          className="stage-caption"
          key={`cap-${at}`}
          initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {caption}
        </motion.span>
      )}

      {!src && count > 1 && (
        <div className="stage-bars">
          {shots.map((_, n) => (
            <span className="stage-bar" key={n}>
              <motion.i
                animate={{ scaleX: n === at ? 1 : n < at ? 1 : 0 }}
                transition={{ duration: n === at && !reduced ? HOLD / 1000 : 0.3, ease: "linear" }}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
