import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableHead,
  TableHeadCell,
  TableRow,
  TableBody,
  TableCell,
  Button,
  TextInput,
  Modal,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal"; // ใช้สำหรับ confirm อื่นๆ ถ้าต้องการ

type RaidBoss = {
  id: number;
  pokemon_id: number;
  pokemon_name: string;
  pokemon_image: string;
  pokemon_tier: string | number;
  start_date: string; // "YYYY-MM-DD HH:mm:ss"
  end_date: string;   // "YYYY-MM-DD HH:mm:ss"
  created_at: string;
};

export default function RaidBosses() {
  const [bosses, setBosses] = useState<RaidBoss[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // modal แก้ไข
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<RaidBoss | null>(null);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  function toInputValue(s?: string) {
    // "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm"
    if (!s) return "";
    return s.replace(" ", "T").slice(0, 16);
  }
  function fromInputValue(s?: string) {
    // "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DD HH:mm:ss"
    if (!s) return "";
    const [d, t] = s.split("T");
    return `${d} ${t.length === 5 ? t + ":00" : t}`;
  }
  function formatDate(d: string) {
    try {
      return new Date(d.replace(" ", "T")).toLocaleString("th-TH");
    } catch {
      return d;
    }
  }

  async function fetchBosses() {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        `${API_BASE}/api/admin/raidboss/list.php?page=${page}&limit=${limit}&search=${encodeURIComponent(
          search || ""
        )}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "API error");

      // สมมติ response: { success, data: [..], pagination: { total, total_pages } }
      setBosses(body.data || []);
      setTotal(body.pagination?.total || 0);
      setTotalPages(body.pagination?.total_pages || 1);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBosses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);



  return (
    <div className="overflow-x-auto p-4">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Raid Bosses
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        จัดการข้อมูล Raid Boss (แก้ไขง่ายๆ ผ่าน Modal)
      </p>

      {/* Search & Create */}
      <div className="my-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TextInput
            placeholder="ค้นหาชื่อโปเกม่อน / Pokemon ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => fetchBosses()}>ค้นหา</Button>
        </div>
        <Button onClick={() => navigate("/admin/raidboss/add")}>
          Create Raid Boss
        </Button>
      </div>

      {successMsg && (
        <div className="mb-4">
          <AlertComponent message={successMsg} type="success" />
        </div>
      )}
      {error && (
        <div className="mb-4">
          <AlertComponent message={error} type="failure" />
        </div>
      )}

      {/* Mobile: Card View */}
      <div className="space-y-3 md:hidden">
        {bosses.length === 0 && !loading ? (
          <div className="rounded border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700">
            ไม่พบบอส
          </div>
        ) : null}

        {bosses.map((b) => (
          <div
            key={b.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">
                {b.pokemon_name} <span className="text-xs text-gray-500">#{b.pokemon_id}</span>
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                Tier: {b.pokemon_tier}
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2">
              {b.pokemon_image ? (
                <img
                  src={b.pokemon_image}
                  alt={b.pokemon_name}
                  className="h-10 w-10 rounded object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-gray-100" />
              )}
              <div className="text-xs text-gray-600 dark:text-gray-300">
                เริ่ม: {formatDate(b.start_date)}<br />
                สิ้นสุด: {formatDate(b.end_date)}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              สร้างเมื่อ: {formatDate(b.created_at)}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button color="green" size="xs" onClick={() => navigate(`/admin/raidboss/edit/${b.id}`)}>
                View
              </Button>
              <Button size="xs">
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block">
        <Table className="min-w-[900px]">
          <TableHead>
            <TableRow>
              <TableHeadCell>Pokemon</TableHeadCell>
              <TableHeadCell>Tier</TableHeadCell>
              <TableHeadCell>Start</TableHeadCell>
              <TableHeadCell>End</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Action</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bosses.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img
                      src={b.pokemon_image}
                      alt={b.pokemon_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{b.pokemon_name}</span>
                      <span className="text-xs text-gray-500">#{b.pokemon_id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{b.pokemon_tier}</TableCell>
                <TableCell>{formatDate(b.start_date)}</TableCell>
                <TableCell>{formatDate(b.end_date)}</TableCell>
                <TableCell>{formatDate(b.created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button color="green" onClick={() => navigate(`/admin/raidboss/edit/${b.id}`)}>
                      View
                    </Button>
                    <Button>Edit</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">รวม {total} บอส</span>
        <div className="flex items-center gap-2">
          <Button disabled={page <= 1} onClick={() => setPage((s) => s - 1)}>
            ก่อนหน้า
          </Button>
          <span>
            หน้า {page} / {totalPages || 1}
          </span>
          <Button disabled={page >= totalPages} onClick={() => setPage((s) => s + 1)}>
            ถัดไป
          </Button>
        </div>
      </div>
    </div>
  );
}
