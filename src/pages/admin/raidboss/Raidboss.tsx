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
  Select,
  Checkbox,
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
  type?: string | null;
  special?: boolean;
  cp_normal_min?: number | null;
  cp_normal_max?: number | null;
  cp_boost_min?: number | null;
  cp_boost_max?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
};

// Type สำหรับตัวที่จะ Import
type ImportMon = {
  name: string;
  tier: string | number;
  image?: string | null;
  types?: string[];
  raw: any;
  selected: boolean;
};

/* ---------- Helpers ---------- */
function parseLocalDate(s?: string | null): Date | null {
  if (!s) return null;
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/* ---------- Avatar ---------- */
const AVATAR_COLORS = [
  "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500",
  "bg-teal-500", "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
  "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
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
  size = 8,
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
  const [extMons, setExtMons] = useState<ImportMon[]>([]); 
  const [importStart, setImportStart] = useState<string>("");
  const [importEnd, setImportEnd] = useState<string>("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Time Status State
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();
  const location = useLocation();
  const alert = location.state?.alert;
  const msg = location.state?.msg;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      if (!body || body.success === false) throw new Error(body?.message || "API error");

      const items = Array.isArray(body.data) ? body.data : [];
      const normalized: RaidBoss[] = items.map((b: RaidBoss) => ({
        id: Number(b.id) || 0,
        pokemon_id: Number(b.pokemon_id) || 0,
        pokemon_name: b.pokemon_name ?? "-",
        pokemon_image: b.pokemon_image ?? null,
        pokemon_tier: b.pokemon_tier ?? "-",
        type: b.type ?? null,
        special: b.special ?? null,
        cp_normal_min: b.cp_normal_min ?? null,
        cp_normal_max: b.cp_normal_max ?? null,
        cp_boost_min: b.cp_boost_min ?? null,
        cp_boost_max: b.cp_boost_max ?? null,
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
      if (!res.ok || body.success === false) throw new Error(body?.message || `Server returned ${res.status}`);
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

  const handleOpenDelete = (id: number) => { setDeleteId(id); setShowDeleteModal(true); };
  const handleCloseDelete = () => { setShowDeleteModal(false); setDeleteId(null); };
  const handleConfirmDelete = async (id: number) => { await deleteBoss(id); handleCloseDelete(); };

  useEffect(() => { fetchBosses(); }, [page, limit]);

  useEffect(() => {
    if (alert && msg) {
      setSuccessMsg(msg);
      setShow(true);
      const timer = setTimeout(() => { setShow(false); navigate(location.pathname, { replace: true }); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert, msg, navigate, location.pathname]);

  const getTimeStatus = (start?: string | null, end?: string | null) => {
    const s = parseLocalDate(start);
    const e = parseLocalDate(end);
    if (!s || !e) return { status: "inactive", label: "ไม่ใช้งาน", color: "failure" };
    if (currentTime >= s && currentTime <= e) return { status: "active", label: "ใช้งาน", color: "success" };
    if (currentTime < s) {
      const diff = s.getTime() - currentTime.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      let timerText = "";
      if (days > 0) timerText += `${days}ว `;
      if (hours > 0) timerText += `${hours}ชม. `;
      timerText += `${minutes}น. ${seconds}วิ`;
      return { status: "upcoming", label: `เริ่มใน ${timerText}`, color: "warning" };
    }
    return { status: "ended", label: "จบแล้ว/ไม่ใช้งาน", color: "failure" };
  };

  /* ---------- IMPORT LOGIC ---------- */
  const handleFetchPreview = async () => {
    if (!externalUrl) return setExtError("กรุณาใส่ URL ของ API");
    setExtLoading(true);
    setExtError(null);
    setExtMons([]);
    try {
      const res = await fetch(externalUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("รูปแบบข้อมูลต้องเป็นอาเรย์");
      
      const mapped: ImportMon[] = data.map((it: any, idx: number) => ({
        name: it.name ?? it.pokemon_name ?? `#${idx}`,
        tier: it.tier ?? it.pokemon_tier ?? "-",
        image: it.image ?? it.pokemon_image ?? null,
        types: Array.isArray(it.types) ? it.types : [],
        raw: it,
        selected: true,
      }));
      setExtMons(mapped);
    } catch (e: any) {
      setExtError(typeof e === "string" ? e : (e?.message ?? "เกิดข้อผิดพลาดในการเรียก API"));
    } finally {
      setExtLoading(false);
    }
  };

  const toggleImportSelection = (index: number) => {
    setExtMons(prev => prev.map((m, i) => i === index ? { ...m, selected: !m.selected } : m));
  };

  const toggleAllSelection = (select: boolean) => {
    setExtMons(prev => prev.map(m => ({ ...m, selected: select })));
  };

  const handleImportSubmit = async () => {
    const selectedItems = extMons.filter(m => m.selected);
    if (selectedItems.length === 0) return setExtError("กรุณาเลือกอย่างน้อย 1 ตัว");
    
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
            data: selectedItems.map(m => m.raw), 
            start_date: importStart || null,
            end_date: importEnd || null,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok || body.success === false) throw new Error(body.message || `Server ${res.status}`);
      
      setSuccessMsg(`${body.message || "นำเข้าข้อมูลสำเร็จ"} (${selectedItems.length} รายการ)`);
      setShow(true);
      setTimeout(() => setShow(false), 4000);
      setExtMons([]);
      fetchBosses();
    } catch (e: any) {
      setExtError(e?.message ?? "นำเข้าไม่สำเร็จ");
    } finally {
      setExtLoading(false);
    }
  };
  /* -------------------------------------- */

  return (
    <div className="p-4">
      <div className="max-w-screen-xxl mx-auto">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">บอส (Raid Boss)</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">จัดการข้อมูล Raid Boss พร้อมระบบนับถอยหลัง</p>
            </div>
             <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
             <div className="flex w-full items-center gap-2 sm:w-[360px]">
               <input
                 type="text"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="ค้นหา..."
                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
               />
               <Button onClick={() => { setPage(1); fetchBosses(); }}>ค้นหา</Button>
             </div>

             {/* LIMIT SELECTOR กลับมาแล้วตรงนี้ */}
             <div className="flex items-center gap-2 sm:pl-2">
                <label className="text-sm text-gray-600 dark:text-gray-300">แสดงต่อหน้า:</label>
                <div className="w-20">
                  <Select value={limit} onChange={(e) => setLimit(Number(e.target.value))} sizing="md">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </Select>
                </div>
             </div>

             <div className="flex items-center gap-2">
               <Button onClick={() => navigate("/admin/raidboss/add")} className="sm:ml-2">สร้างบอสใหม่</Button>
             </div>
           </div>
        </div>

        {/* --- SECTION IMPORT --- */}
        <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <TextInput
              type="text"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="URL ของ API (ตัวอย่าง JSON)"
              className="w-full flex-1"
            />
            <div className="flex items-center gap-2">
              <TextInput type="date" value={importStart} onChange={(e) => setImportStart(e.target.value)} title="Start Date"/>
              <TextInput type="date" value={importEnd} onChange={(e) => setImportEnd(e.target.value)} title="End Date"/>
            </div>
            <div className="flex items-center gap-2">
              <Button color="yellow" onClick={handleFetchPreview} disabled={extLoading}>
                {extLoading ? "โหลด..." : "ดึงข้อมูล"}
              </Button>
            </div>
          </div>

          {extError && <div className="mt-3"><AlertComponent message={extError} type="failure" /></div>}

          {extMons.length > 0 && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:bg-gray-900">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  พบข้อมูล {extMons.length} รายการ — เลือก: <span className="text-blue-600 font-bold">{extMons.filter(m => m.selected).length}</span> รายการ
                </div>
                <div className="flex gap-2">
                  <Button size="xs" color="light" onClick={() => toggleAllSelection(true)}>เลือกทั้งหมด</Button>
                  <Button size="xs" color="light" onClick={() => toggleAllSelection(false)}>ไม่เลือกเลย</Button>
                  <Button 
                    size="sm" 
                    color="green" 
                    onClick={handleImportSubmit} 
                    disabled={extLoading || extMons.filter(m => m.selected).length === 0}
                  >
                     {extLoading ? "กำลังนำเข้า..." : `ยืนยันนำเข้า`}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 max-h-[400px] overflow-y-auto p-1">
                {extMons.map((m, i) => (
                  <div 
                    key={i}
                    onClick={() => toggleImportSelection(i)}
                    className={`
                        cursor-pointer relative flex flex-col items-center rounded-lg border p-3 transition-all select-none
                        ${m.selected 
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500" 
                            : "border-gray-200 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                        }
                    `}
                  >
                    <div className="absolute right-2 top-2 pointer-events-none">
                        <Checkbox checked={m.selected} readOnly />
                    </div>
                    <div className="mb-2">
                        <MonAvatar src={m.image || undefined} name={m.name} id={i} size={8} />
                    </div>
                    <div className="text-center w-full min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={m.name}>
                            {m.name}
                        </div>
                        <div className="text-xs text-gray-500">Tier: {m.tier}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {successMsg && show && <div className="mb-4"><AlertComponent message={successMsg} type="success" /></div>}
        {error && <div className="mb-4"><AlertComponent message={error} type="failure" /></div>}

        <div className="mb-4 flex justify-end text-sm text-gray-500 dark:text-gray-400">
          จำนวนทั้งหมด {total} รายการ
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {bosses.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">ไม่พบบอส</div>
          ) : null}

          {bosses.map((b) => {
            const { label, color } = getTimeStatus(b.start_date, b.end_date);
            return (
              <div key={b.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500" />
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <MonAvatar src={b.pokemon_image} name={b.pokemon_name} id={b.pokemon_id} size={10} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900 dark:text-white">
                          {b.pokemon_name} <span className="text-xs text-gray-500">#{b.pokemon_id}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                          <Badge size="sm">{String(b.pokemon_tier)}</Badge>
                          <Badge size="sm" color={color}>{label}</Badge>
                          {b.type && <Badge size="sm" color="indigo">{b.type}</Badge>}
                          {b.special && <Badge size="sm" color="green">Special</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <div>เริ่ม: <span className="font-medium">{formatDate(b.start_date)}</span></div>
                    <div>สิ้นสุด: <span className="font-medium">{formatDate(b.end_date)}</span></div>
                  </div>
                  <div className="mt-3">
                    <Dropdown label="เลือก" size="xs" dismissOnClick>
                      <DropdownItem onClick={() => navigate(`/admin/raidboss/edit/${b.id}`)}>แก้ไข</DropdownItem>
                      <DropdownDivider />
                      <DropdownItem onClick={() => handleOpenDelete(b.id)}><span className="text-red-600">ลบ</span></DropdownItem>
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
                  <TableHeadCell className="w-[15%]">โปเกม่อน</TableHeadCell>
                  <TableHeadCell className="w-[8%]">ระดับ</TableHeadCell>
                  <TableHeadCell className="w-[12%]">ประเภท</TableHeadCell>
                  <TableHeadCell className="w-[12%]">Special</TableHeadCell>
                  <TableHeadCell className="w-[14%]">วันที่เริ่มต้น</TableHeadCell>
                  <TableHeadCell className="w-[14%]">วันที่สิ้นสุด</TableHeadCell>
                  <TableHeadCell className="w-[12%]">สถานะ</TableHeadCell>
                  <TableHeadCell className="w-[12%]">สร้างเมื่อ</TableHeadCell>
                  <TableHeadCell className="w-[8%]">จัดการ</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {bosses.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-gray-500">ไม่พบบอส</TableCell></TableRow>
                )}
                {bosses.map((b) => {
                  const { label, color } = getTimeStatus(b.start_date, b.end_date);
                  const colortype = b.type === "normal" ? "gray" : b.type === "mega" ? "pink" : b.type === "gigantamax" ? "red" : b.type === "dynamax" ? "red" : b.type === "shadow" ? "purple" : "indigo";
                  return (
                    <TableRow key={b.id} className="bg-white transition-colors hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/40">
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2">
                          <MonAvatar src={b.pokemon_image} name={b.pokemon_name} id={b.pokemon_id} />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{b.pokemon_name}</div>
                            <div className="truncate text-xs text-gray-500">#{b.pokemon_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{String(b.pokemon_tier)}</TableCell>
                      <TableCell>{b.type && <Badge size="sm" color={colortype}>{b.type}</Badge>}</TableCell>
                      <TableCell className="whitespace-nowrap"><Badge size="sm" color={b.special ? "green" : "gray"}>{b.special ? "Special" : "-"}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(b.start_date)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(b.end_date)}</TableCell>
                      <TableCell><Badge size="sm" color={color}>{label}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(b.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Dropdown label="เลือก" size="xs" dismissOnClick inline>
                          <DropdownItem onClick={() => navigate(`/admin/raidboss/edit/${b.id}`)}>แก้ไข</DropdownItem>
                          <DropdownDivider />
                          <DropdownItem onClick={() => handleOpenDelete(b.id)}><span className="text-red-600">ลบ</span></DropdownItem>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-4">
          <PaginationComponent currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
        </div>
        {showDeleteModal && (
          <ModalComponent header="ยืนยันการลบ" msg="คุณต้องการลบ Raid Boss นี้หรือไม่?" id={deleteId ?? undefined} onConfirm={handleConfirmDelete} onClose={handleCloseDelete} />
        )}
      </div>
    </div>
  );
}