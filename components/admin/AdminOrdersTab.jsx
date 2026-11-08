"use client"
import { useState } from "react";
import OrderDetailModal from "./OrderDetailModal";

// components/admin/AdminOrdersTab.jsx
export default function AdminOrdersTab({ orders,onRefresh }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold">
          <tr>
            <th className="p-4">Order ID</th>
            <th className="p-4">Customer</th>
            <th className="p-4">Subtotal / Discount</th>
            <th className="p-4">Final Paid</th>
            <th className="p-4">Points Redeemed</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="p-4 font-mono text-gray-500">#{o.id.slice(0, 8)}</td>
              <td className="p-4">
                <div className="font-bold">{o.customer_name}</div>
                <div className="text-gray-400 text-[10px]">{o.customer_phone}</div>
              </td>
              <td className="p-4">
                ₹{o.subtotal}{' '}
                {o.discount_amount > 0 && (
                  <span className="text-red-500">(-₹{o.discount_amount})</span>
                )}
              </td>
              <td className="p-4 font-extrabold text-gray-900">₹{o.final_payable}</td>
              <td className="p-4 text-amber-700 font-bold">{o.points_redeemed || 0} pts</td>
              <td className="p-4">
                <span className="px-2 py-1 rounded bg-gray-100 font-bold text-[10px]">
                  {o.status}
                </span>
              </td>
              <td className="p-4 text-right">
            <button
              type="button"
              onClick={() => setSelectedOrder(o)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors active:scale-95"
            >
              View Order Details
            </button>
          </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}