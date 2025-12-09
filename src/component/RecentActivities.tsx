import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Badge,
  Button,
  Card,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import {
  HiRefresh,
  HiClock,
  HiUser,
  HiLogin,
  HiUserAdd,
  HiStatusOnline,
  HiCube,
  HiOutlineDocumentAdd,
  HiOutlineCheck,
  HiOutlineRefresh,
  HiReply,
  HiUsers,
  HiX,
} from "react-icons/hi";
import { AlertComponent } from "../component/alert";
import { formatDate } from "../component/functions/formatDate";
import { getErrorMessage } from "../component/functions/getErrorMessage";

// ======================= Types =======================
export type Activity = {
  source: string;
  action: string;
  detail: string;
  target: string;
  time: string;
  by: string;
  avatar: string;
};

// ======================= Helpers =======================

function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${Math.max(0, diffSec)} วินาที ที่แล้ว`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาที ที่แล้ว`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชั่วโมง ที่แล้ว`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} เดือนที่แล้ว`;

  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} ปีที่แล้ว`;
}

const getActionConfig = (action: string) => {
  switch (action) {
    case "login":
      return { color: "info", icon: HiLogin, label: "เข้าสู่ระบบ" };
    case "online_lasted":
      return { color: "gray", icon: HiStatusOnline, label: "ออนไลน์" };
    case "join":
      return { color: "indigo", icon: HiCube, label: "เข้าร่วมห้อง" };
    case "create":
      return {
        color: "success",
        icon: HiOutlineDocumentAdd,
        label: "สร้างห้อง",
      };
    case "cancel":
      return { color: "failure", icon: HiX, label: "ยกเลิกห้อง" };
    case "review":
      return { color: "success", icon: HiOutlineCheck, label: "รีวืว" };
    case "update":
      return { color: "info", icon: HiOutlineRefresh, label: "อัปเดต" };
    case "invite":
      return { color: "purple", icon: HiReply, label: "เชิญเพื่อน" };
    case "addfriend":
      return { color: "pink", icon: HiUserAdd, label: "เพิ่มเพื่อน" };
    case "acceptfriend":
      return { color: "warning", icon: HiUsers, label: "รับเพื่อน" };
    case "edit_profile":
      return { color: "warning", icon: HiUserAdd, label: "แก้ไขโปรไฟล์" };
    default:
      return { color: "light", icon: HiClock, label: action };
  }
};

const extractRoomId = (detail: string): string | null => {
  const match = detail.match(/Room #(\d+)/);
  return match ? match[1] : null;
};

function readJsonSafe<T = any>(res: Response): Promise<T | null> {
  return res.text().then((text) => {
    if (!text.trim()) return null;
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Bad JSON: ${text.slice(0, 200)}`);
    }
  });
}

// ======================= Component =======================
export default function RecentActivities() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(10);

  async function fetchActivities() {
    // ถ้าไม่มีข้อมูลเลย ให้ set loading เพื่อโชว์ spinner ตัวใหญ่
    // แต่ถ้ามีข้อมูลอยู่แล้ว (คือการ Refresh) ไม่ต้อง set loading เป็น true ในแง่ UI เพื่อกันกระพริบ
    // หรือ set true ได้ แต่ต้องแก้เงื่อนไขข้างล่าง

    setLoading(true); // ยังคง set true เพื่อให้ปุ่ม Refresh หมุน
    setError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";
      const url = `${API_BASE}/api/admin/activities/recent.php?limit=${encodeURIComponent(limit)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }

      const json = await readJsonSafe<any>(res);
      if (!json?.success)
        throw new Error(json?.message || "โหลดข้อมูลไม่สำเร็จ");

      setItems(
        Array.isArray(json.data?.activities) ? json.data.activities : [],
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(() => setItems((prev) => [...prev]), 60000);
    return () => clearInterval(interval);
  }, [limit]);

  const hasData = useMemo(() => items.length > 0, [items]);

  return (
    <div className="max-w-screen-xxl mx-auto mt-6">
      <Card className="shadow-lg">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              ประวัติกิจกรรมล่าสุด
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ติดตามสถานะ Online, Login, Raid และ Friends
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-32">
              <Select
                sizing="md"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 10)}
              >
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} รายการ
                  </option>
                ))}
              </Select>
            </div>
            <Button color="light" disabled={loading} onClick={fetchActivities}>
              {loading ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <HiRefresh className="mr-2 h-4 w-4" />
              )}
              รีเฟรช
            </Button>
          </div>
        </div>

        {error && <AlertComponent type="failure" message={error} />}

        {/* Loading (Show only initial load) */}
        {/* แก้ไข: โชว์ Spinner ตัวใหญ่เฉพาะตอนโหลดครั้งแรกและยังไม่มีข้อมูล */}
        {loading && !hasData && (
          <div className="flex justify-center py-12">
            <Spinner size="xl" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !hasData && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <HiClock className="mb-2 h-10 w-10 opacity-20" />
            <p>ไม่พบรายการกิจกรรม</p>
          </div>
        )}

        {/* Data Content */}
        {/* แก้ไข: ลบ !loading ออก เพื่อให้แสดงตารางตลอดเวลาที่มีข้อมูล แม้จะกด refresh อยู่ */}
        {hasData && (
          <div
            className={
              loading
                ? "opacity-50 transition-opacity"
                : "opacity-100 transition-opacity"
            }
          >
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHead>
                  <TableHeadCell className="w-2/12">สถานะ</TableHeadCell>
                  <TableHeadCell className="w-3/12">รายละเอียด</TableHeadCell>
                  <TableHeadCell className="w-2/12">เป้าหมาย</TableHeadCell>
                  <TableHeadCell className="w-1/12">ระบบ</TableHeadCell>
                  <TableHeadCell className="w-1/12">ผ่านมาแล้ว</TableHeadCell>
                  <TableHeadCell className="w-1/12">เวลา</TableHeadCell>
                  <TableHeadCell className="w-1/12">โดย</TableHeadCell>
                </TableHead>
                <TableBody className="divide-y">
                  {items.map((ac, index) => {
                    const config = getActionConfig(ac.action);
                    const roomId = extractRoomId(ac.detail);

                    return (
                      <TableRow
                        key={index}
                        className="bg-white dark:border-gray-700 dark:bg-gray-800"
                      >
                        <TableCell>
                          <Badge
                            color={config.color}
                            icon={config.icon}
                            className="w-fit rounded-md"
                          >
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 dark:text-gray-300">
                              {ac.detail}
                            </span>
                            {roomId && (
                              <Button
                                size="xs"
                                color="light"
                                onClick={() =>
                                  navigate(`/admin/raidrooms/detail/${roomId}`)
                                }
                              >
                                #{roomId}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ac.target ? (
                            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                              <HiUser className="text-gray-400" />
                              {ac.target}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-gray-500 uppercase">
                            {ac.source}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium whitespace-nowrap text-gray-500">
                          {timeAgo(ac.time)}
                        </TableCell>
                        <TableCell className="text-xs font-medium whitespace-nowrap text-gray-500">
                          {formatDate(ac.time)}
                        </TableCell>
                        <TableCell className="text-xs font-medium whitespace-nowrap text-gray-500">
                          <div className="mb-2 flex items-center gap-2">
                            <img
                              className="h-6 w-6 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                              src={ac.avatar || "/default_avatar.png"}
                            />
                            <span>{ac.by}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="flex flex-col gap-3 md:hidden">
              {items.map((ac, index) => {
                const config = getActionConfig(ac.action);
                const roomId = extractRoomId(ac.detail);
                return (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <Badge
                        color={config.color}
                        icon={config.icon}
                        className="rounded-md"
                      >
                        {config.label}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-500">
                          {timeAgo(ac.time)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(ac.time)}
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 text-sm text-gray-800 dark:text-gray-200">
                      {ac.detail}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                      {ac.target && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <>
                            <HiUser /> {ac.target}
                          </>
                        </div>
                      )}
                      {roomId && (
                        <Button
                          size="xs"
                          color="light"
                          onClick={() =>
                            navigate(`/admin/raidrooms/detail/${roomId}`)
                          }
                        >
                          ห้อง #{roomId}
                        </Button>
                      )}
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium whitespace-nowrap text-gray-500">
                        <img
                          className="h-6 w-6 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                          src={ac.avatar || "/default_avatar.png"}
                        />
                        <span>{ac.by}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
