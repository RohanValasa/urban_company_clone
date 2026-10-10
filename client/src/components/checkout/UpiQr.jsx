import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** A QR code that opens any UPI app with the payee and amount filled in. */
export default function UpiQr({ upi, amount, note }) {
  const [src, setSrc] = useState("");
  const link =
    `upi://pay?pa=${encodeURIComponent(upi.id)}&pn=${encodeURIComponent(upi.name)}` +
    `&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(link, { width: 440, margin: 1, color: { dark: "#0f0a1e", light: "#ffffff" } }).then(
      (url) => live && setSrc(url),
      () => live && setSrc("")
    );
    return () => {
      live = false;
    };
  }, [link]);

  return (
    <div className="upi-box">
      <div className="upi-qr">{src ? <img src={src} alt={`UPI QR code to pay ₹${amount}`} /> : <span className="upi-wait" />}</div>
      <div className="upi-info">
        <strong>Scan with any UPI app</strong>
        <span>Google Pay, PhonePe, Paytm, BHIM…</span>
        <span className="upi-amount">₹{amount.toLocaleString("en-IN")}</span>
        <span className="upi-payee">
          to {upi.name} · <code>{upi.id}</code>
        </span>
        {/* On a phone, this opens the UPI app directly. */}
        <a className="link-btn upi-open" href={link}>Open UPI app</a>
      </div>
    </div>
  );
}
