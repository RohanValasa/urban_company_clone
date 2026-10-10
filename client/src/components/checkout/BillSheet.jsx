import Sheet from "./Sheet";
import { rupees } from "../../lib/format";

export function BillRows({ bill }) {
  const priceCut = bill.mrpTotal - bill.itemTotal;
  return (
    <dl className="bill-rows">
      <div>
        <dt>Item total</dt>
        <dd>
          {priceCut > 0 && <s>{rupees(bill.mrpTotal)}</s>} {rupees(bill.itemTotal)}
        </dd>
      </div>
      {bill.couponDiscount > 0 && (
        <div className="is-saving">
          <dt>Coupon ({bill.coupon})</dt>
          <dd>−{rupees(bill.couponDiscount)}</dd>
        </div>
      )}
      <div>
        <dt>Taxes and fee</dt>
        <dd>{rupees(bill.taxesAndFee)}</dd>
      </div>
      {bill.tip > 0 && (
        <div>
          <dt>Tip for the professional</dt>
          <dd>{rupees(bill.tip)}</dd>
        </div>
      )}
      <div className="bill-total">
        <dt>Total amount</dt>
        <dd>{rupees(bill.total)}</dd>
      </div>
      {bill.saved > 0 && <p className="bill-saved">🎉 You're saving {rupees(bill.saved)} on this order</p>}
    </dl>
  );
}

export default function BillSheet({ open, onClose, bill }) {
  return (
    <Sheet open={open} onClose={onClose} title="Payment summary">
      {bill && <BillRows bill={bill} />}
      <p className="bill-note">Taxes and fee cover a ₹49 visit fee and 5% GST on the service.</p>
    </Sheet>
  );
}
