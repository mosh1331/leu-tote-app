// components/admin/order-modal/OrderFulfillmentSection.jsx
'use client';

const COURIER_OPTIONS = [
  { id: 'India Post', label: 'India Post', defaultUrl: 'https://www.indiapost.gov.in/' },
  { id: 'Delhivery', label: 'Delhivery', defaultUrl: 'https://www.delhivery.com/tracking' },
  { id: 'Other', label: 'Other', defaultUrl: '' },
];

export default function OrderFulfillmentSection({
  courierName,
  setCourierName,
  trackingId,
  setTrackingId,
  trackingUrl,
  setTrackingUrl,
  onDispatch,
  updating,
  existingTrackingId,
}) {
  const handleCourierChange = (e) => {
    const selected = e.target.value;
    setCourierName(selected);
    const matched = COURIER_OPTIONS.find((opt) => opt.id === selected);
    if (matched && matched.defaultUrl) {
      setTrackingUrl(matched.defaultUrl);
    }
  };

  return (
    <div className="print:hidden bg-white rounded-theme-lg p-4 sm:p-5 border border-black/5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-base">🚚</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-themeText-secondary">
            Courier Dispatch &amp; Tracking
          </h3>
        </div>
        {existingTrackingId && (
          <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
            AWB: {existingTrackingId}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Delivery Partner Select Dropdown */}
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
            Delivery Partner *
          </label>
          <select
            value={courierName}
            onChange={handleCourierChange}
            className="w-full h-10 px-3 text-base sm:text-xs border rounded-lg bg-white font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            {COURIER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking ID / AWB */}
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
            Tracking ID / AWB Number *
          </label>
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="e.g. EK123456789IN"
            className="w-full h-10 px-3 text-base sm:text-xs border rounded-lg bg-gray-50/50 font-mono font-bold"
          />
        </div>

        {/* Tracking URL */}
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
            Tracking URL
          </label>
          <input
            type="url"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="https://www.indiapost.gov.in/"
            className="w-full h-10 px-3 text-base sm:text-xs border rounded-lg bg-gray-50/50 text-xs"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2">
        <p className="text-[10px] text-gray-400">
          Marking as Shipped notifies the customer on WhatsApp with the tracking link.
        </p>

        <button
          type="button"
          disabled={updating || !trackingId.trim()}
          onClick={onDispatch}
          className="px-4 py-2.5 bg-themePrimary hover:bg-black text-white text-xs font-bold rounded-theme-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-sm flex items-center justify-center space-x-1.5"
        >
          <span>🚀</span>
          <span>{updating ? 'Updating...' : 'Mark SHIPPED & Alert Customer'}</span>
        </button>
      </div>
    </div>
  );
}