import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router"; // ใช้ react-router ตามที่ขอ
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "flowbite-react";

// Component เหล่านี้สมมติว่ามีอยู่แล้วตามโค้ดต้นฉบับของคุณ
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal";
import { PaginationComponent } from "../../../component/pagination";
import { formatDate } from "../../../component/functions/formatDate";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

/* ---------- Types ---------- */
type EventData = {
  id: number;
  title: string;
  description: string;
  image?: string | null;
  created_at?: string | null;
  created_by?: number | null;
};

/* ---------- Helpers: รูปภาพ Event ---------- */
function EventImage({
  src,
  title,
  size = "sm",
}: {
  src?: string | null;
  title: string;
  size?: "sm" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-20 w-32" : "h-10 w-16";

  if (src) {
    return (
      <img
        src={src}
        alt={title}
        className={`${sizeClass} rounded border border-gray-200 object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded border border-gray-200 bg-gray-100 text-xs text-gray-400`}
    >
      No Image
    </div>
  );
}

/* ---------- Page ---------- */
export default function Events() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState("");

  // Alert & Modal States
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const alertState = location.state?.alert; // เปลี่ยนชื่อตัวแปรไม่ให้ชนกับฟังก์ชัน alert
  const msgState = location.state?.msg;

  // ✅ Fetch Events
  async function fetchEvents() {
    setLoading(true);
    setError(null);

    try {
      // ใช้ VITE_API_BASE ถ้ามี หรือใช้ URL เต็ม
      const API_BASE =
        import.meta.env.VITE_API_BASE || "http://localhost/pogopartyth";
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token"); // เช็ค key ให้ตรงกับระบบคุณ

      // หมายเหตุ: PHP ฝั่ง Backend ควรรับ parameter page, limit, search ด้วย
      const url = `${API_BASE}/api/admin/events/list.php?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;

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

      // Normalize Data
      const items = Array.isArray(body.data) ? body.data : [];
      const normalized: EventData[] = items.map((e: any) => ({
        id: Number(e.id),
        title: e.title ?? "-",
        description: e.description ?? "",
        image: e.image ?? null,
        created_at: e.created_at ?? null,
        created_by: e.created_by ? Number(e.created_by) : null,
      }));

      setEvents(normalized);
      // รับค่า Pagination จาก API (ถ้ามี) ถ้าไม่มีให้คำนวณคร่าวๆ
      setTotal(Number(body.pagination?.total) || items.length);
      setTotalPages(Math.max(1, Number(body.pagination?.total_pages) || 1));
    } catch (err) {
      setError(getErrorMessage(err) || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Delete Event
  async function deleteEvent(id: number) {
    try {
      setLoading(true);
      const API_BASE =
        import.meta.env.VITE_API_BASE || "http://localhost/pogopartyth";
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/admin/events/delete.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ id }),
      });

      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body?.message || "ลบไม่สำเร็จ");
      }

      setSuccessMsg(body.message || "ลบกิจกรรมเรียบร้อยแล้ว");
      await fetchEvents(); // โหลดข้อมูลใหม่
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    } catch (e) {
      setError(getErrorMessage(e) || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Handlers
  const handleOpenDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const handleCloseDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };
  const handleConfirmDelete = async (id: number) => {
    await deleteEvent(id);
    handleCloseDelete();
  };

  // ✅ Effects
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    if (alertState && msgState) {
      setSuccessMsg(msgState);
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        // Clear state location
        navigate(location.pathname, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertState, msgState, navigate, location.pathname]);

  /* ---------- UI ---------- */
  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xxl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              กิจกรรม (Events)
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              จัดการข่าวสารและกิจกรรมภายในแอปพลิเคชัน
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {/* Search Box */}
            <div className="flex w-full items-center gap-2 sm:w-[360px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาหัวข้อกิจกรรม..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
              <Button
                onClick={() => {
                  setPage(1);
                  fetchEvents();
                }}
              >
                ค้นหา
              </Button>
            </div>

            {/* Limit Select */}
            <div className="flex items-center gap-2 sm:pl-2">
              <label className="hidden text-sm text-gray-600 sm:block dark:text-gray-300">
                แสดง:
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-lg border px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Create Button */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate("/admin/events/add")}
                className="sm:ml-2"
              >
                สร้างกิจกรรม
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

        {/* Mobile Cards View */}
        <div className="space-y-3 md:hidden">
          {events.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              ไม่พบกิจกรรม
            </div>
          ) : null}

          {events.map((ev) => (
            <div
              key={ev.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {ev.image && (
                <img
                  src={ev.image}
                  alt={ev.title}
                  className="h-32 w-full object-cover"
                />
              )}
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="w-3/4 truncate font-semibold text-gray-900 dark:text-white">
                    {ev.title}
                  </h4>
                  <span className="text-xs text-gray-500">#{ev.id}</span>
                </div>

                <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {ev.description}
                </p>

                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                  <span className="text-xs text-gray-500">
                    {formatDate(ev.created_at)}
                  </span>
                  <Dropdown
                    label="จัดการ"
                    size="xs"
                    dismissOnClick
                    color="gray"
                  >
                    <DropdownItem
                      onClick={() => navigate(`/admin/events/edit/${ev.id}`)}
                    >
                      แก้ไข
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onClick={() => handleOpenDelete(ev.id)}>
                      <span className="text-red-600">ลบ</span>
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <Table className="min-w-[900px] table-fixed text-sm">
              <TableHead className="bg-gray-50 dark:bg-gray-700">
                <TableRow>
                  <TableHeadCell className="w-[10%]">รูปภาพ</TableHeadCell>
                  <TableHeadCell className="w-[25%]">หัวข้อ</TableHeadCell>
                  <TableHeadCell className="w-[30%]">รายละเอียด</TableHeadCell>
                  <TableHeadCell className="w-[12%]">วันที่สร้าง</TableHeadCell>
                  <TableHeadCell className="w-[8%] text-right">
                    Action
                  </TableHeadCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y">
                {events.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-gray-500"
                    >
                      ไม่พบข้อมูลกิจกรรม
                    </TableCell>
                  </TableRow>
                )}

                {events.map((ev) => (
                  <TableRow
                    key={ev.id}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <TableCell>
                      <EventImage src={ev.image} title={ev.title} />
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div className="truncate">{ev.title}</div>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      <div className="truncate">{ev.description}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(ev.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dropdown label="เลือก" size="xs" dismissOnClick inline>
                        <DropdownItem
                          onClick={() =>
                            navigate(`/admin/events/edit/${ev.id}`)
                          }
                        >
                          แก้ไข
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem onClick={() => handleOpenDelete(ev.id)}>
                          <span className="text-red-600">ลบ</span>
                        </DropdownItem>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
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

        {/* Summary */}
        <div className="mt-3 text-right text-xs text-gray-500">
          รวมทั้งหมด {total} รายการ
        </div>

        {/* Modal ยืนยันลบ */}
        {showDeleteModal && (
          <ModalComponent
            header="ยืนยันการลบ"
            msg="คุณต้องการลบกิจกรรมนี้หรือไม่?"
            id={deleteId ?? undefined}
            onConfirm={handleConfirmDelete}
            onClose={handleCloseDelete}
          />
        )}
      </div>
    </div>
  );
}
