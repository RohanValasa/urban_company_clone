import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { api } from "../lib/api";
import { getConfig } from "../lib/config";
import { formatSlot, slotStillOpen } from "../lib/slots";
import { addressLine, rupees } from "../lib/format";
import AddressSheet from "../components/checkout/AddressSheet";
import SlotSheet from "../components/checkout/SlotSheet";
import OfferSheet from "../components/checkout/OfferSheet";
import BillSheet, { BillRows } from "../components/checkout/BillSheet";
import UpiQr from "../components/checkout/UpiQr";

const TIPS = [50, 75, 100];
const PAYMENTS = [
  { id: "cash", icon: "💵", title: "Cash on delivery", sub: "Pay the professional in cash after the service" },
  { id: "upi", icon: "📱", title: "UPI (scan QR)", sub: "Pay now with any UPI app" },
];

/** Groups cart lines by service, like "Bathroom Cleaning". */
function groupItems(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.category || "Your services";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups];
}

function Step({ icon, title, done, active, summary, onChange, children }) {
  return (
    <section className={`co-step ${active ? "is-active" : ""} ${done ? "is-done" : ""}`}>
      <div className="co-step-head">
        <span className="co-step-icon" aria-hidden="true">{done ? "✓" : icon}</span>
        <div className="co-step-title">
          <h2>{title}</h2>
          {done && summary && <p>{summary}</p>}
        </div>
        {done && onChange && (
          <button className="link-btn" onClick={onChange}>Change</button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {active && children && (
          <motion.div
            className="co-step-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function Checkout() {
  const { items, setQty, clear } = useCart();
  const { user, loading, savePhone } = useAuth();
  const { openAuth, location, openLocation, locationOpen } = useUI();

  const [phone, setPhone] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  // Tagged with the account they belong to, so signing out hides them.
  const [saved, setSaved] = useState({ userId: null, list: [] });
  const [addressId, setAddressId] = useState(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [resumeAddress, setResumeAddress] = useState(false);

  const [slot, setSlot] = useState(null);
  const [payment, setPayment] = useState(null);
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponNote, setCouponNote] = useState("");
  const [avoidCalling, setAvoidCalling] = useState(true);

  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [upi, setUpi] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [placed, setPlaced] = useState(null);

  const isCustomer = user?.role === "customer";
  const cartLines = useMemo(
    () => items.map((i) => ({ id: i._id, name: i.name, category: i.category, price: i.price, mrp: i.mrp, qty: i.qty })),
    [items]
  );

  // The bill always comes from the server, so prices can't be changed here.
  useEffect(() => {
    if (cartLines.length === 0) return undefined;
    let live = true;
    const timer = setTimeout(() => {
      api("/bookings/quote", { method: "POST", body: { items: cartLines, coupon, tip, payment } })
        .then((data) => {
          if (!live) return;
          setQuote(data);
          setQuoteError("");
          if (coupon && data.couponError) {
            setCouponNote(`${coupon} was removed: ${data.couponError}`);
            setCoupon(null);
          }
        })
        .catch((err) => live && setQuoteError(err.message));
    }, 150);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [cartLines, coupon, tip, payment, user?.id]);

  useEffect(() => {
    getConfig().then((c) => setUpi(c.upi), () => setUpi(null));
  }, []);

  // Saved addresses belong to the account, so load them once signed in.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return undefined;
    let live = true;
    api("/account/addresses").then(
      (data) => live && setSaved({ userId, list: data.addresses }),
      () => {}
    );
    return () => {
      live = false;
    };
  }, [userId]);

  const addresses = userId && saved.userId === userId ? saved.list : [];
  const setAddresses = (update) => setSaved((s) => ({ userId: s.userId, list: update(s.list) }));
  // Until one is picked, use the first saved address.
  const address = addresses.find((a) => a.id === addressId) || (addressId === null ? addresses[0] : null) || null;
  // "Change" on the area swaps the address sheet for the location picker, then comes back to it.
  const addressSheetOpen = sheet === "address" || (resumeAddress && !locationOpen);
  const phoneDone = Boolean(isCustomer && user.phone && !editingPhone);
  const addressDone = phoneDone && Boolean(address);
  const slotOpen = slot && slotStillOpen(slot);
  const slotDone = addressDone && Boolean(slotOpen);
  const bill = quote?.bill;
  const offerCount = quote?.offers.filter((o) => !o.blockedBy).length ?? 0;

  const submitPhone = async (e) => {
    e.preventDefault();
    setPhoneError("");
    setPhoneSaving(true);
    try {
      await savePhone(phone);
      setEditingPhone(false);
    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setPhoneSaving(false);
    }
  };

  const addAddress = async (input) => {
    const { address: added } = await api("/account/addresses", { method: "POST", body: input });
    setAddresses((list) => [...list, added]);
    setAddressId(added.id);
    closeSheet();
  };

  const deleteAddress = async (id) => {
    await api(`/account/addresses/${id}`, { method: "DELETE" }).catch(() => {});
    setAddresses((list) => list.filter((a) => a.id !== id));
    if (address?.id === id) setAddressId(null);
  };

  const applyCoupon = (code) => {
    setCouponNote("");
    setCoupon(code);
    setSheet(null);
  };

  const chooseTip = (value) => {
    setCustomTip("");
    setTip((t) => (t === value ? 0 : value));
  };

  const place = async () => {
    setPlaceError("");
    setPlacing(true);
    try {
      const { booking } = await api("/bookings", {
        method: "POST",
        body: { items: cartLines, coupon, tip, payment, addressId: address.id, slot, avoidCalling },
      });
      setPlaced(booking);
      clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setPlaceError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const closeSheet = useCallback(() => {
    setSheet(null);
    setResumeAddress(false);
    setAddingAddress(false);
  }, []);

  if (placed) return <Placed booking={placed} />;

  if (items.length === 0) {
    return (
      <main className="page cart-page">
        <div className="cart-empty">
          <span>🛒</span>
          <h1>Your cart is empty</h1>
          <p className="muted">Add a service to book a professional.</p>
          <Link to="/" className="btn">Browse services</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page checkout">
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        Checkout
      </motion.h1>

      <div className="co-layout">
        <div className="co-left">
          <div className="co-steps">
            <Step
              icon="📞"
              title="Send booking details to"
              active={!phoneDone}
              done={phoneDone}
              summary={user?.phone && `+91 ${user.phone.slice(0, 5)} ${user.phone.slice(5)}`}
              onChange={() => {
                setPhone(user.phone);
                setEditingPhone(true);
              }}
            >
              {loading ? (
                <p className="co-hint">Checking your account…</p>
              ) : !user ? (
                <div className="co-signin">
                  <p className="co-hint">Sign in to book. We'll send booking updates to your phone.</p>
                  <div className="co-signin-actions">
                    <button className="btn" onClick={() => openAuth("signin")}>Sign in</button>
                    <button className="btn-ghost" onClick={() => openAuth("signup")}>Create account</button>
                  </div>
                </div>
              ) : !isCustomer ? (
                <p className="co-hint co-warn">
                  You're signed in as a professional. Sign in with a customer account to book services.
                </p>
              ) : (
                <form className="co-phone" onSubmit={submitPhone}>
                  <p className="co-hint">
                    {user.phone ? "Update the number for booking updates." : "Add your mobile number so the professional can reach you."}
                  </p>
                  <div className="co-phone-row">
                    <label className="co-phone-input">
                      <span>+91</span>
                      <input
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        aria-label="Mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        required
                      />
                    </label>
                    <button className="btn" disabled={phone.length !== 10 || phoneSaving}>
                      {phoneSaving ? "Saving…" : "Save"}
                    </button>
                    {user.phone && (
                      <button type="button" className="btn-ghost" onClick={() => setEditingPhone(false)}>Cancel</button>
                    )}
                  </div>
                  {phoneError && <p className="auth-error">{phoneError}</p>}
                </form>
              )}
            </Step>

            <Step
              icon="📍"
              title="Address"
              active={phoneDone && !addressDone}
              done={addressDone}
              summary={address && `${address.label} · ${addressLine(address)}`}
              onChange={() => setSheet("address")}
            >
              <button className="btn btn-block" onClick={() => setSheet("address")}>Select address</button>
            </Step>

            <Step
              icon="🕘"
              title="Slot"
              active={addressDone && !slotDone}
              done={slotDone}
              summary={slotOpen && formatSlot(slot)}
              onChange={() => setSheet("slot")}
            >
              {slot && !slotOpen && <p className="co-hint co-warn">Your earlier slot has passed. Please pick another.</p>}
              <button className="btn btn-block" onClick={() => setSheet("slot")}>Select time and date</button>
            </Step>

            <Step icon="💳" title="Payment method" active={slotDone}>
              <div className="pay-options" role="radiogroup" aria-label="Payment method">
                {PAYMENTS.map((p) => {
                  const off = p.id === "upi" && !upi;
                  return (
                    <button
                      key={p.id}
                      role="radio"
                      aria-checked={payment === p.id}
                      disabled={off}
                      className={`pay-option ${payment === p.id ? "active" : ""}`}
                      onClick={() => setPayment(p.id)}
                    >
                      <span className="pay-icon" aria-hidden="true">{p.icon}</span>
                      <span className="pay-text">
                        <strong>{p.title}</strong>
                        <span>{off ? "UPI payments aren't set up yet" : p.sub}</span>
                      </span>
                      <span className="pay-radio" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              {!upi && import.meta.env.DEV && (
                <p className="google-note">
                  Add <code>UPI_ID</code> to <code>server/.env</code> to turn on UPI payments.
                </p>
              )}

              {payment === "upi" && upi && bill && (
                <UpiQr upi={upi} amount={bill.total} note={`Servify booking for ${user.name}`} />
              )}

              {placeError && <p className="auth-error">{placeError}</p>}
              {payment && bill && (
                <button className="btn btn-block co-place" onClick={place} disabled={placing}>
                  {placing
                    ? "Booking…"
                    : payment === "upi"
                      ? `I've paid ${rupees(bill.total)}, confirm booking`
                      : `Place booking · ${rupees(bill.total)}`}
                </button>
              )}
              {payment === "upi" && (
                <p className="co-hint">We'll confirm the UPI payment with your bank before the visit.</p>
              )}
            </Step>
          </div>

          <div className="co-policy">
            <h3>Cancellation policy</h3>
            <p>Free cancellations if done more than 12 hrs before the service. A fee will be charged otherwise.</p>
          </div>
        </div>

        <aside className="co-right">
          <div className="co-card">
            {groupItems(items).map(([category, lines]) => (
              <div key={category} className="co-group">
                <h3>{category}</h3>
                {lines.map((item) => (
                  <div key={item._id} className="co-line">
                    <span className="co-line-name">{item.name}</span>
                    <div className="stepper">
                      <button onClick={() => setQty(item._id, item.qty - 1)} aria-label={`One less ${item.name}`}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => setQty(item._id, item.qty + 1)} aria-label={`One more ${item.name}`}>+</button>
                    </div>
                    <span className="co-line-price">
                      {rupees(item.price * item.qty)}
                      {item.mrp > item.price && <s>{rupees(item.mrp * item.qty)}</s>}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <label className="co-check">
              <input type="checkbox" checked={avoidCalling} onChange={(e) => setAvoidCalling(e.target.checked)} />
              Avoid calling before reaching the location
            </label>
          </div>

          <div className="co-card">
            <button className="co-offers" onClick={() => setSheet("offers")} disabled={!quote}>
              <span className="co-offers-icon" aria-hidden="true">%</span>
              <span className="co-offers-text">
                <strong>{coupon ? `${coupon} applied` : "Coupons and offers"}</strong>
                {coupon && bill?.couponDiscount > 0 && <span>You save {rupees(bill.couponDiscount)}</span>}
              </span>
              <span className="co-offers-count">
                {coupon ? "Change" : offerCount === 1 ? "1 offer" : `${offerCount} offers`} ›
              </span>
            </button>
            {coupon && (
              <button className="link-btn co-remove" onClick={() => setCoupon(null)}>Remove coupon</button>
            )}
            {couponNote && <p className="co-hint co-warn">{couponNote}</p>}
          </div>

          <div className="co-card">
            {quoteError && <p className="auth-error">{quoteError}</p>}
            <button className="co-total" onClick={() => setSheet("bill")} disabled={!bill}>
              <span className="co-total-icon" aria-hidden="true">🧾</span>
              <span className="co-total-text">
                <span className="co-total-line">
                  Total bill {bill?.saved > 0 && <s>{rupees(bill.total + bill.saved)}</s>}{" "}
                  <strong>{bill ? rupees(bill.total) : "…"}</strong>
                </span>
                <span className="co-hint">Incl. govt. taxes &amp; charges</span>
                {bill?.saved > 0 && <span className="co-saved">You saved {rupees(bill.saved)}</span>}
              </span>
              <span aria-hidden="true">›</span>
            </button>

            <div className="co-tip">
              <h3>Add a tip to thank the professional</h3>
              <div className="co-tip-row">
                {TIPS.map((t) => (
                  <button key={t} className={tip === t && !customTip ? "active" : ""} onClick={() => chooseTip(t)}>
                    ₹{t}
                    {t === 75 && <em>Popular</em>}
                  </button>
                ))}
                <label className={`co-tip-custom ${customTip ? "active" : ""}`}>
                  <span>₹</span>
                  <input
                    inputMode="numeric"
                    placeholder="Custom"
                    aria-label="Custom tip"
                    value={customTip}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCustomTip(v);
                      setTip(Math.min(Number(v) || 0, 2000));
                    }}
                  />
                </label>
              </div>
              <p className="co-hint">100% of the tip goes to the professional.</p>
            </div>
          </div>

          <div className="co-card co-pay">
            <div>
              <span>Amount to pay</span>
              <strong>{bill ? rupees(bill.total) : "…"}</strong>
            </div>
            <button className="link-btn" onClick={() => setSheet("bill")} disabled={!bill}>View breakup</button>
          </div>
        </aside>
      </div>

      <AddressSheet
        open={addressSheetOpen}
        onClose={closeSheet}
        addresses={addresses}
        selectedId={address?.id}
        onSelect={(id) => {
          setAddressId(id);
          closeSheet();
        }}
        onAdd={addAddress}
        onDelete={deleteAddress}
        location={location}
        onChangeArea={() => {
          setSheet(null);
          setResumeAddress(true);
          setAddingAddress(true);
          openLocation();
        }}
        adding={addingAddress}
        setAdding={setAddingAddress}
      />
      <SlotSheet
        open={sheet === "slot"}
        onClose={closeSheet}
        selected={slotOpen ? slot : null}
        onSelect={(iso) => {
          setSlot(iso);
          setSheet(null);
        }}
      />
      <OfferSheet
        open={sheet === "offers"}
        onClose={closeSheet}
        offers={quote?.offers || []}
        applied={coupon}
        onApply={applyCoupon}
      />
      <BillSheet open={sheet === "bill"} onClose={closeSheet} bill={bill} />
    </main>
  );
}

function Placed({ booking }) {
  const upi = booking.payment.method === "upi";
  return (
    <main className="page cart-page">
      <motion.div
        className="order-success co-placed"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="order-success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 16 }}
        >
          ✅
        </motion.span>
        <h1>Booking confirmed!</h1>
        <p>
          A verified professional will arrive on <strong>{formatSlot(booking.slot)}</strong>.
        </p>
        <dl className="co-placed-details">
          <div>
            <dt>Booking ID</dt>
            <dd>#{booking.id.slice(-6).toUpperCase()}</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{addressLine(booking.address)}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>
              {upi ? "UPI" : "Cash on delivery"} · {rupees(booking.bill.total)}
              {upi && <span className="co-hint"> (we're confirming your payment)</span>}
            </dd>
          </div>
        </dl>
        <BillRows bill={booking.bill} />
        <div className="co-placed-actions">
          <Link to={`/bookings/${booking.id}`} className="btn">Track booking</Link>
          <Link to="/bookings" className="btn-ghost">My bookings</Link>
        </div>
      </motion.div>
    </main>
  );
}
