import { useState } from "react";
import Sheet from "./Sheet";
import { addressLine } from "../../lib/format";

const LABELS = [
  { value: "Home", icon: "🏠" },
  { value: "Work", icon: "🏢" },
  { value: "Other", icon: "📍" },
];
const EMPTY = { house: "", landmark: "", label: "Home" };

/**
 * Pick a saved address or add one. The area comes from the location picker,
 * which keeps every address inside Hyderabad.
 */
export default function AddressSheet({
  open,
  onClose,
  addresses,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  location,
  onChangeArea,
  adding,
  setAdding,
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const showForm = adding || addresses.length === 0;
  const area = [location.title, location.subtitle].filter(Boolean).join(", ");

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onAdd({ ...form, area, lat: location.lat, lng: location.lng });
      setForm(EMPTY);
      setAdding(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={showForm ? "Add an address" : "Select an address"}>
      {showForm ? (
        <form className="addr-form" onSubmit={save}>
          <div className="addr-area">
            <span className="addr-pin" aria-hidden="true">📍</span>
            <div>
              <strong>{location.title}</strong>
              <span>{location.subtitle}</span>
            </div>
            <button type="button" className="link-btn" onClick={onChangeArea}>Change</button>
          </div>

          <label>
            House / flat number and building
            <input
              required
              autoFocus
              maxLength={120}
              placeholder="Flat 302, Lotus Residency"
              value={form.house}
              onChange={(e) => setForm({ ...form, house: e.target.value })}
            />
          </label>
          <label>
            <span>Landmark <em>(optional)</em></span>
            <input
              maxLength={120}
              placeholder="Near Madhapur metro station"
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            />
          </label>

          <div className="addr-labels" role="radiogroup" aria-label="Save as">
            {LABELS.map((l) => (
              <button
                type="button"
                key={l.value}
                role="radio"
                aria-checked={form.label === l.value}
                className={form.label === l.value ? "active" : ""}
                onClick={() => setForm({ ...form, label: l.value })}
              >
                {l.icon} {l.value}
              </button>
            ))}
          </div>

          {error && <p className="auth-error">{error}</p>}
          <div className="addr-actions">
            {addresses.length > 0 && (
              <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Back</button>
            )}
            <button className="btn btn-block" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save and use this address"}
            </button>
          </div>
        </form>
      ) : (
        <div className="addr-list">
          {addresses.map((a) => (
            <div key={a.id} className={`addr-item ${a.id === selectedId ? "active" : ""}`}>
              <button className="addr-pick" onClick={() => onSelect(a.id)}>
                <span className="addr-radio" aria-hidden="true" />
                <span className="addr-text">
                  <strong>{a.label}</strong>
                  <span>{addressLine(a)}</span>
                </span>
              </button>
              <button className="addr-delete" onClick={() => onDelete(a.id)} aria-label={`Delete ${a.label} address`}>
                🗑
              </button>
            </div>
          ))}
          <button className="addr-new" onClick={() => setAdding(true)}>+ Add another address</button>
        </div>
      )}
    </Sheet>
  );
}
