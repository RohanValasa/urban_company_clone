import { emojiUrl } from "../lib/art";

// Older carts saved remote photo URLs; only bundled pictures are drawn.
const asPic = (pic) => {
  if (!pic) return {};
  if (typeof pic === "string") return pic.startsWith("http") ? {} : { src: pic };
  return pic;
};

/** One 3D icon on its tone. Fills whatever box it is placed in. */
export function Art({ pic, alt = "", className = "", children }) {
  const p = asPic(pic);
  return (
    <span className={`art ${className}`} style={p.tone ? { "--tone": p.tone } : undefined}>
      {p.src ? (
        <img src={p.src} alt={alt} loading="lazy" draggable="false" />
      ) : (
        p.emoji && <span className="art-glyph" role="img" aria-label={alt}>{p.emoji}</span>
      )}
      {children}
    </span>
  );
}

/** An inline 3D emoji, falling back to the text glyph. */
export function Emoji({ char, className = "", label = "" }) {
  const src = emojiUrl(char);
  return src ? (
    <img className={`emoji3d ${className}`} src={src} alt={label} draggable="false" />
  ) : (
    <span className={className} role="img" aria-label={label}>{char}</span>
  );
}

/** A main icon with smaller ones floating around it, on a soft tone. */
export function Scene({ scene, className = "" }) {
  if (!scene) return null;
  return (
    <div className={`scene ${className}`} style={{ "--tone": scene.tone }}>
      <span className="scene-halo" aria-hidden="true" />
      {scene.accents.map((a, i) => (
        <span className={`scene-accent scene-accent-${i}`} key={`${a.emoji}-${i}`} aria-hidden="true">
          {a.src ? <img src={a.src} alt="" draggable="false" /> : a.emoji}
        </span>
      ))}
      <span className="scene-main">
        {scene.main.src ? <img src={scene.main.src} alt="" draggable="false" /> : scene.main.emoji}
      </span>
    </div>
  );
}
