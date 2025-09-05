import { useEffect, useState } from "react";

type DashboardData = {
  users: { total: number; new_today: number };
  rooms: { total: number; created_today: number };
  reports: { pending: number };
  reviews: { total: number };
  notifications: { total: number };
  top_boss_today: string | null;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE;
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_BASE}/api/admin/dashboard.php`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.message || "โหลดข้อมูลไม่สำเร็จ");
        setData(json.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-gray-600 dark:text-gray-300">กำลังโหลด...</div>;
  if (error) return <div className="text-red-600 dark:text-red-400">❌ {error}</div>;

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Overview
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        สรุปสถิติและข้อมูลสำคัญของระบบ
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Users */}
        <div  className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">ผู้ใช้งาน</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data?.users.total.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +{data?.users.new_today} วันนี้
          </p>
        </div>

        {/* Rooms */}
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">ห้อง Raid</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data?.rooms.total.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            +{data?.rooms.created_today} วันนี้
          </p>
        </div>

        {/* Reports */}
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">รายงานค้าง</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {data?.reports.pending}
          </div>
        </div>

        {/* Reviews */}
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">รีวิวทั้งหมด</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data?.reviews.total.toLocaleString()}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">การแจ้งเตือน</div>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data?.notifications.total}
          </div>
        </div>

        {/* Top Boss */}
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-300">บอสยอดนิยมวันนี้</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {data?.top_boss_today || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
