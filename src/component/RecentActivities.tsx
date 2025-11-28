import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Spinner,
} from "flowbite-react";
import { AlertComponent } from "../component/alert";
import { formatDate } from "../component/functions/formatDate";
import { getErrorMessage } from "../component/functions/getErrorMessage";

// ======================= Types =======================
export type Activity = {
  id: number;
  type: string; // "สร้างห้องบอส" | "เข้าร่วมห้องบอส" | "เขียนรีวิว" | "ได้รับรีวิว" | ...
  title?: string | null;
  description?: string | null;
  created_at: string; // "YYYY-MM-DD HH:mm:ss"
  meta?: {
    room_id?: number | null;
    boss?: string | null;
    actor_id?: number | null;
    actor_name?: string | null;
    target_id?: number | null;
    target_name?: string | null;
    rating?: number | null;
    comment?: string | null;
  } | null;
};

// ======================= Helpers =======================
const TYPE_COLOR: Record<
  string,
  NonNullable<React.ComponentProps<typeof Badge>["color"]>
> = {
  สร้างห้องบอส: "success",
  เข้าร่วมห้องบอส: "info",
  เขียนรีวิว: "indigo",
  ได้รับรีวิว: "pink",
  ส่งแชท: "purple",
  เพิ่มเพื่อน: "cyan",
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

function StarRating({
  value = 0,
  size = 14,
}: {
  value?: number | null;
  size?: number;
}) {
  const v = Math.max(0, Math.min(5, Number(value ?? 0)));
  const stars = new Array(5).fill(0).map((_, i) => (
    <svg
      key={i}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className="inline-block"
    >
      <path
        d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.954L10 0l2.949 5.956 6.56.954-4.754 4.634 1.122 6.545z"
        fill={v >= i + 1 ? "currentColor" : "none"}
        stroke="currentColor"
      />
    </svg>
  ));
  return <span className="text-yellow-500">{stars}</span>;
}

// ======================= Component =======================
export default function RecentActivities() {
  const navigate = useNavigate();

  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(10);

  async function fetchActivities() {
    setLoading(true);
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

      const arr: Activity[] = json.data?.activities ?? [];
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const hasData = useMemo(() => items.length > 0, [items]);

  return (
    <div className="mt-8">
      <div className="mx-auto max-w-screen-xxl">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-100">
              กิจกรรมล่าสุด
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              แสดงทุกเหตุการณ์ล่าสุด {limit} รายการ เรียงจากเวลาใหม่สุด
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 10)}
              className="rounded-lg border-gray-300 p-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {[10, 20, 30, 40, 50].map((n) => (
                <option key={n} value={n}>
                  {n} รายการ
                </option>
              ))}
            </select>
            <Button color="light" size="sm" onClick={fetchActivities}>
              รีเฟรช
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <AlertComponent type="failure" message={error} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Spinner />
            <span>กำลังโหลด...</span>
          </div>
        )}

        {!loading && !hasData && (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700">
            ยังไม่มีกิจกรรม
          </div>
        )}

        {!loading && hasData && (
          <>
            {/* มือถือ: การ์ด */}
            <div className="space-y-3 md:hidden">
              {items.map((ac) => {
                const meta = (ac.meta || {}) as Activity["meta"];
                return (
                  <div
                    key={`${ac.type}-${ac.id}`}
                    className="rounded-xl border border-gray-200 p-3 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <Badge color={TYPE_COLOR[ac.type] ?? "gray"}>
                        {ac.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(ac.created_at)}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {ac.title || "-"}
                    </div>
                    {ac.description && (
                      <div className="mt-1 text-sm break-words text-gray-700 dark:text-gray-200">
                        {ac.description}
                      </div>
                    )}

                    {/* Extra row for rating/comment if present */}
                    {(meta?.rating != null || meta?.comment) && (
                      <div className="mt-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <StarRating value={meta?.rating ?? 0} />
                          <span className="text-sm font-semibold">
                            {meta?.rating != null
                              ? Number(meta?.rating).toFixed(1)
                              : "-"}
                          </span>
                        </div>
                        {meta?.comment && (
                          <div className="max-w-[60%] truncate text-sm text-gray-600 dark:text-gray-300">
                            “{meta.comment}”
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      {meta?.room_id && (
                        <Button
                          size="xs"
                          onClick={() =>
                            navigate(`/admin/raidrooms/detail/${meta.room_id}`)
                          }
                        >
                          ดูห้อง #{meta.room_id}
                        </Button>
                      )}
                      {meta?.actor_id && (
                        <Button
                          color="light"
                          size="xs"
                          onClick={() =>
                            navigate(`/admin/users/detail/${meta.actor_id}`)
                          }
                        >
                          ผู้กระทำ
                        </Button>
                      )}
                      {meta?.target_id && (
                        <Button
                          color="gray"
                          size="xs"
                          onClick={() =>
                            navigate(`/admin/users/detail/${meta.target_id}`)
                          }
                        >
                          เป้าหมาย
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* เดสก์ท็อป: ตาราง */}
            <div className="hidden overflow-x-auto md:block">
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
                <Table className="min-w-[980px] table-fixed text-sm">
                  <TableHead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-gray-800/90">
                    <TableRow>
                      <TableHeadCell className="w-[12%]">ประเภท</TableHeadCell>
                      <TableHeadCell className="w-[26%]">หัวข้อ</TableHeadCell>
                      <TableHeadCell>รายละเอียด</TableHeadCell>
                      <TableHeadCell className="w-[18%]">ข้อมูล</TableHeadCell>
                      <TableHeadCell className="w-[18%]">เวลา</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="divide-y">
                    {items.map((ac) => {
                      const meta = (ac.meta || {}) as Activity["meta"];
                      return (
                        <TableRow
                          key={`${ac.type}-${ac.id}`}
                          className="bg-white dark:border-gray-700 dark:bg-gray-800"
                        >
                          <TableCell className="whitespace-nowrap">
                            <Badge color={TYPE_COLOR[ac.type] ?? "gray"}>
                              {ac.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="truncate font-medium">
                              {ac.title || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="truncate">
                              {ac.description || "-"}
                            </div>
                            {(meta?.rating != null || meta?.comment) && (
                              <div className="mt-1 flex items-center gap-2">
                                <StarRating value={meta?.rating ?? 0} />
                                <span className="font-semibold">
                                  {meta?.rating != null
                                    ? Number(meta?.rating).toFixed(1)
                                    : "-"}
                                </span>
                                {meta?.comment && (
                                  <span className="truncate text-gray-500">
                                    “{meta.comment}”
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-wrap items-center gap-2">
                              {meta?.room_id && (
                                <Button
                                  size="xs"
                                  onClick={() =>
                                    navigate(
                                      `/admin/raidrooms/detail/${meta.room_id}`,
                                    )
                                  }
                                >
                                  ห้อง #{meta.room_id}
                                </Button>
                              )}
                              {meta?.actor_id && (
                                <Button
                                  color="light"
                                  size="xs"
                                  onClick={() =>
                                    navigate(
                                      `/admin/users/detail/${meta.actor_id}`,
                                    )
                                  }
                                >
                                  ผู้กระทำ
                                </Button>
                              )}
                              {meta?.target_id && (
                                <Button
                                  color="gray"
                                  size="xs"
                                  onClick={() =>
                                    navigate(
                                      `/admin/users/detail/${meta.target_id}`,
                                    )
                                  }
                                >
                                  เป้าหมาย
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(ac.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
