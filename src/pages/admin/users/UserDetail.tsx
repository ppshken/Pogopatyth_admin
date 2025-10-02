import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router"; // ✅ แก้เป็น react-router-dom
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { formatDate } from "../../../component/functions/formatDate";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

/* ======================= Types ======================= */
type UserBase = {
  id: number;
  email: string;
  username: string;
  friend_code?: string | null;
  level?: number | null;
  status?: string | null;
  created_at?: string | null;
  avatar?: string | null;
};

type UserStats = {
  rooms_owned?: number;
  rooms_joined?: number;
  reviews_count?: number;
  avg_rating?: number;
  reviews_received_avg?: number;
  last_active_at?: string | null;
};

type UserReview = {
  id: number;
  room_id?: number | null;
  rating: number;
  comment?: string | null;
  created_at?: string | null;
  room_boss?: string | null;
};

type UserActivity = {
  id?: number | string;
  type: string;
  title?: string;
  description?: string | null;
  created_at: string;
  meta?: Record<string, unknown>;
};

type ApiOKMinimal = { success: true; data: UserBase };
type ApiOKExtended = {
  success: true;
  data: {
    user: UserBase;
    stats?: UserStats | null;
    reviews?: UserReview[] | null;
    activities?: UserActivity[] | null;
  };
};
type ApiResponse = ApiOKMinimal | ApiOKExtended;

/* ======================= Helpers ======================= */
const AVATAR_COLORS = [
  "bg-rose-500","bg-orange-500","bg-amber-500","bg-lime-500","bg-emerald-500",
  "bg-teal-500","bg-cyan-500","bg-sky-500","bg-blue-500","bg-indigo-500",
  "bg-violet-500","bg-purple-500","bg-fuchsia-500","bg-pink-500",
];
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
function calcAvg(reviews?: UserReview[] | null): number | null {
  if (!reviews || reviews.length === 0) return null;
  const vals = reviews.map((r) => Number(r.rating)).filter((n) => !Number.isNaN(n));
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** ⭐ แสดงดาว 0..5 รองรับทศนิยม */
function StarRating({ value = 0, size = 16 }: { value?: number | null; size?: number }) {
  const v = Math.max(0, Math.min(5, Number(value ?? 0)));
  const stars = new Array(5).fill(0).map((_, i) => {
    const idx = i + 1;
    let fill = "none";
    if (v >= idx) fill = "currentColor";
    else if (v > i && v < idx) fill = "url(#grad)";
    return (
      <svg key={i} width={size} height={size} viewBox="0 0 20 20" className="inline-block">
        <defs>
          {/* ใช้ id เดียวกันในแต่ละ SVG โอเคเพราะ scope แยกกัน */}
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
  return <span className="text-yellow-500">{stars}</span>;
}

/** Avatar: ถ้าไม่มีรูป → ตัวอักษรแรก + สี */
function UserAvatar({
  src, username, id, size = 64,
}: { src?: string | null; username?: string | null; id?: number; size?: number; }) {
  const style = { width: size, height: size }; // ✅ ใช้ style แทนคลาสไดนามิก
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

  const [user, setUser] = useState<UserBase | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);

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
      const url = `${API_BASE}/api/admin/users/by_id.php?user_id=${encodeURIComponent(id)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      // ป้องกัน JSON ว่าง/เสีย
      const text = await res.text();
      const json: ApiResponse = text ? JSON.parse(text) : ({} as any);

      if (!res.ok || !(json as any)?.success) {
        const msg = (json as any)?.message || `Server returned ${res.status}`;
        throw new Error(msg);
      }

      if ("user" in (json as ApiOKExtended).data) {
        const j = json as ApiOKExtended;
        setUser(j.data.user);
        setStats(j.data.stats ?? null);
        setReviews(Array.isArray(j.data.reviews) ? j.data.reviews : []);
        setActivities(Array.isArray(j.data.activities) ? j.data.activities : []);
      } else {
        setUser((json as ApiOKMinimal).data as UserBase);
        setStats(null);
        setReviews([]);
        setActivities([]);
      }
    } catch (e) {
      setError(getErrorMessage(e) || "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const avgRating = useMemo<number | null>(() => {
    if (stats?.reviews_received_avg != null) return Number(stats.reviews_received_avg);
    return calcAvg(reviews);
  }, [stats?.reviews_received_avg, reviews]);

  const TypeColor: Record<string, string> = {
    เข้าร่วมห้องบอส: "info",
    เขียนรีวิว: "indigo",
    ได้รับรีวิว: "pink",
    สร้างห้องบอส: "success",
  };

  return (
    <div className="p-3 sm:p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 sm:text-2xl">
              รายละเอียดผู้ใช้
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              ข้อมูลโปรไฟล์ สถิติการใช้งาน รีวิว และกิจกรรมล่าสุดของผู้ใช้
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button color="light" size="sm" onClick={() => fetchDetail()}>
              รีเฟรช
            </Button>
            <Button size="sm" onClick={() => navigate(`/admin/users/edit/${id}`)}>
              แก้ไข
            </Button>
            <Button color="gray" size="sm" onClick={() => navigate(-1)}>
              กลับ
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4">
            <AlertComponent type="failure" message={error} />
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 sm:h-28" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 sm:h-28" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 sm:h-28" />
            </div>
          </div>
        )}

        {!loading && user && (
          <>
            {/* Top cards */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
              {/* Card: User */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start gap-3">
                  <UserAvatar src={user.avatar} username={user.username} id={user.id} size={64} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                        {user.username} <span className="text-xs text-gray-500">#{user.id}</span>
                      </h4>
                      {user.status && (
                        <Badge color={user.status === "active" ? "success" : "failure"}>
                          {user.status}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 break-all">
                      {user.email}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Friend Code</div>
                        <div className="font-medium dark:text-white">
                          {formatFriendCode(user.friend_code)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Level</div>
                        <div className="font-medium dark:text-white">{user.level ?? "-"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500 dark:text-gray-400">สร้างเมื่อ</div>
                        <div className="font-medium dark:text-white">
                          {formatDate(user.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Stats */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-2 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  สถิติการใช้งาน
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center sm:gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="text-xs text-gray-500">ห้องที่สร้าง</div>
                    <div className="text-lg font-bold dark:text-white sm:text-xl">
                      {stats?.rooms_owned ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="text-xs text-gray-500">ห้องที่เข้าร่วม</div>
                    <div className="text-lg font-bold dark:text-white sm:text-xl">
                      {stats?.rooms_joined ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="text-xs text-gray-500">จำนวนรีวิว</div>
                    <div className="text-lg font-bold dark:text-white sm:text-xl">
                      {stats?.reviews_count ?? reviews.length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <div className="text-xs text-gray-500">ใช้งานครั้งล่าสุด</div>
                    <div className="text-sm font-medium dark:text-white">
                      {formatDate(stats?.last_active_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Rating */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h4 className="mb-2 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  เรตติ้งโดยรวม
                </h4>
                <div className="flex items-center gap-3">
                  <StarRating value={avgRating ?? 0} size={18} />
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">
                    {avgRating != null ? avgRating.toFixed(2) : "—"}/5
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  อิงจาก {stats?.reviews_count ?? reviews.length} รีวิว
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  รีวิวของผู้ใช้
                </h4>
                <div className="text-sm text-gray-500">
                  รวม {stats?.reviews_count ?? reviews.length} รายการ
                </div>
              </div>

              {/* ✅ มือถือ: แสดงเป็นการ์ด */}
              <div className="space-y-3 md:hidden dark:text-white">
                {reviews.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">ยังไม่มีรีวิว</div>
                ) : (
                  reviews.map((rv) => (
                    <div
                      key={rv.id}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <StarRating value={rv.rating} size={14} />
                          <span className="text-sm font-semibold">
                            {Number(rv.rating).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(rv.created_at)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium">
                        {rv.room_boss ?? (rv.room_id ? `Room #${rv.room_id}` : "-")}
                      </div>
                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-200 break-words">
                        {rv.comment || "-"}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="xs"
                          disabled={!rv.room_id}
                          onClick={() =>
                            rv.room_id && navigate(`/admin/raidrooms/detail/${rv.room_id}`)
                          }
                        >
                          ดูข้อมูล
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* เดสก์ท็อป: Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[720px] table-fixed text-sm">
                  <TableHead>
                    <TableRow>
                      <TableHeadCell className="w-[12%]">คะแนน</TableHeadCell>
                      <TableHeadCell className="w-[24%]">ห้อง/บอส</TableHeadCell>
                      <TableHeadCell>ความคิดเห็น</TableHeadCell>
                      <TableHeadCell className="w-[18%]">วันที่</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="divide-y">
                    {reviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-gray-500">
                          ยังไม่มีรีวิว
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviews.map((rv) => (
                        <TableRow key={rv.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <StarRating value={rv.rating} size={14} />
                              <span className="font-semibold">
                                {Number(rv.rating).toFixed(1)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {rv.room_boss ?? (rv.room_id ? `Room #${rv.room_id}` : "-")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="truncate">{rv.comment || "-"}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {formatDate(rv.created_at)}
                              <Button
                                size="sm"
                                disabled={!rv.room_id}
                                onClick={() =>
                                  rv.room_id && navigate(`/admin/raidrooms/detail/${rv.room_id}`)
                                }
                              >
                                ดูข้อมูล
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Activities */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  การเคลื่อนไหวล่าสุด
                </h4>
                <div className="text-sm text-gray-500">รวม {activities.length} รายการ</div>
              </div>

              {/* ✅ มือถือ: การ์ด */}
              <div className="space-y-3 md:hidden dark:text-white">
                {activities.length === 0 ? (
                  <div className="py-6 text-center text-gray-500">ยังไม่มีข้อมูลการเคลื่อนไหว</div>
                ) : (
                  activities.map((ac) => (
                    <div
                      key={`${ac.type}-${ac.id ?? ac.created_at}`}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <Badge color={TypeColor[ac.type] ?? "gray"}>{ac.type}</Badge>
                        <span className="text-xs text-gray-500">{formatDate(ac.created_at)}</span>
                      </div>
                      <div className="text-sm font-medium">{ac.title || "-"}</div>
                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-200 break-words">
                        {ac.description || "-"}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="xs"
                          disabled={!ac.meta || !(ac.meta as any).room_id}
                          onClick={() =>
                            (ac.meta as any)?.room_id &&
                            navigate(`/admin/raidrooms/detail/${(ac.meta as any).room_id}`)
                          }
                        >
                          ดูข้อมูล
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* เดสก์ท็อป: Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="min-w-[720px] table-fixed text-sm">
                  <TableHead>
                    <TableRow>
                      <TableHeadCell className="w-[16%]">ประเภท</TableHeadCell>
                      <TableHeadCell className="w-[24%]">หัวข้อ</TableHeadCell>
                      <TableHeadCell>รายละเอียด</TableHeadCell>
                      <TableHeadCell className="w-[18%]">เวลา</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="divide-y">
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-gray-500">
                          ยังไม่มีข้อมูลการเคลื่อนไหว
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((ac) => (
                        <TableRow key={`${ac.type}-${ac.id ?? ac.created_at}`}>
                          <TableCell className="whitespace-nowrap">
                            <Badge color={TypeColor[ac.type] ?? "gray"}>{ac.type}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="truncate">{ac.title || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <div className="truncate">{ac.description || "-"}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {formatDate(ac.created_at)}
                              <Button
                                size="sm"
                                disabled={!ac.meta || !(ac.meta as any).room_id}
                                onClick={() =>
                                  (ac.meta as any)?.room_id &&
                                  navigate(`/admin/raidrooms/detail/${(ac.meta as any).room_id}`)
                                }
                              >
                                ดูข้อมูล
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
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
