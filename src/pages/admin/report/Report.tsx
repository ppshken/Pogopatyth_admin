// src/pages/admin/reports/Reports.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Button,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { PaginationComponent } from "../../../component/pagination";
import { formatDate } from "../../../component/functions/formatDate";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

type ReportItem = {
  id: number;
  report_type: "room" | "user" | "review" | string;
  target_id: number | null;
  reporter_id: number | null;
  reason: string | null;
  status: "pending" | "reviewing" | "resolved" | "rejected" | string;
  created_at: string | null; // "YYYY-MM-DD HH:mm:ss"
  updated_at: string | null;
  // (อาจไม่มีจาก API ล่าสุด แต่เผื่อไว้ ถ้าอนาคตเพิ่ม JOIN)
  reporter_name?: string | null;
  target_label?: string | null;
};

export default function Reports() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number>(0);

  // search & filters
  const [search, setSearch] = useState("");
  const [reportType, setReportType] = useState<string>(""); // room/user/review/…
  const [status, setStatus] = useState<string>(""); // pending/reviewing/resolved/rejected
  const [reporterId, setReporterId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");

  // modal: view
  const [openView, setOpenView] = useState(false);
  const [viewItem, setViewItem] = useState<ReportItem | null>(null);

  // feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();

  const statusColor: Record<string, "warning" | "info" | "success" | "red" | "purple" | "gray"> = {
    pending: "warning",
    reviewing: "info",
    resolved: "success",
    rejected: "red",
  };

  const typeColor: Record<string, "purple" | "info" | "gray"> = {
    room: "purple",
    user: "info",
    review: "gray",
  };

  async function fetchReports() {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";

      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (search.trim()) qs.set("search", search.trim());
      if (reportType) qs.set("report_type", reportType);
      if (status) qs.set("status", status);
      if (reporterId.trim()) qs.set("reporter_id", reporterId.trim());
      if (targetId.trim()) qs.set("target_id", targetId.trim());

      const url = `${API_BASE}/api/admin/reports/list.php?${qs.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const body = await res.json();

      if (!res.ok || body?.success === false) {
        throw new Error(body?.message || `Server returned ${res.status}`);
      }

      const list: ReportItem[] = Array.isArray(body.data)
        ? body.data.map((r: any) => ({
            id: Number(r.id) || 0,
            report_type: r.report_type ?? "-",
            target_id: r.target_id != null ? Number(r.target_id) : null,
            reporter_id: r.reporter_id != null ? Number(r.reporter_id) : null,
            reason: r.reason ?? null,
            status: r.status ?? "pending",
            created_at: r.created_at ?? null,
            updated_at: r.updated_at ?? null,
            reporter_name: r.reporter_name ?? null,
            target_label: r.target_label ?? null,
          }))
        : [];

      setItems(list);
      const totalCount = Number(body.pagination?.total ?? list.length);
      const tPages = Math.max(1, Number(body.pagination?.total_pages ?? 1));
      setTotal(totalCount);
      setTotalPages(tPages);
    } catch (e: any) {
      setError(getErrorMessage(e) || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  function onOpenView(item: ReportItem) {
    setViewItem(item);
    setOpenView(true);
  }

  async function onCopyReason(text?: string | null) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMsg("คัดลอกเหตุผลแล้ว");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch {
      setError("คัดลอกไม่สำเร็จ");
    }
  }

  function goToTarget(item: ReportItem) {
    if (!item.target_id) return;
    if (item.report_type === "room") {
      navigate(`/admin/raidrooms/detail/${item.target_id}`);
      return;
    }
    if (item.report_type === "user") {
      navigate(`/admin/users/detail/${item.target_id}`);
      return;
    }
    // กรณีอื่น ๆ ยังไม่มีหน้า detail เฉพาะ
  }

  const hasAnyFilter = useMemo(
    () => !!(search.trim() || reportType || status || reporterId.trim() || targetId.trim()),
    [search, reportType, status, reporterId, targetId]
  );

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              รายการรายงาน (Reports)
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              ตรวจสอบรายงานจากผู้ใช้ พร้อมค้นหาและกรองตามประเภท/สถานะ
            </p>
          </div>

          {/* Search + Filters */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-2 sm:w-[360px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเหตุผล/คำอธิบาย…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
              <Button
                onClick={() => {
                  setPage(1);
                  fetchReports();
                }}
              >
                ค้นหา
              </Button>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-3">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="rounded-lg border px-2 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">ทุกประเภท</option>
                <option value="room">Room</option>
                <option value="user">User</option>
                <option value="review">Review</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border px-2 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">ทุกสถานะ</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-lg border px-2 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value={5}>แสดง 5</option>
                <option value={10}>แสดง 10</option>
                <option value={25}>แสดง 25</option>
                <option value={50}>แสดง 50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick filters (IDs) */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            type="number"
            inputMode="numeric"
            value={reporterId}
            onChange={(e) => setReporterId(e.target.value)}
            placeholder="Reporter ID"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          <input
            type="number"
            inputMode="numeric"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Target ID"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          <Button
            color="light"
            onClick={() => {
              setSearch("");
              setReportType("");
              setStatus("");
              setReporterId("");
              setTargetId("");
              setPage(1);
              fetchReports();
            }}
          >
            เคลียร์ตัวกรอง
          </Button>
          {loading && <div className="self-center text-sm text-gray-500">กำลังโหลด...</div>}
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

        {/* Mobile: Card list */}
        <div className="space-y-3 md:hidden">
          {items.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              ไม่พบรายการรายงาน
            </div>
          ) : null}

          {items.map((r) => (
            <div
              key={r.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="sm" color={typeColor[r.report_type] ?? "gray"}>
                    {r.report_type}
                  </Badge>
                  <Badge size="sm" color={statusColor[r.status] ?? "gray"}>
                    {r.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(r.created_at)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div>
                  Target ID: <span className="font-semibold">{r.target_id ?? "-"}</span>
                </div>
                <div>
                  Reporter ID: <span className="font-semibold">{r.reporter_id ?? "-"}</span>
                </div>
              </div>

              {r.reason && (
                <p className="mt-2 text-sm text-gray-800 dark:text-gray-100">
                  {r.reason}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <Button size="xs" onClick={() => onOpenView(r)}>
                  ดูรายละเอียด
                </Button>
                {r.reason ? (
                  <Button size="xs" color="light" onClick={() => onCopyReason(r.reason!)}>
                    คัดลอกเหตุผล
                  </Button>
                ) : null}
                {r.report_type === "room" || r.report_type === "user" ? (
                  <Button size="xs" color="gray" onClick={() => goToTarget(r)}>
                    ไปยังเป้าหมาย
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden overflow-x-auto md:block">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
            <Table className="min-w-[980px] table-fixed text-sm">
              <TableHead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-gray-800/90">
                <TableRow>
                  <TableHeadCell className="w-[10%]">Type</TableHeadCell>
                  <TableHeadCell className="w-[5%]">Target</TableHeadCell>
                  <TableHeadCell className="w-[5%]">Reporter</TableHeadCell>
                  <TableHeadCell className="w-[30%]">Reason</TableHeadCell>
                  <TableHeadCell className="w-[10%]">Status</TableHeadCell>
                  <TableHeadCell className="w-[8%]">Created</TableHeadCell>
                  <TableHeadCell className="w-[8%]">Action</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      ไม่พบรายการรายงาน
                    </TableCell>
                  </TableRow>
                )}

                {items.map((r) => (
                  <TableRow
                    key={r.id}
                    className="bg-white transition-colors hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/40"
                  >
                    <TableCell>
                      <Badge size="sm" color={typeColor[r.report_type] ?? "gray"}>
                        {r.report_type}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="truncate">
                        {r.target_label ?? r.target_id ?? "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="truncate">
                        {r.reporter_name ?? r.reporter_id ?? "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[560px] truncate">{r.reason ?? "-"}</div>
                    </TableCell>

                    <TableCell>
                      <Badge size="sm" color={statusColor[r.status] ?? "gray"}>
                        {r.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="xs" onClick={() => onOpenView(r)}>
                          ดู
                        </Button>
                        {(r.report_type === "room" || r.report_type === "user") && r.target_id ? (
                          <Button size="xs" color="gray" onClick={() => goToTarget(r)}>
                            ไปยังเป้าหมาย
                          </Button>
                        ) : null}
                      </div>
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
          {hasAnyFilter ? "ผลลัพธ์" : "รวมทั้งหมด"} {total} รายการ
        </div>
      </div>

      {/* View Modal */}
      <Modal show={openView} onClose={() => setOpenView(false)}>
        <ModalHeader>รายละเอียดรายงาน</ModalHeader>
        <ModalBody>
          {viewItem ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm" color={typeColor[viewItem.report_type] ?? "gray"}>
                  {viewItem.report_type}
                </Badge>
                <Badge size="sm" color={statusColor[viewItem.status] ?? "gray"}>
                  {viewItem.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDate(viewItem.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-gray-700 dark:text-gray-200">
                <div>
                  <span className="text-gray-500">Target ID:</span>{" "}
                  <span className="font-medium">{viewItem.target_id ?? "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Reporter ID:</span>{" "}
                  <span className="font-medium">{viewItem.reporter_id ?? "-"}</span>
                </div>
                {viewItem.target_label ? (
                  <div className="col-span-2">
                    <span className="text-gray-500">Target:</span>{" "}
                    <span className="font-medium">{viewItem.target_label}</span>
                  </div>
                ) : null}
                {viewItem.reporter_name ? (
                  <div className="col-span-2">
                    <span className="text-gray-500">Reporter:</span>{" "}
                    <span className="font-medium">{viewItem.reporter_name}</span>
                  </div>
                ) : null}
              </div>

              <div className="rounded-md bg-gray-50 p-3 text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                {viewItem.reason || "— ไม่มีเหตุผล —"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">ไม่มีข้อมูล</div>
          )}
        </ModalBody>
        <ModalFooter>
          {viewItem?.reason ? (
            <Button color="light" onClick={() => onCopyReason(viewItem.reason!)}>
              คัดลอกเหตุผล
            </Button>
          ) : null}
          {(viewItem?.report_type === "room" || viewItem?.report_type === "user") &&
          viewItem?.target_id ? (
            <Button color="gray" onClick={() => viewItem && goToTarget(viewItem)}>
              ไปยังเป้าหมาย
            </Button>
          ) : null}
        </ModalFooter>
      </Modal>
    </div>
  );
}
