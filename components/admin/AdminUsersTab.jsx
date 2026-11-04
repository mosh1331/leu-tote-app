// components/admin/AdminUsersTab.jsx
export default function AdminUsersTab({ users }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold">
          <tr>
            <th className="p-4">Customer</th>
            <th className="p-4">Status</th>
            <th className="p-4">Referral Code</th>
            <th className="p-4">Referrals Made</th>
            <th className="p-4">Wishlisted</th>
            <th className="p-4">Available Points</th>
            <th className="p-4">Orders &amp; Spend</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="p-4">
                <div className="font-bold">{u.full_name || 'Guest User'}</div>
                <div className="text-gray-400 text-[11px]">{u.phone}</div>
              </td>
              <td className="p-4">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.is_registered ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {u.is_registered ? 'Registered' : 'Guest'}
                </span>
              </td>
              <td className="p-4 font-mono font-bold">{u.referral_code || '—'}</td>
              <td className="p-4 font-bold text-gray-700">{u.successful_referrals || 0}</td>
              <td className="p-4 font-bold text-pink-600">{u.wishlist_count || 0}</td>
              <td className="p-4 font-bold text-amber-600">{u.available_points || 0} pts</td>
              <td className="p-4">
                <div className="font-bold">₹{Number(u.lifetime_spend).toLocaleString()}</div>
                <div className="text-gray-400 text-[10px]">{u.total_orders} purchases</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}