import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Spinner } from "flowbite-react";
import { AlertComponent } from "../../component/alert";
import { getErrorMessage } from "../../component/functions/getErrorMessage";

/* ---------- Types ---------- */
type DashboardData = {
  users: { total: number; new_today: number };
  rooms: { total: number; created_today: number };
  reports: { pending: number };
  reviews: { total: number };
  notifications: { total: number };
  top_boss_today: string | null;
};

type ApiResponse = {
  success: boolean;
  data?: DashboardData;
  message?: string;
};

/* ---------- Reusable Card ---------- */
function StatCard({
  title,
  value,
  subtitle,
  gradient = "from-indigo-500 via-blue-500 to-emerald-500",
  accentClass = "text-gray-900 dark:text-gray-100",
  valueClass = "text-gray-900 dark:text-gray-100",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  gradient?: string;
  accentClass?: string;
  valueClass?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className={`text-sm ${accentClass} opacity-80`}>{title}</div>
        <div className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</div>
        {subtitle ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Skeletons ---------- */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="h-1 w-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
      <div className="p-4 animate-pulse">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-7 w-28 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const navigate = useNavigate();

  async function fetchData() {
    try {
      setError(null);
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";

      const res = await fetch(`${API_BASE}/api/admin/dashboard.php`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const json: ApiResponse = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message || `Server returned ${res.status}`);
      }
      setData(json.data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(getErrorMessage(e) || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const totalUsers = useMemo(() => data?.users.total ?? 0, [data]);
  const newToday = useMemo(() => data?.users.new_today ?? 0, [data]);
  const totalRooms = useMemo(() => data?.rooms.total ?? 0, [data]);
  const roomsToday = useMemo(() => data?.rooms.created_today ?? 0, [data]);
  const pendingReports = useMemo(() => data?.reports.pending ?? 0, [data]);
  const totalReviews = useMemo(() => data?.reviews.total ?? 0, [data]);
  const totalNoti = useMemo(() => data?.notifications.total ?? 0, [data]);
  const topBoss = useMemo(() => data?.top_boss_today || "-", [data]);

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Overview
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              สรุปสถิติและข้อมูลสำคัญของระบบ
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="hidden text-xs text-gray-500 sm:block">
                อัปเดตล่าสุด:{" "}
                {lastUpdated.toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
            <Button
              color="light"
              onClick={() => {
                setRefreshing(true);
                fetchData();
              }}
              disabled={refreshing}
              aria-busy={refreshing}
            >
              {refreshing && <Spinner size="sm" className="mr-2" />}
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4">
            <AlertComponent type="failure" message={error} />
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="ผู้ใช้งาน"
              value={totalUsers.toLocaleString()}
              subtitle={`+${newToday.toLocaleString()} วันนี้`}
              gradient="from-indigo-500 via-blue-500 to-emerald-500"
            />
            <StatCard
              title="ห้อง Raid"
              value={totalRooms.toLocaleString()}
              subtitle={`+${roomsToday.toLocaleString()} วันนี้`}
              gradient="from-sky-500 via-blue-500 to-indigo-500"
            />
            <StatCard
              title="รายงานค้าง"
              value={pendingReports}
              subtitle="ต้องตรวจสอบ"
              gradient="from-rose-500 via-red-500 to-orange-500"
              valueClass="text-red-600 dark:text-red-400"
            />
            <StatCard
              title="รีวิวทั้งหมด"
              value={totalReviews.toLocaleString()}
              gradient="from-fuchsia-500 via-purple-500 to-violet-500"
            />
            <StatCard
              title="การแจ้งเตือน"
              value={totalNoti.toLocaleString()}
              gradient="from-amber-500 via-orange-500 to-rose-500"
            />
            <StatCard
              title="บอสยอดนิยมวันนี้"
              value={topBoss}
              gradient="from-emerald-500 via-teal-500 to-cyan-500"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Quick Actions
          </div>
          <div className="flex flex-wrap gap-2">
            <Button color="light" onClick={() => navigate("/admin/users")}>
              จัดการผู้ใช้
            </Button>
            <Button color="light" onClick={() => navigate("/admin/raidrooms")}>
              จัดการห้อง Raid
            </Button>
            <Button color="light" onClick={() => navigate("/admin/raidboss")}>
              จัดการบอส
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
