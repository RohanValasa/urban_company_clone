import { Link } from "react-router-dom";

const COLUMNS = [
  {
    title: "Company",
    links: ["About us", "Investor relations", "Terms & conditions", "Privacy policy", "Anti-discrimination policy", "Careers"],
  },
  {
    title: "For customers",
    links: ["Reviews", "Categories near you", "Contact us"],
  },
  {
    title: "For professionals",
    links: ["Register as a professional"],
  },
];

const SOCIALS = [
  {
    label: "X",
    path: <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />,
  },
  {
    label: "Facebook",
    path: <path d="M9.2 5.6H10.6V3.8H9.2c-1.4 0-2.4 1-2.4 2.4v1.2H5.4v1.8h1.4v4.8h1.9V9.2h1.5l.3-1.8H8.7V6.2c0-.35.2-.6.5-.6z" fill="currentColor" />,
  },
  {
    label: "Instagram",
    path: (
      <>
        <rect x="3.2" y="3.2" width="9.6" height="9.6" rx="3" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <circle cx="11.3" cy="4.7" r="0.8" fill="currentColor" />
      </>
    ),
  },
  {
    label: "LinkedIn",
    path: (
      <>
        <circle cx="4.2" cy="4" r="1.2" fill="currentColor" />
        <rect x="3.3" y="6.2" width="1.9" height="6.6" fill="currentColor" />
        <path d="M6.8 6.2h1.8v.9c.45-.7 1.25-1.1 2.1-1.1 1.55 0 2.5.95 2.5 2.85v3.95h-1.9V9.3c0-.95-.4-1.5-1.2-1.5-.75 0-1.3.55-1.3 1.5v3.5H6.8V6.2z" fill="currentColor" />
      </>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link to="/" className="footer-brand">
          <span className="footer-mark">UC</span>
          <span className="footer-name">Urban<br />Clone</span>
        </Link>

        <div className="footer-cols">
          {COLUMNS.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#top">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-col">
            <h4>Social links</h4>
            <div className="socials">
              {SOCIALS.map((s) => (
                <a key={s.label} href="#top" className="social" aria-label={s.label}>
                  <svg viewBox="0 0 16 16" width="16" height="16">{s.path}</svg>
                </a>
              ))}
            </div>
            <div className="store-badges">
              <a href="#top" className="store-badge">
                <span className="store-glyph"></span>
                <span>
                  <small>Download on</small>
                  iOS
                </span>
              </a>
              <a href="#top" className="store-badge">
                <span className="store-glyph">▶</span>
                <span>
                  <small>Get it on</small>
                  Android
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>* Prices shown are indicative and vary by city.</p>
          <p>© 2026 UrbanClone — a personal learning project. Not affiliated with, or endorsed by, any real home-services company.</p>
        </div>
      </div>
    </footer>
  );
}
