import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Avatar, // ใช้สำหรับรูปเพื่อน
} from "flowbite-react";
import {
  HiExclamationCircle,
  HiFlag,
  HiShieldCheck,
  HiUsers, // ไอคอนเพื่อน
  HiClock,
  HiLogin,
  HiUserAdd,
  HiStatusOnline,
  HiCube,
  HiOutlineDocumentAdd,
  HiOutlineCheck,
  HiOutlineRefresh,
  HiReply,
  HiX,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import { AlertComponent } from "../../../component/alert";
import { formatDate } from "../../../component/functions/formatDate";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

/* ======================= Types (ตรงกับ API PHP) ======================= */

// 1. Profile
type UserProfile = {
  id: number;
  email: string;
  username: string;
  avatar?: string | null;
  friend_code?: string | null;
  team?: "Instinct" | "Mystic" | "Valor" | null;
  level?: number | null;
  status?: "active" | "banned" | null;
  role?: "member" | "admin" | null;
  created_at?: string | null;
  plan?: "free" | "premium" | null;
};

// 2. Stats
type UserStats = {
  host_rating: number;
  total_hosted: number;
  total_reviews_received: number;
  total_friends: number; // ✅ เพิ่มจำนวนเพื่อน
};

// 3. Reviews Received
type ReviewItem = {
  id: number;
  room_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  room_boss?: string | null;
  reviewer_name?: string | null;
};

// 4. Reports
type ReportItem = {
  id: number;
  reason: string;
  status: string;
  created_at: string;
};

// 5. Timeline
type TimelineItem = {
  source: "system" | "raid" | "host";
  action: string;
  detail: string;
  target?: string | null;
  time: string;
};

// 6. Friendship (NEW)
type FriendItem = {
  id: number;
  username: string;
  avatar?: string | null;
  team?: "Instinct" | "Mystic" | "Valor" | null;
  level?: number | null;
  became_friend_at: string;
};

// API Response Structure
type ApiData = {
  profile: UserProfile;
  stats: UserStats;
  reports: {
    received: ReportItem[];
    written: ReportItem[];
    pending: ReportItem[];
  };
  reviews_received: ReviewItem[];
  timeline: TimelineItem[];
  friends: FriendItem[]; // ✅ เพิ่ม friends array
};

type ApiResponse = {
  success: boolean;
  data: ApiData;
  message?: string;
};

/* ======================= Helpers ======================= */
const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-pink-500",
];

const TEAM_COLORS: Record<string, string> = {
  Instinct: "text-yellow-400 bg-yellow-50 border-yellow-200",
  Mystic: "text-blue-500 bg-blue-50 border-blue-200",
  Valor: "text-red-500 bg-red-50 border-red-200",
};

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

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getInitial(name?: string | null, id?: number) {
  const base = (name && name.trim()) || (id ? String(id) : "?");
  return base.charAt(0).toUpperCase();
}

function formatFriendCode(v?: string | null) {
  if (!v) return "-";
  const digits = v.replace(/\D/g, "").slice(0, 12);
  return digits ? digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim() : "-";
}

function StarRating({
  value = 0,
  size = 16,
}: {
  value?: number | null;
  size?: number;
}) {
  const v = Math.max(0, Math.min(5, Number(value ?? 0)));
  const stars = new Array(5).fill(0).map((_, i) => {
    const idx = i + 1;
    let fill = "none";
    if (v >= idx) fill = "currentColor";
    else if (v > i && v < idx) fill = "url(#grad)";
    return (
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 20 20"
        className="inline-block"
      >
        <defs>
          <linearGradient id="grad">
            <stop offset={`${(v - i) * 100}%`} stopColor="currentColor" />
            <stop offset={`${(v - i) * 100}%`} stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.954L10 0l2.949 5.956 6.56.954-4.754 4.634 1.122 6.545z"
          fill={fill}
          stroke="currentColor"
        />
      </svg>
    );
  });
  return <span className="text-yellow-400">{stars}</span>;
}

function UserAvatar({
  src,
  username,
  id,
  size = 64,
}: {
  src?: string | null;
  username?: string | null;
  id?: number;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <img
        src={src}
        alt={username || "avatar"}
        className="rounded-full object-cover ring-1 ring-gray-200"
        style={style}
      />
    );
  }
  const key = username?.toLowerCase() || `user_${id ?? 0}`;
  const color = AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length];
  return (
    <div
      className={`${color} flex items-center justify-center rounded-full font-semibold text-white uppercase ring-1 ring-black/10`}
      title={username || (id ? `#${id}` : "user")}
      style={style}
    >
      {getInitial(username, id)}
    </div>
  );
}

/* ======================= Page ======================= */
export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiData | null>(null);

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
      case "leave":
        return { color: "failure", icon: HiX, label: "ออกจากห้อง" };
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
      case "report":
        return { color: "info", icon: HiOutlineInformationCircle, label: "รายงาน" };
      default:
        return { color: "light", icon: HiClock, label: action };
    }
  };

  const statusReportColor: Record<
    string,
    "warning" | "info" | "success" | "red" | "gray"
  > = {
    pending: "warning",
    reviewed: "info",
    resolved: "success",
  };

  const statusReportName: Record<
    string,
    "รอการตรวจสอบ" | "ตรวจสอบแล้ว" | "แก้ไขแล้ว" | "ยกเลิก"
  > = {
    pending: "รอการตรวจสอบ",
    reviewed: "ตรวจสอบแล้ว",
    resolved: "แก้ไขแล้ว",
  };

  async function fetchDetail() {
    if (!id) {
      setError("ไม่พบรหัสผู้ใช้");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";
      // เปลี่ยนกลับเป็น by_id.php ตามที่ generate ให้
      const url = `${API_BASE}/api/admin/users/by_id.php?user_id=${encodeURIComponent(id)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      const json: ApiResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || `Server Error ${res.status}`);
      }

      setData(json.data);
    } catch (e) {
      setError(getErrorMessage(e) || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-screen-xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
              รายละเอียดผู้ใช้
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ข้อมูลโปรไฟล์ สถิติการเป็น Host เพื่อน และประวัติการใช้งาน
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button color="light" size="sm" onClick={() => fetchDetail()}>
              รีเฟรช
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/admin/users/edit/${id}`)}
            >
              แก้ไข
            </Button>
            <Button color="gray" size="sm" onClick={() => navigate(-1)}>
              กลับ
            </Button>
          </div>
        </div>

        {error && <AlertComponent type="failure" message={error} />}

        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ⚠️ Warning Card */}
            {data.reports.pending.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                <HiExclamationCircle className="mt-0.5 h-6 w-6 shrink-0" />
                <div>
                  <h4 className="font-bold">
                    ผู้ใช้นี้ถูกรายงาน {data.reports.pending.length} ครั้ง
                  </h4>
                  <p className="mt-1 text-sm">
                    โปรดตรวจสอบรายละเอียดในส่วน "ประวัติการรายงาน" ด้านล่าง
                  </p>
                </div>
              </div>
            )}

            {/* Top Cards Grid (4 Columns) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {/* Card 1: User Profile */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start gap-4">
                  <UserAvatar
                    src={data.profile.avatar}
                    username={data.profile.username}
                    id={data.profile.id}
                    size={72}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                        {data.profile.username}
                      </h4>
                      {data.profile.status && (
                        <Badge
                          color={
                            data.profile.status === "active"
                              ? "success"
                              : "failure"
                          }
                        >
                          {data.profile.status}
                        </Badge>
                      )}
                      {data.profile.role === "admin" && (
                        <Badge color="purple">Admin</Badge>
                      )}
                    </div>
                    <div className="text-sm break-all text-gray-500 dark:text-gray-400">
                      {data.profile.email}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {data.profile.team && (
                        <span
                          className={`rounded border px-2 py-0.5 text-xs font-bold ${TEAM_COLORS[data.profile.team] || "bg-gray-100 text-gray-600"}`}
                        >
                          Team {data.profile.team}
                        </span>
                      )}
                      {data.profile.plan === "premium" && (
                        <span className="rounded bg-gradient-to-r from-amber-200 to-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900">
                          Premium
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Friend Code</div>
                        <div className="font-medium dark:text-white">
                          {formatFriendCode(data.profile.friend_code)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Level</div>
                        <div className="font-medium dark:text-white">
                          {data.profile.level || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Host Stats */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                  <HiShieldCheck className="text-blue-500" /> สถิติ Host
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
                    <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                      {data.stats.total_hosted}
                    </div>
                    <div className="text-xs text-gray-400">สร้างห้อง</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
                    <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                      {data.stats.total_reviews_received}
                    </div>
                    <div className="text-xs text-gray-400">รีวิวที่ได้</div>
                  </div>
                </div>
              </div>

              {/* Card 3: Friends & Rating */}
              <div className="grid grid-rows-2 gap-4">
                {/* Rating */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    <div className="text-xs text-gray-500">Host Rating</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-500">
                        {data.stats.host_rating.toFixed(1)}
                      </span>
                      <StarRating value={data.stats.host_rating} size={16} />
                    </div>
                  </div>
                </div>
                {/* Friends Count */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div>
                    <div className="text-xs text-gray-500">เพื่อนทั้งหมด</div>
                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      {data.stats.total_friends}
                    </div>
                  </div>
                  <HiUsers className="h-8 w-8 text-teal-100 dark:text-teal-900" />
                </div>
              </div>
            </div>

            {/* --- Table: Reviews --- */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  รีวิวที่ได้รับล่าสุด
                </h4>
                <Badge color="gray">{data.reviews_received.length}</Badge>
              </div>

              {/* Mobile View */}
              <div className="block space-y-3 p-4 md:hidden">
                {data.reviews_received.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">
                    ไม่มีข้อมูลรีวิว
                  </div>
                ) : (
                  data.reviews_received.map((rv) => (
                    <div
                      key={rv.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StarRating value={rv.rating} size={14} />
                          <span className="font-bold text-gray-900 dark:text-white">
                            {rv.rating}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(rv.created_at)}
                        </span>
                      </div>
                      {rv.comment && (
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                          {rv.comment}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">โดย:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {rv.reviewer_name || "Anonymous"}
                          </span>
                        </div>
                        {rv.room_boss && (
                          <Button
                            color="light"
                            className="w-fit"
                            size="xs"
                            onClick={() =>
                              navigate(`/admin/raidrooms/detail/${rv.room_id}`)
                            }
                          >
                            {rv.room_boss}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHead>
                    <TableHeadCell className="w-[150px]">คะแนน</TableHeadCell>
                    <TableHeadCell>ความคิดเห็น</TableHeadCell>
                    <TableHeadCell>จากห้อง</TableHeadCell>
                    <TableHeadCell>โดย</TableHeadCell>
                    <TableHeadCell className="text-right">วันที่</TableHeadCell>
                  </TableHead>
                  <TableBody className="divide-y">
                    {data.reviews_received.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-6 text-center text-gray-500"
                        >
                          ไม่มีข้อมูลรีวิว
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.reviews_received.map((rv) => (
                        <TableRow
                          key={rv.id}
                          className="bg-white dark:bg-gray-800"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                              <StarRating value={rv.rating} size={14} />
                              {rv.rating}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="line-clamp-1 text-gray-600 dark:text-gray-300">
                              {rv.comment || "-"}
                            </p>
                          </TableCell>
                          <TableCell>
                            {rv.room_boss ? (
                              <Button
                                color="light"
                                className="w-fit"
                                size="xs"
                                onClick={() =>
                                  navigate(
                                    `/admin/raidrooms/detail/${rv.room_id}`,
                                  )
                                }
                              >
                                {rv.room_boss}
                              </Button>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {rv.reviewer_name || "Anonymous"}
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap text-gray-500">
                            {formatDate(rv.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* --- Table: Reports --- */}
            {(data.reports.received.length > 0 ||
              data.reports.written.length > 0) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm dark:border-red-900 dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b border-red-100 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/30">
                    <h4 className="flex items-center gap-2 font-bold text-red-700 dark:text-red-300">
                      <HiFlag /> ประวัติถูกรายงาน
                    </h4>
                    <Badge color="failure">
                      {data.reports.received.length}
                    </Badge>
                  </div>
                  <div className="max-h-[300px] space-y-3 overflow-y-auto p-4">
                    {data.reports.received.length === 0 ? (
                      <p className="text-sm text-gray-500">ไม่เคยถูกรายงาน</p>
                    ) : (
                      data.reports.received.map((rp) => {
                        return (
                          <div
                            key={rp.id}
                            className="rounded border border-red-100 bg-red-50/50 p-3 text-sm dark:border-red-900/50 dark:bg-red-900/10"
                          >
                            <div className="mb-1 flex justify-between">
                              <div className="flex gap-4">
                                <span className="font-bold text-red-600">
                                  #{rp.id}
                                </span>
                                <div className="flex-wrap">
                                  <Badge
                                    size="xs"
                                    color={
                                      statusReportColor[rp.status] ?? "gray"
                                    }
                                  >
                                    {statusReportName[rp.status]}
                                  </Badge>
                                </div>
                              </div>

                              <span className="text-xs text-gray-500">
                                {formatDate(rp.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">
                              {rp.reason}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-4 dark:bg-gray-700">
                    <h4 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
                      <HiExclamationCircle /> ประวัติการแจ้งปัญหา
                    </h4>
                    <Badge color="gray">{data.reports.written.length}</Badge>
                  </div>
                  <div className="max-h-[300px] space-y-3 overflow-y-auto p-4">
                    {data.reports.written.length === 0 ? (
                      <p className="text-sm text-gray-500">ไม่เคยแจ้งปัญหา</p>
                    ) : (
                      data.reports.written.map((rp) => (
                        <div
                          key={rp.id}
                          className="rounded border border-gray-100 bg-gray-50 p-3 text-sm dark:border-gray-600 dark:bg-gray-700/50"
                        >
                          <div className="mb-1 flex justify-between">
                            <span className="font-bold text-gray-600 dark:text-gray-300">
                              Target #{rp.id}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(rp.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {rp.reason}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- Section: Friends List (NEW) --- */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
                <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                  <HiUsers className="text-teal-500" /> รายชื่อเพื่อน
                </h4>
                <Badge color="success">{data.friends.length}</Badge>
              </div>

              <div className="p-4">
                {data.friends.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">
                    ไม่มีเพื่อนในรายการ
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {data.friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-100 bg-white p-3 transition hover:shadow-md dark:border-gray-600 dark:bg-gray-700"
                        onClick={() =>
                          navigate(`/admin/users/detail/${friend.id}`)
                        } // ลิงก์ไปดูเพื่อน
                      >
                        <div className="relative shrink-0">
                          <Avatar
                            img={friend.avatar || undefined}
                            rounded
                            placeholderInitials={friend.username
                              .charAt(0)
                              .toUpperCase()}
                            size="md"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {friend.username}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Lv.{friend.level || "?"}
                            </span>
                            {friend.team && (
                              <span
                                className={`rounded border px-1 text-[10px] ${TEAM_COLORS[friend.team]}`}
                              >
                                {friend.team}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* --- Table: Timeline --- */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  Timeline การใช้งานล่าสุด
                </h4>
                <Badge color="info">{data.timeline.length}</Badge>
              </div>

              {/* Mobile View */}
              <div className="block space-y-3 p-4 md:hidden">
                {data.timeline.map((ac, idx) => {
                  const config = getActionConfig(ac.action);
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700"
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <Badge color={config.color} className="w-fit">
                          {config.label}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(ac.time)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {ac.detail}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHead>
                    <TableHeadCell>กิจกรรม</TableHeadCell>
                    <TableHeadCell>รายละเอียด</TableHeadCell>
                    <TableHeadCell>เป้าหมาย</TableHeadCell>
                    <TableHeadCell>ผ่านมา</TableHeadCell>
                    <TableHeadCell>เวลา</TableHeadCell>
                  </TableHead>
                  <TableBody className="divide-y">
                    {data.timeline.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center">
                          ไม่มีข้อมูล
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.timeline.map((ac, idx) => {
                        const config = getActionConfig(ac.action);
                        return (
                          <TableRow
                            key={idx}
                            className="bg-white dark:bg-gray-800"
                          >
                            <TableCell className="whitespace-nowrap">
                              <Badge color={config.color} className="w-fit">
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {ac.detail}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-500 dark:bg-gray-700">
                                {ac.target || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap text-gray-500">
                              {timeAgo(ac.time)}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap text-gray-500">
                              {formatDate(ac.time)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
