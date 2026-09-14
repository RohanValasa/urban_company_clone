export default function ServiceCard({ service, onBook }) {
  const { name, category, price, rating, duration, image } = service;

  return (
    <article className="card">
      <img src={image} alt={name} className="card-img" />
      <div className="card-body">
        <span className="badge">{category}</span>
        <h3>{name}</h3>
        <div className="meta">
          <span>⭐ {rating}</span>
          <span>{duration}</span>
        </div>
        <div className="card-footer">
          <strong>₹{price}</strong>
          <button className="btn" onClick={onBook}>Book</button>
        </div>
      </div>
    </article>
  );
}