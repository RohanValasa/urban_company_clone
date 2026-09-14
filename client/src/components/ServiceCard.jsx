import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function ServiceCard({ service, onBook }) {
  const { name, category, price, rating, duration, image } = service;

  return (
    <motion.article
      className="card"
      variants={cardVariants}
      whileHover={{ y: -10, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="card-img-wrap">
        <motion.img
          src={image}
          alt={name}
          className="card-img"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="card-body">
        <span className="badge">{category}</span>
        <h3>{name}</h3>
        <div className="meta">
          <span>⭐ {rating}</span>
          <span>{duration}</span>
        </div>
        <div className="card-footer">
          <strong>₹{price}</strong>
          <motion.button
            className="btn"
            onClick={onBook}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            Book
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
