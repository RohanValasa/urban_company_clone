import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import ServiceRail from "../components/ServiceRail";
import { findCollection, findServices } from "../data/catalog";

export default function Collection() {
  const { slug } = useParams();
  const collection = findCollection(slug);

  if (!collection) {
    return (
      <main className="page">
        <h1>Collection not found</h1>
        <Link to="/" className="btn">Back to services</Link>
      </main>
    );
  }

  return (
    <main className="page curation">
      <motion.div
        className="crumb"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/">Services</Link> <span>›</span> {collection.sections[0].title}
      </motion.div>

      <motion.div
        className="curation-hero"
        style={{ background: collection.theme }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={collection.hero} alt="" className="banner-bg" />
        <div className="banner-content">
          <span className="banner-eyebrow">{collection.eyebrow}</span>
          <h1>{collection.headline}</h1>
          <span className="banner-cta">{collection.cta}</span>
        </div>
      </motion.div>

      {collection.sections.map((section) => (
        <ServiceRail
          key={section.title}
          title={section.title}
          subtitle={section.subtitle}
          services={findServices(section.ids)}
        />
      ))}
    </main>
  );
}
