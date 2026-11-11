// components/admin/order-modal/OrderItemsTable.jsx
'use client';

export default function OrderItemsTable({ items = [] }) {
  return (
    <div className="bg-white rounded-theme-lg border border-black/5 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-black/5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
          Purchased Bags ({items.length})
        </h3>
        <span className="text-[11px] text-gray-400">Unit Cost &amp; Gross Margin Breakdown[cite: 1]</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 border-b text-gray-400 uppercase font-semibold text-[10px]">
            <tr>
              <th className="p-3.5">Bag Description</th>
              <th className="p-3.5 text-center">Qty</th>
              <th className="p-3.5 text-right">Offer Price</th>
              <th className="p-3.5 text-right">Unit Cost</th>
              <th className="p-3.5 text-right">Line Total</th>
              <th className="p-3.5 text-right">Gross Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, idx) => {
              const unitPrice = Number(item.unit_price || 0);
              const unitCost = Number(item.cost_price || 0);
              const qty = Number(item.quantity || 1);
              const lineTotal = Number(item.total_price || unitPrice * qty);
              const itemProfit = (unitPrice - unitCost) * qty;

              return (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="p-3.5">
                    <p className="font-bold text-themeText-primary">{item.title}</p>
                    <span className="text-[10px] text-gray-400">
                      {item.size || 'Standard'} {item.color ? `· ${item.color}` : ''}
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-gray-700">{qty}</td>
                  <td className="p-3.5 text-right font-mono text-gray-600">
                    ₹{unitPrice.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-mono text-amber-700">
                    ₹{unitCost.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right font-extrabold text-themeText-primary">
                    ₹{lineTotal.toLocaleString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        itemProfit >= 0
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {itemProfit >= 0 ? '+' : ''}₹{itemProfit.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}