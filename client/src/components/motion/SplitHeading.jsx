import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};

const word = {
  hidden: { y: "110%", rotateX: -75, opacity: 0 },
  show: {
    y: "0%",
    rotateX: 0,
    opacity: 1,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function SplitHeading({ text, as = "h1", className = "", once = true }) {
  const Tag = motion[as] ?? motion.h1;

  return (
    <Tag
      className={`split ${className}`}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.5 }}
    >
      {text.split(" ").map((w, i) => (
        <span className="split-mask" key={`${w}-${i}`}>
          <motion.span className="split-word" variants={word}>
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
