// src/pages/admin/notifications/Notifications.tsx
import { useEffect, useState } from "react";
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
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "flowbite-react";
import { useNavigate } from "react-router";
import { AlertComponent } from "../../../component/alert";
import { PaginationComponent } from "../../../component/pagination";
import { formatDate } from "../../../component/functions/formatDate";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

/* ---------- Types ---------- */
type NotificationItem = {
  id: number;
  title: string;
  message: string;
  target: string; // "all" | "user" | "group" | ...
  created_at: string; // "YYYY-MM-DD HH:mm:ss"
  sent_by: string;
};

/* ---------- Page ---------- */
export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState("");

  // Copy success alert
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // View modal
  const [openView, setOpenView] = useState(false);
  const [viewItem, setViewItem] = useState<NotificationItem | null>(null);

  const navigate = useNavigate();

  const targetColor: Record<
    string,
    "info" | "success" | "purple" | "warning" | "gray"
  > = {
    all: "info",
    user: "success",
    group: "purple",
  };

  async function fetchNotifications() {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const url = `${API_BASE}/api/admin/notifications/list.php?page=${page}&limit=${limit}&search=${encodeURIComponent(
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

      const list: NotificationItem[] = Array.isArray(body.data)
        ? body.data.map((n: any) => ({
            id: Number(n.id) || 0,
            title: n.title ?? "-",
            message: n.message ?? "-",
            target: n.target ?? "all",
            created_at: n.created_at ?? null,
            sent_by: n.sent_by ?? "-",
          }))
        : [];

      setItems(list);
      setTotal(Number(body.pagination?.total) || list.length);
      setTotalPages(Math.max(1, Number(body.pagination?.total_pages) || 1));
    } catch (err) {
      setError(getErrorMessage(err) || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  function onOpenView(n: NotificationItem) {
    setViewItem(n);
    setOpenView(true);
  }

  async function onCopyMessage(n: NotificationItem) {
    try {
      await navigator.clipboard.writeText(n.message || "");
      setSuccessMsg("คัดลอกข้อความแล้ว");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch {
      setError("คัดลอกข้อความไม่สำเร็จ");
    }
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              การแจ้งเตือน (Notifications)
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              รายการประกาศ/แจ้งเตือนที่ส่งถึงผู้ใช้
            </p>
          </div>

          {/* Search + Limit */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">

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

            <Button onClick={() => navigate("/admin/notifications/add")} className="sm:ml-2">
              สร้างการแจ้งเตือนใหม่
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && showSuccess && (
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
          {items.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              ไม่พบการแจ้งเตือน
            </div>
          ) : null}

          {items.map((n) => (
            <div
              key={n.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0"
            >
              <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-gray-900 dark:text-white">
                        {n.title}
                      </span>
                      <Badge size="sm" color={targetColor[n.target] ?? "gray"}>
                        {n.target}
                      </Badge>
                    </div>
                    <div className="mt-1 truncate text-xs text-gray-500">
                      ส่งโดย {n.sent_by} • {formatDate(n.created_at)}
                    </div>
                  </div>
                </div>

                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                  {n.message}
                </p>

                <div className="mt-3">
                  <Dropdown label="ตัวเลือก" size="xs" dismissOnClick>
                    <DropdownItem onClick={() => onOpenView(n)}>
                      ดูรายละเอียด
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onClick={() => onCopyMessage(n)}>
                      คัดลอกข้อความ
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
                  <TableHeadCell className="w-[26%]">Title</TableHeadCell>
                  <TableHeadCell className="w-[42%]">Message</TableHeadCell>
                  <TableHeadCell className="w-[10%]">Target</TableHeadCell>
                  <TableHeadCell className="w-[12%]">Created At</TableHeadCell>
                  <TableHeadCell className="w-[10%] text-right">
                    Action
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-gray-500"
                    >
                      ไม่พบการแจ้งเตือน
                    </TableCell>
                  </TableRow>
                )}

                {items.map((n) => (
                  <TableRow
                    key={n.id}
                    className="bg-white transition-colors hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/40"
                  >
                    <TableCell>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{n.title}</div>
                        <div className="truncate text-xs text-gray-500">
                          ส่งโดย {n.sent_by}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[560px] truncate">{n.message}</div>
                    </TableCell>
                    <TableCell>
                      <Badge size="sm" color={targetColor[n.target] ?? "gray"}>
                        {n.target}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(n.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dropdown
                        label="ตัวเลือก"
                        size="xs"
                        dismissOnClick
                        inline
                      >
                        <DropdownItem onClick={() => onOpenView(n)}>
                          ดูรายละเอียด
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem onClick={() => onCopyMessage(n)}>
                          คัดลอกข้อความ
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

        {/* View modal */}
        <Modal show={openView} onClose={() => setOpenView(false)}>
          <ModalHeader>รายละเอียดการแจ้งเตือน</ModalHeader>
          <ModalBody>
            {viewItem ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {viewItem.title}
                  </span>
                  <Badge
                    size="sm"
                    color={targetColor[viewItem.target] ?? "gray"}
                  >
                    {viewItem.target}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  ส่งโดย {viewItem.sent_by} • {formatDate(viewItem.created_at)}
                </div>
                <div className="rounded-md bg-gray-50 p-3 text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                  {viewItem.message}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">ไม่มีข้อมูล</div>
            )}
          </ModalBody>
          <ModalFooter>
            {viewItem && (
              <Button color="light" onClick={() => onCopyMessage(viewItem)}>
                คัดลอกข้อความ
              </Button>
            )}
          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
}
