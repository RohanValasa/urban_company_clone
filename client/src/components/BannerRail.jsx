import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function BannerRail({ banners }) {
  return (
    <div className="banner-rail">
      {banners.map((b, i) => (
        <motion.div
          key={b.slug}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -6 }}
        >
          <Link to={`/collection/${b.slug}`} className="banner" style={{ background: b.theme }}>
            <img src={b.hero} alt="" className="banner-bg" loading="lazy" />
            <div className="banner-content">
              <span className="banner-eyebrow">{b.eyebrow}</span>
              <h3>{b.headline}</h3>
              <span className="banner-cta">{b.cta}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
