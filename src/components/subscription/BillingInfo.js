"use client";

const PAYMENT_METHOD_LABELS = {
  bank: "Bank Transfer",
  esewa: "eSewa",
  khalti: "Khalti",
  fonepay: "Fonepay",
  connectips: "ConnectIPS",
};

export default function BillingInfo({ purchases }) {
  const approved = purchases.filter((p) => p.status === "approved");
  const totalPaid = approved.reduce((sum, p) => sum + Number(p.final_amount), 0);
  const mostRecent = approved[0];
  const nextPaymentPlan = purchases.find((p) => p.status === "pending");

  return (
    <div className="hm-card p-4">
      <p className="text-sm font-bold text-[var(--color-text)]">Billing Information</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Total Amount Paid</p>
          <p className="mt-1 text-lg font-extrabold text-[var(--color-text)]">Rs. {totalPaid.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Next Payment</p>
          <p className="mt-1 text-lg font-extrabold text-[var(--color-text)]">
            {nextPaymentPlan ? `Rs. ${nextPaymentPlan.final_amount}` : "None pending"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Last Discount / Coupon</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {mostRecent?.discount_amount > 0
              ? `Rs. ${mostRecent.discount_amount}${mostRecent.coupon_code ? ` (${mostRecent.coupon_code})` : ""}`
              : "None"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">Payment Method</p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {mostRecent?.payment_method ? PAYMENT_METHOD_LABELS[mostRecent.payment_method] : "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}
