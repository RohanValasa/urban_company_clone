import { useEffect, useState } from "react";
import ServiceCard from "../components/ServiceCard";

const MOCK = [
  { _id: "1", name: "Home Deep Cleaning", category: "Cleaning", price: 1499, rating: 4.8, duration: "4 hrs", image: "https://placehold.co/400x250?text=Cleaning" },
  { _id: "2", name: "AC Service & Repair", category: "Appliance", price: 599, rating: 4.6, duration: "1 hr", image: "https://placehold.co/400x250?text=AC+Service" },
  { _id: "3", name: "Tap & Pipe Repair", category: "Plumbing", price: 349, rating: 4.7, duration: "45 min", image: "https://placehold.co/400x250?text=Plumbing" },
  { _id: "4", name: "Salon for Women", category: "Beauty", price: 899, rating: 4.9, duration: "2 hrs", image: "https://placehold.co/400x250?text=Salon" },
];

const CATEGORIES = ["All", "Cleaning", "Appliance", "Plumbing", "Beauty"];

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setServices(MOCK);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const visible = services.filter((s) => {
    const matchesCategory = activeCategory === "All" || s.category === activeCategory;
    const matchesQuery = s.name.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <main className="page">
      <h1>What do you need done?</h1>

      <input
        className="search"
        placeholder="Search for a service..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="chips">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`chip ${activeCategory === c ? "chip-active" : ""}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading services...</p>
      ) : visible.length === 0 ? (
        <p className="muted">No services match that search.</p>
      ) : (
        <div className="grid">
          {visible.map((s) => (
            <ServiceCard key={s._id} service={s} onBook={() => alert(`Booking ${s.name}`)} />
          ))}
        </div>
      )}
    </main>
  );
}