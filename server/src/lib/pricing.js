const { ValidationError } = require("./validate");
const { skillFor } = require("./skills");

const CONVENIENCE_FEE = 49;
const TAX_RATE = 0.05;
const MAX_TIP = 2000;

/**
 * Offers shown at checkout. `discount` gets the item total after Servify's own
 * price cuts and returns the rupees taken off.
 */
const COUPONS = [
  {
    code: "SERVIFY10",
    title: "10% off",
    description: "Get 10% off, up to ₹150, on orders above ₹499.",
    minOrder: 499,
    discount: (total) => Math.min(150, Math.round(total * 0.1)),
  },
  {
    code: "FIRST100",
    title: "₹100 off your first booking",
    description: "For new customers on orders above ₹699.",
    minOrder: 699,
    firstBookingOnly: true,
    discount: () => 100,
  },
  {
    code: "UPI50",
    title: "₹50 off with UPI",
    description: "Pay by UPI on orders above ₹299.",
    minOrder: 299,
    upiOnly: true,
    discount: () => 50,
  },
  {
    code: "BIG250",
    title: "₹250 off big jobs",
    description: "On orders above ₹2,499.",
    minOrder: 2499,
    discount: () => 250,
  },
];

const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;
const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Cleans the cart sent by the browser. */
function cartItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) throw new ValidationError("Your cart is empty.");
  if (raw.length > 25) throw new ValidationError("That's too many different services for one booking.");
  return raw.map((item) => {
    const price = Number(item?.price);
    const mrp = item?.mrp == null ? price : Number(item.mrp);
    const qty = Number(item?.qty);
    const clean = {
      id: text(item?.id, 80),
      name: text(item?.name, 120),
      category: text(item?.category, 80),
      sub: text(item?.sub, 60),
      price,
      mrp: Math.max(mrp, price),
      qty,
    };
    if (!clean.id || !clean.name) throw new ValidationError("A cart item is missing its name.");
    if (!isInt(price, 1, 200000) || !isInt(clean.mrp, 1, 400000)) throw new ValidationError(`"${clean.name}" has an invalid price.`);
    if (!isInt(qty, 1, 20)) throw new ValidationError(`Choose between 1 and 20 of "${clean.name}".`);
    const { sub, ...kept } = clean;
    return { ...kept, skill: skillFor(clean) };
  });
}

/** Whether a coupon can be used, and if not, why. */
function couponState(coupon, { itemTotal, payment, isFirstBooking }) {
  if (itemTotal < coupon.minOrder) return `Add ${rupees(coupon.minOrder - itemTotal)} more to use this offer.`;
  if (coupon.upiOnly && payment !== "upi") return "Choose UPI as the payment method to use this offer.";
  if (coupon.firstBookingOnly && isFirstBooking === false) return "Only for your first booking.";
  return null;
}

/**
 * The bill for a cart. The server is the only place this is worked out, so
 * the browser can't change what a booking costs.
 */
function quote({ items: rawItems, coupon: rawCoupon, tip: rawTip, payment, isFirstBooking }) {
  const items = cartItems(rawItems);
  const tip = rawTip == null || rawTip === "" ? 0 : Number(rawTip);
  if (!isInt(tip, 0, MAX_TIP)) throw new ValidationError(`Tips can be up to ${rupees(MAX_TIP)}.`);

  const itemTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const mrpTotal = items.reduce((sum, i) => sum + i.mrp * i.qty, 0);
  const context = { itemTotal, payment, isFirstBooking };

  const offers = COUPONS.map((c) => ({
    code: c.code,
    title: c.title,
    description: c.description,
    blockedBy: couponState(c, context),
    saves: c.discount(itemTotal),
  }));

  let coupon = null;
  let couponDiscount = 0;
  let couponError = null;
  const code = text(rawCoupon, 20).toUpperCase();
  if (code) {
    const found = COUPONS.find((c) => c.code === code);
    const blockedBy = found ? couponState(found, context) : "That coupon code doesn't exist.";
    if (blockedBy) couponError = blockedBy;
    else {
      coupon = found.code;
      couponDiscount = Math.min(found.discount(itemTotal), itemTotal);
    }
  }

  const taxable = itemTotal - couponDiscount;
  const taxesAndFee = Math.round(taxable * TAX_RATE) + CONVENIENCE_FEE;
  const total = taxable + taxesAndFee + tip;

  return {
    items,
    bill: {
      itemTotal,
      mrpTotal,
      coupon,
      couponDiscount,
      taxesAndFee,
      tip,
      total,
      saved: mrpTotal - itemTotal + couponDiscount,
    },
    couponError,
    offers,
  };
}

module.exports = { quote, COUPONS, CONVENIENCE_FEE, TAX_RATE };
