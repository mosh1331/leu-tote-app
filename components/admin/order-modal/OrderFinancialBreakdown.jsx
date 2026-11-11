// components/admin/order-modal/OrderFinancialBreakdown.jsx
'use client';

export default function OrderFinancialBreakdown({
  subtotal,
  discount,
  collectedShipping,
  finalPayable,
  totalCogs,
  courierCost,
  rzpFee,
  netMargin,
  marginPercent,
  isOffline,
}) {
  return (
    <div className="space-y-4">
      {/* Top Realized Net Profit Banner */}
      <div
        className={`p-4 sm:p-5 rounded-theme-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
          netMargin >= 0
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-red-50/80 border-red-200 text-red-950'
        }`}
      >
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 block">
            Net Realized Margin (After All Expenses)
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono">
            {netMargin >= 0 ? '+' : ''}₹{netMargin.toLocaleString()}
            <span className="text-xs sm:text-sm font-bold text-gray-600 ml-2">
              ({marginPercent}% of collected total)
            </span>
          </div>
        </div>

        <div className="text-right text-xs text-gray-500 font-medium">
          <span>Settlement Channel: </span>
          <strong className="text-gray-800">
            {isOffline ? 'In-Person (Cash/UPI)' : 'Online Payment Gateway'}
          </strong>
        </div>
      </div>

      {/* Itemized Deductions Ledger */}
      <div className="bg-white rounded-theme-lg p-4 sm:p-5 border border-black/5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
          Financial &amp; Expense Breakdown
        </h3>

        {/* High-level Revenue Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-theme-sm border border-black/[0.04]">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Subtotal</span>
            <span className="text-sm font-extrabold text-themeText-primary">
              ₹{subtotal.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-theme-sm border border-black/[0.04]">
            <span className="text-[10px] text-red-500 font-bold block uppercase">Discounts</span>
            <span className="text-sm font-extrabold text-red-600">
              {discount > 0 ? `-₹${discount.toLocaleString()}` : '₹0'}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-theme-sm border border-black/[0.04]">
            <span className="text-[10px] text-gray-500 font-bold block uppercase">Shipping Collected</span>
            <span className="text-sm font-extrabold text-themeText-primary">
              {courierCost > 0 ? `+₹${courierCost.toLocaleString()}` : '₹0'}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-theme-sm border border-black/[0.04]">
            <span className="text-[10px] text-indigo-700 font-bold block uppercase">Customer Paid</span>
            <span className="text-sm font-extrabold text-indigo-900">
              ₹{finalPayable.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Detailed Deductions Strip */}
        <div className="p-3.5 bg-gray-900 text-white rounded-theme-sm font-mono text-[11px] sm:text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span>Customer Paid: <strong>₹{finalPayable.toLocaleString()}</strong></span>
            <span className="text-amber-400">COGS: -₹{totalCogs.toLocaleString()}</span>
            <span className="text-blue-300">Courier Expense: -₹{courierCost.toLocaleString()}</span>
            {!isOffline && (
              <span className="text-red-400">
                Razorpay (2.36%): -₹{rzpFee.toFixed(2)}
              </span>
            )}
          </div>
          <div className="font-bold text-emerald-400">
            = True Net: {netMargin >= 0 ? '+' : ''}₹{netMargin.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}