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
  TextInput,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal";
import { PaginationComponent } from "../../../component/pagination";
import { formatDate } from "../../../component/functions/formatDate";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

/* ---------- Types ---------- */
type RaidBoss = {
  id: number;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_image?: string | null;
  pokemon_tier: string | number;
  start_date?: string | null; // "YYYY-MM-DD HH:mm:ss"
  end_date?: string | null; // "YYYY-MM-DD HH:mm:ss"
  created_at?: string | null;
};

/* ---------- Helpers: วันที่ & สถานะ ---------- */
function parseLocalDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
function isActiveByNow(
  start?: string | null,
  end?: string | null,
  now = new Date(),
): boolean {
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  if (!s || !e) return false;
  return now >= s && now <= e;
}

/* ---------- Avatar fallback (ตัวอักษรแรก + สีคงที่) ---------- */
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
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function getInitial(name?: string | null, id?: number) {
  const base = (name && name.trim()) || (id ? String(id) : "?");
  return base.charAt(0).toUpperCase();
}
function MonAvatar({
  src,
  name,
  id,
  size = 8, // 8=2rem
}: {
  src?: string | null;
  name?: string | null;
  id?: number;
  size?: 8 | 10;
}) {
  const sizeCls = size === 10 ? "h-10 w-10 text-base" : "h-8 w-8 text-sm";
  if (src) {
    return (
      <img
        src={src}
        alt={name || (id ? `#${id}` : "pokemon")}
        className={`${sizeCls} rounded-full object-cover ring-1 ring-gray-200`}
      />
    );
  }
  const key = name?.toLowerCase() || `mon_${id ?? 0}`;
  const color = AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length];
  return (
    <div
      className={`${sizeCls} ${color} flex items-center justify-center rounded-full font-semibold text-white uppercase ring-1 ring-black/10`}
      title={name || (id ? `#${id}` : "pokemon")}
    >
      {getInitial(name, id)}
    </div>
  );
}

/* ---------- Page ---------- */
export default function RaidBosses() {
  const [bosses, setBosses] = useState<RaidBoss[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number>(0);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const [search, setSearch] = useState("");

  // External API fetch states
  const [externalUrl, setExternalUrl] = useState(
    "https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.json",
  );
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState<string | null>(null);
  const [extMons, setExtMons] = useState<any[]>([]);
  const [importStart, setImportStart] = useState<string>("");
  const [importEnd, setImportEnd] = useState<string>("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const alert = location.state?.alert;
  const msg = location.state?.msg;

  async function fetchBosses() {
    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const url = `${API_BASE}/api/admin/raidboss/list.php?page=${page}&limit=${limit}&search=${encodeURIComponent(
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
      const normalized: RaidBoss[] = items.map((b: RaidBoss) => ({
        id: Number(b.id) || 0,
        pokemon_id: Number(b.pokemon_id) || 0,
        pokemon_name: b.pokemon_name ?? "-",
        pokemon_image: b.pokemon_image ?? null,
        pokemon_tier: b.pokemon_tier ?? "-",
        start_date: b.start_date ?? null,
        end_date: b.end_date ?? null,
        created_at: b.created_at ?? null,
      }));

      setBosses(normalized);
      setTotal(Number(body.pagination?.total) || 0);
      setTotalPages(Math.max(1, Number(body.pagination?.total_pages) || 1));
    } catch (err) {
      setError(getErrorMessage(err) || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBoss(id: number) {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${API_BASE}/api/admin/raidboss/delete.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ id }),
      });

      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body?.message || `Server returned ${res.status}`);
      }

      setSuccessMsg(body.message || "ลบ Raid Boss เรียบร้อยแล้ว");
      await fetchBosses();
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
    await deleteBoss(id);
    handleCloseDelete();
  };

  useEffect(() => {
    fetchBosses();
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

  /* ---------- UI ---------- */
  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              บอส (Raid Boss)
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              จัดการข้อมูล Raid Boss พร้อมสถานะตามช่วงเวลาเริ่ม/สิ้นสุด
            </p>
          </div>

          {/* Search + Limit + Create */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-2 sm:w-[360px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา ชื่อโปเกม่อน / Pokemon ID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
              <Button
                onClick={() => {
                  setPage(1);
                  fetchBosses();
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

            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate("/admin/raidboss/add")}
                className="sm:ml-2"
              >
                สร้างบอสใหม่
              </Button>
            </div>
          </div>
        </div>

        {/* Import from external API */}
        <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <TextInput
              type="text"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="URL ของ API (ตัวอย่าง JSON)"
              className="w-full rounded-lg border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />

            <div className="flex items-center gap-2">
              <TextInput
                type="date"
                value={importStart}
                onChange={(e) => setImportStart(e.target.value)}
                className="rounded-lg px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                title="Start date/time for imported raids"
              />
              <TextInput
                type="date"
                value={importEnd}
                onChange={(e) => setImportEnd(e.target.value)}
                className="rounded-lg px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                title="End date/time for imported raids"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                color="yellow"
                onClick={async () => {
                  if (!externalUrl) return setExtError("กรุณาใส่ URL ของ API");
                  setExtLoading(true);
                  setExtError(null);
                  setExtMons([]);
                  try {
                    const res = await fetch(externalUrl, { cache: "no-store" });
                    if (!res.ok) throw new Error(`API returned ${res.status}`);
                    const data = await res.json();
                    if (!Array.isArray(data))
                      throw new Error("รูปแบบข้อมูลต้องเป็นอาเรย์");
                    const mapped = data.map((it: any, idx: number) => ({
                      name: it.name ?? it.pokemon_name ?? `#${idx}`,
                      tier: it.tier ?? it.pokemon_tier ?? "-",
                      image: it.image ?? it.pokemon_image ?? null,
                      types: Array.isArray(it.types) ? it.types : [],
                      raw: it,
                    }));
                    setExtMons(mapped);
                  } catch (e: any) {
                    setExtError(
                      typeof e === "string"
                        ? e
                        : (e?.message ?? "เกิดข้อผิดพลาดในการเรียก API"),
                    );
                  } finally {
                    setExtLoading(false);
                  }
                }}
              >
                {extLoading ? "กำลังดึง..." : "ตัวอย่าง"}
              </Button>

              <Button
                color="green"
                onClick={async () => {
                  if (extMons.length === 0)
                    return setExtError("ยังไม่มีข้อมูลสำหรับนำเข้า");
                  setExtLoading(true);
                  setExtError(null);
                  try {
                    const API_BASE = import.meta.env.VITE_API_BASE;
                    const token = localStorage.getItem("auth_token") || "";
                    const res = await fetch(
                      `${API_BASE}/api/admin/raidboss/import_from_url.php`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({
                          url:
                            externalUrl ||
                            "https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.json",
                          start_date: importStart || null,
                          end_date: importEnd || null,
                        }),
                      },
                    );
                    const body = await res.json();
                    if (!res.ok || body.success === false)
                      throw new Error(body.message || `Server ${res.status}`);
                    // show result counts if provided
                    const inserted = Number(body.inserted ?? 0);
                    const skipped = Math.max(0, extMons.length - inserted);
                    setSuccessMsg(
                      `${body.message || "นำเข้าข้อมูลสำเร็จ"} — เพิ่ม: ${inserted} / ข้าม: ${skipped}`,
                    );
                    setShow(true);
                    setTimeout(() => setShow(false), 4000);
                    fetchBosses();
                  } catch (e: any) {
                    setExtError(e?.message ?? "นำเข้าไม่สำเร็จ");
                  } finally {
                    setExtLoading(false);
                  }
                }}
              >
                นำเข้า
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
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

        {/* External API preview */}
        {extError && (
          <div className="mb-4">
            <AlertComponent message={extError} type="failure" />
          </div>
        )}
        {extMons.length > 0 && (
          <div className="mb-4 rounded-lg bg-white p-3 text-sm dark:bg-gray-800 dark:text-gray-100 border border-gray-200">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-medium">
                ตัวอย่างข้อมูลจาก API ({extMons.length})
              </div>
              <div className="text-xs text-gray-500">
                (ยังไม่ได้บันทึกลงระบบ)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {extMons.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 border border-gray-300 rounded p-2"
                >
                  <MonAvatar src={m.image || undefined} name={m.name} id={i} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">
                      {String(m.tier)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {bosses.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              ไม่พบบอส
            </div>
          ) : null}

          {bosses.map((b) => {
            const active = isActiveByNow(b.start_date, b.end_date);
            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0"
              >
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500" />
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <MonAvatar
                        src={b.pokemon_image}
                        name={b.pokemon_name}
                        id={b.pokemon_id}
                        size={10}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900 dark:text-white">
                          {b.pokemon_name}{" "}
                          <span className="text-xs text-gray-500">
                            #{b.pokemon_id}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs">
                          <Badge size="sm">{String(b.pokemon_tier)}</Badge>
                          <Badge size="sm" color={active ? "success" : "gray"}>
                            {active ? "ใช้งาน" : "ไม่ใช้งาน"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                      เริ่ม:{" "}
                      <span className="font-medium">
                        {formatDate(b.start_date)}
                      </span>
                    </div>
                    <div>
                      สิ้นสุด:{" "}
                      <span className="font-medium">
                        {formatDate(b.end_date)}
                      </span>
                    </div>
                    <div className="col-span-2">
                      สร้างเมื่อ:{" "}
                      <span className="font-medium">
                        {formatDate(b.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Dropdown label="เลือก" size="xs" dismissOnClick>
                      <DropdownItem
                        onClick={() => navigate(`/admin/raidboss/edit/${b.id}`)}
                      >
                        แก้ไข
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem onClick={() => handleOpenDelete(b.id)}>
                        <span className="text-red-600">ลบ</span>
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
            <Table className="min-w-[980px] table-fixed text-sm">
              <TableHead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-gray-800/90">
                <TableRow>
                  <TableHeadCell className="w-[28%]">โปเกม่อน</TableHeadCell>
                  <TableHeadCell className="w-[10%]">ระดับ</TableHeadCell>
                  <TableHeadCell className="w-[16%]">
                    วันที่เริ่มต้น
                  </TableHeadCell>
                  <TableHeadCell className="w-[16%]">
                    วันที่สิ้นสุด
                  </TableHeadCell>
                  <TableHeadCell className="w-[12%]">สถานะ</TableHeadCell>
                  <TableHeadCell className="w-[14%]">สร้างเมื่อ</TableHeadCell>
                  <TableHeadCell className="w-[8%]">จัดการ</TableHeadCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y">
                {bosses.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      ไม่พบบอส
                    </TableCell>
                  </TableRow>
                )}

                {bosses.map((b) => {
                  const active = isActiveByNow(b.start_date, b.end_date);
                  return (
                    <TableRow
                      key={b.id}
                      className="bg-white transition-colors hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/40"
                    >
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          <MonAvatar
                            src={b.pokemon_image}
                            name={b.pokemon_name}
                            id={b.pokemon_id}
                          />
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {b.pokemon_name}
                            </div>
                            <div className="truncate text-xs text-gray-500">
                              #{b.pokemon_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{String(b.pokemon_tier)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(b.start_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(b.end_date)}
                      </TableCell>

                      <TableCell>
                        <Badge size="sm" color={active ? "success" : "gray"}>
                          {active ? "ใช้งาน" : "ไม่ใช้งาน"}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDate(b.created_at)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Dropdown label="เลือก" size="xs" dismissOnClick inline>
                          <DropdownItem
                            onClick={() =>
                              navigate(`/admin/raidboss/edit/${b.id}`)
                            }
                          >
                            แก้ไข
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem onClick={() => handleOpenDelete(b.id)}>
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
            msg="คุณต้องการลบ Raid Boss นี้หรือไม่?"
            id={deleteId ?? undefined}
            onConfirm={handleConfirmDelete}
            onClose={handleCloseDelete}
          />
        )}

        {/* Summary */}
        <div className="mt-3 text-right text-xs text-gray-500">
          รวมทั้งหมด {total} รายการ
        </div>
      </div>
    </div>
  );
}
