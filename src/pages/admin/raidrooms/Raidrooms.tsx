import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  Badge,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal";
import { PaginationComponent } from "../../../component/pagination";

type RaidRoom = {
  id: number;
  boss: string;
  pokemon_image: string | null;
  owner_name: string | null;
  max_members: number;
  status: string;
  start_time: string;
  member_total: number;
  created_at?: string | null;
};

export default function Raidrooms() {
  const [rooms, setRooms] = useState<RaidRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number>(0);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const [search, setSearch] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const alert = location.state?.alert;
  const msg = location.state?.msg;

  // อัปเดตเวลาปัจจุบันทุก 1 วินาที
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // แปลงสตริงวันที่เป็น Date อย่างปลอดภัย
  const parseDateSafe = (s?: string | null): Date | null => {
    if (!s) return null;
    const normalized = s.includes("T") ? s : s.replace(" ", "T");
    const dt = new Date(normalized);
    return isNaN(dt.getTime()) ? null : dt;
  };

  // แปลง ms -> "Xd HH:MM:SS"
  const formatDuration = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return d > 0 ? `${d}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
  };

  // คำนวณข้อความ/สีของ countdown
  const getCountdown = (start_time: string) => {
    const start = parseDateSafe(start_time);
    if (!start) return { text: "-", color: "gray" as const };
    const diff = start.getTime() - now;
    if (diff <= 0) return { text: "time out", color: "red" as const };
    // โค้ดสีตามระยะเวลา: <5 นาที = warning, <60 นาที = info, อื่นๆ = success
    const color =
      diff <= 5 * 60 * 1000
        ? ("warning" as const)
        : diff <= 60 * 60 * 1000
          ? ("success" as const)
          : ("info" as const);
    return { text: formatDuration(diff), color };
  };

  function formatDate(d?: string | null) {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleString("th-TH");
    } catch {
      return d;
    }
  }

  async function fetchRooms() {
    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const url = `${API_BASE}/api/admin/rooms/list.php?page=${page}&limit=${limit}&search=${encodeURIComponent(
        search,
      )}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const body = await res.json();

      if (!body || body.success === false) {
        throw new Error(body?.message || "API error");
      }

      const items = Array.isArray(body.data) ? body.data : [];
      const normalized: RaidRoom[] = items.map((r: any) => ({
        id: Number(r.id) || 0,
        boss: r.boss ?? "-",
        pokemon_image: r.pokemon_image ?? null,
        owner_name: r.owner_name ?? "-",
        max_members: Number(r.max_members) || 0,
        status: r.status ?? "-",
        start_time: r.start_time ?? "-",
        member_total: Number(r.member_total) || 0,
        created_at: r.created_at ?? null,
      }));

      setRooms(normalized);
      setTotal(Number(body.pagination?.total) || 0);
      setTotalPages(Math.max(1, Number(body.pagination?.total_pages) || 1));
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRoom(id: number) {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${API_BASE}/api/admin/rooms/delete.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ id }),
      });

      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.message || `Server returned ${res.status}`);
      }

      setSuccessMsg(body.message || "ลบห้องเรียบร้อยแล้ว");
      await fetchRooms();
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleCloseDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleConfirmDelete = async (id: number) => {
    await deleteRoom(id);
    handleCloseDelete();
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    if (alert && msg) {
      setSuccessMsg(msg);
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
        navigate(location.pathname, { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [alert, msg, navigate, location.pathname]);

  const statusColor: Record<string, string> = {
    active: "success",
    invited: "indigo",
    canceled: "red",
    closed: "gray",
  };

  return (
    <div className="overflow-x-auto p-4">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Raid Rooms
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        จัดการห้อง Raid ที่ผู้ใช้สร้าง
      </p>

      {/* ✅ Search bar (เหมือน Users.tsx) */}
      <div className="my-4 flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อบอส / เจ้าของ"
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
        <Button
          onClick={() => {
            setPage(1);
            fetchRooms();
          }}
        >
          ค้นหา
        </Button>
      </div>

      {/* แถวควบคุมด้านบน (limit + Create) */}
      <div className="m-2 mb-4 flex items-center justify-end">
        <div className="ml-4 flex items-center space-x-4">
          <div>
            {loading && (
              <div className="text-sm text-gray-500">กำลังโหลด...</div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">แสดงต่อหน้า:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded border px-2 py-1 text-gray-600"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div>
            <Button onClick={() => navigate("/admin/raidrooms/add")}>
              Create Room
            </Button>
          </div>
        </div>
      </div>

      {successMsg && show && (
        <div className="mb-4">
          <AlertComponent message={successMsg} type="success" />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <AlertComponent message={error} type="failure" />
        </div>
      )}

      {/* มือถือ: Card View (คงไว้คล้าย Users) */}
      <div className="space-y-3 md:hidden">
        {rooms.length === 0 && !loading ? (
          <div className="rounded border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700">
            ไม่พบห้อง
          </div>
        ) : null}

        {rooms.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">
                {r.boss}
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {r.member_total}/{r.max_members}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                {r.pokemon_image ? (
                  <img
                    src={r.pokemon_image}
                    alt={r.boss}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                )}
                <div className="text-gray-700 dark:text-gray-200">
                  owner: {r.owner_name ?? "-"}
                </div>
              </div>
              <div className="text-gray-700 dark:text-gray-200">
                Created: {formatDate(r.created_at || undefined)}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                size="xs"
                onClick={() => navigate(`/admin/raidrooms/edit/${r.id}`)}
              >
                Edit
              </Button>
              <Button
                size="xs"
                color="red"
                onClick={() => handleOpenDelete(r.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Table (Desktop) */}
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[900px] table-fixed text-sm">
          <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800">
            <TableRow>
              <TableHeadCell>Boss</TableHeadCell>
              <TableHeadCell>Owner</TableHeadCell>
              <TableHeadCell>Players</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Start Time</TableHeadCell>
              <TableHeadCell>Countdown</TableHeadCell>
              <TableHeadCell>Created At</TableHeadCell>
              <TableHeadCell>Action</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {rooms.map((r) => {
              const cd = getCountdown(r.start_time); // ← คำนวณครั้งเดียวต่อแถว
              return (
                <TableRow
                  key={r.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {r.pokemon_image ? (
                        <img
                          src={r.pokemon_image}
                          alt={r.boss}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                      )}
                      <span>{r.boss}</span>
                    </div>
                  </TableCell>

                  <TableCell>{r.owner_name ?? "-"}</TableCell>

                  <TableCell>
                    <Badge
                      color={
                        r.member_total === r.max_members ? "success" : "failure"
                      }
                    >
                      {r.member_total} / {r.max_members}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge size="sm" color={statusColor[r.status] ?? "gray"}>
                      {r.status}
                    </Badge>
                  </TableCell>

                  <TableCell>{r.start_time}</TableCell>

                  {/* ← คอลัมน์ใหม่ Countdown */}
                  <TableCell>
                    <Badge size="sm" color={cd.color}>
                      {cd.text}
                    </Badge>
                  </TableCell>

                  <TableCell>{formatDate(r.created_at || undefined)}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() =>
                          navigate(`/admin/raidrooms/edit/${r.id}`)
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        color="red"
                        outline
                        onClick={() => handleOpenDelete(r.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (เหมือน Users.tsx) */}
      <PaginationComponent
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {/* Modal ยืนยันลบ */}
      {showDeleteModal && (
        <ModalComponent
          header="ยืนยันการลบ"
          msg="คุณต้องการลบห้องนี้หรือไม่?"
          id={deleteId ?? undefined}
          onConfirm={handleConfirmDelete}
          onClose={handleCloseDelete}
        />
      )}
    </div>
  );
}
