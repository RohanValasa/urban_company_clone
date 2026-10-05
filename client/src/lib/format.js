/** ₹1,596 */
export const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;

/** "Flat 302, near Metro, Madhapur, Hyderabad" */
export const addressLine = (a) => [a.house, a.landmark && `near ${a.landmark}`, a.area].filter(Boolean).join(", ");
