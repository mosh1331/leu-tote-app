// components/admin/order-modal/OrderCustomerDetails.jsx
'use client';

export default function OrderCustomerDetails({ order, isOffline }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Customer Contact */}
      <div className="bg-white rounded-theme-lg p-4 sm:p-5 border border-black/5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary border-b pb-2">
          Customer Profile
        </h3>
        <div className="text-xs space-y-1">
          <p className="font-bold text-themeText-primary text-sm">
            {order.customer_name || 'Walk-in Guest Customer'}
          </p>
          <p className="text-gray-500">Phone: {order.customer_phone || '—'}</p>
          {order.customer_email && (
            <p className="text-gray-500">Email: {order.customer_email}</p>
          )}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                order.is_registered ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {order.is_registered ? 'Registered Member' : 'Guest Buyer'}
            </span>
            {Number(order.points_earned || 0) > 0 && (
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded">
                +{order.points_earned} pts reward
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-theme-lg p-4 sm:p-5 border border-black/5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary border-b pb-2">
          Shipping Destination
        </h3>
        {isOffline ? (
          <div className="text-xs text-gray-500 py-3 space-y-1">
            <p className="font-bold text-gray-800">Direct In-Person Fulfillment</p>
            <p>Pop-up / Exhibition studio counter sale[cite: 1].</p>
            {order.offline_notes && (
              <p className="p-2 bg-amber-50 rounded text-amber-800 text-[11px] mt-2 font-medium">
                Notes: {order.offline_notes}
              </p>
            )}
          </div>
        ) : (
          <div className="text-xs space-y-1 text-gray-600">
            <p className="font-bold text-themeText-primary text-sm">
              {order.recipient_name || order.customer_name}
            </p>
            <p>{order.address_line1}</p>
            {order.address_line2 && <p>{order.address_line2}</p>}
            <p className="font-semibold text-gray-800">
              {order.city}, {order.state} - {order.postal_code}
            </p>
            {order.delivery_phone && (
              <p className="text-gray-400 text-[11px] pt-1">
                Contact: {order.delivery_phone}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}