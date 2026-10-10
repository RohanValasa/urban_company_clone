import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** A centred pop-up with a title, closed by ✕, Escape or a click outside. */
export default function Sheet({ open, title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`sheet ${wide ? "sheet-wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18 } }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="sheet-head">
              <h2>{title}</h2>
              <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
            </header>
            <div className="sheet-body">{children}</div>
            {footer && <footer className="sheet-foot">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
