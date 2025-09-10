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
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal";
import { PaginationComponent } from "../../../component/pagination";
import { formatDate } from "../../../component/functions/formatDate";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

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

  const parseDateSafe = (s?: string | null): Date | null => {
    if (!s) return null;
    const normalized = s.includes("T") ? s : s.replace(" ", "T");
    const dt = new Date(normalized);
    return isNaN(dt.getTime()) ? null : dt;
  };

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

  const getCountdown = (start_time: string) => {
    const start = parseDateSafe(start_time);
    if (!start) return { text: "-", color: "gray" as const };
    const diff = start.getTime() - now;
    if (diff <= 0) return { text: "time out", color: "red" as const };
    const color =
      diff <= 5 * 60 * 1000
        ? ("warning" as const)
        : diff <= 60 * 60 * 1000
          ? ("success" as const)
          : ("info" as const);
    return { text: formatDuration(diff), color };
  };

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
      const normalized: RaidRoom[] = items.map((r: RaidRoom) => ({
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
      setTotalPages(Math.max(1, Number(body.pagination?.total_pages) || 1));
    } catch (err) {
      setError(getErrorMessage(err) || "เกิดข้อผิดพลาด");
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
    } catch (e) {
      setError(getErrorMessage(e) || "เกิดข้อผิดพลาดในการลบ");
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
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              ห้องตีบอส
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              จัดการห้องพร้อมนับเวลาถอยหลัง และสถานะล่าสุด
            </p>
          </div>

          {/* Search + Limit */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-2 sm:w-[360px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อบอส / เจ้าของ"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
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

            <div className="flex items-center gap-2 sm:pl-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                แสดงต่อหน้า:
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-lg border px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
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

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {rooms.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              ไม่พบห้อง
            </div>
          ) : null}

          {rooms.map((r) => (
            <div
              key={r.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0"
            >
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400" />
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="min-w-0 font-semibold text-gray-900 dark:text-white">
                    <span className="truncate">{r.boss}</span>
                  </div>
                  <Badge color={r.member_total === r.max_members ? "success" : "info"}>
                    {r.member_total}/{r.max_members}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
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

                  <div className="flex items-center gap-2">
                    <Badge size="sm" color={statusColor[r.status] ?? "gray"}>
                      {r.status}
                    </Badge>
                    <Badge size="sm">{formatDate(r.start_time)}</Badge>
                  </div>

                  <div className="text-xs text-gray-500">
                    สร้างเมื่อ: {formatDate(r.created_at || undefined)}
                  </div>
                </div>

                <div className="mt-3">
                  <Dropdown label="ตัวเลือก" size="xs" dismissOnClick={true}>
                    <DropdownItem onClick={() => navigate(`/admin/raidrooms/raidroomsdetail/${r.id}`)}>
                      ดูข้อมูล
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onClick={() => handleOpenDelete(r.id)}>
                      <span className="text-red-600">ลบ</span>
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
            <Table className="min-w-[980px] table-fixed text-sm">
              <TableHead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-gray-800/90">
                <TableRow>
                  <TableHeadCell className="w-[24%]">บอส</TableHeadCell>
                  <TableHeadCell className="w-[16%]">หัวห้อง</TableHeadCell>
                  <TableHeadCell className="w-[12%]">จำนวนสมาชิก</TableHeadCell>
                  <TableHeadCell className="w-[12%]">สถานะห้อง</TableHeadCell>
                  <TableHeadCell className="w-[16%]">เวลาเริ่ม</TableHeadCell>
                  <TableHeadCell className="w-[12%]">นับถอยหลัง</TableHeadCell>
                  <TableHeadCell className="w-[16%]">สร้างเมื่อ</TableHeadCell>
                  <TableHeadCell className="w-[8%] text-right">จัดการ</TableHeadCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y">
                {rooms.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                      ไม่พบห้อง
                    </TableCell>
                  </TableRow>
                )}

                {rooms.map((r) => {
                  const cd = getCountdown(r.start_time);
                  return (
                    <TableRow
                      key={r.id}
                      className="bg-white transition-colors hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/40"
                    >
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          {r.pokemon_image ? (
                            <img
                              src={r.pokemon_image}
                              alt={r.boss}
                              className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                            />
                          ) : (
                            <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gray-200" />
                          )}
                          <span className="truncate">{r.boss}</span>
                        </div>
                      </TableCell>

                      <TableCell className="truncate">{r.owner_name ?? "-"}</TableCell>

                      <TableCell>
                        <Badge color={r.member_total === r.max_members ? "success" : "info"}>
                          {r.member_total} / {r.max_members}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge size="sm" color={statusColor[r.status] ?? "gray"}>
                          {r.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDate(r.start_time)}
                      </TableCell>

                      <TableCell>
                        <Badge size="sm" color={cd.color}>
                          {cd.text}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDate(r.created_at || undefined)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Dropdown label="เลือก" size="xs" dismissOnClick={true} inline>
                          <DropdownItem onClick={() => navigate(`/admin/raidrooms/raidroomsdetail/${r.id}`)}>
                            ดูข้อมูล
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem onClick={() => handleOpenDelete(r.id)}>
                            <span className="text-red-600">ลบ</span>
                          </DropdownItem>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4">
          <PaginationComponent
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>

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
    </div>
  );
}
