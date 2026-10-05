import { useState } from "react";
import Sheet from "./Sheet";
import { rupees } from "../../lib/format";

/** The coupons the server offers, each with why it can't be used yet. */
export default function OfferSheet({ open, onClose, offers, applied, onApply }) {
  const [code, setCode] = useState("");

  return (
    <Sheet open={open} onClose={onClose} title="Coupons and offers">
      <form
        className="offer-code"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) onApply(code.trim().toUpperCase());
          setCode("");
        }}
      >
        <input placeholder="Enter coupon code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} />
        <button className="link-btn" disabled={!code.trim()}>Apply</button>
      </form>

      <ul className="offer-list">
        {offers.map((o) => (
          <li key={o.code} className={o.blockedBy ? "is-blocked" : ""}>
            <div className="offer-top">
              <span className="offer-tag">%</span>
              <div>
                <strong>{o.title}</strong>
                <code>{o.code}</code>
              </div>
              {applied === o.code ? (
                <span className="offer-applied">Applied</span>
              ) : (
                <button className="link-btn" disabled={Boolean(o.blockedBy)} onClick={() => onApply(o.code)}>
                  Apply
                </button>
              )}
            </div>
            <p>{o.description}</p>
            {o.blockedBy ? (
              <p className="offer-blocked">{o.blockedBy}</p>
            ) : (
              <p className="offer-saves">You save {rupees(o.saves)}</p>
            )}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
