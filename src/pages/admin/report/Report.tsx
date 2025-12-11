// src/pages/admin/reports/Reports.tsx
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
  Modal,
  ModalHeader,
  ModalBody,
  Dropdown,
  DropdownItem,
  Select,
  Spinner,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { PaginationComponent } from "../../../component/pagination";
import { formatDate } from "../../../component/functions/formatDate";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";
import { useNavigate } from "react-router";

type ReportItem = {
  id: number;
  report_type: "room" | "user" | "review" | string;
  target_id: number;
  reporter_id: number;
  reason: string;
  status: "pending" | "reviewing" | "resolved" | "rejected" | string;
  created_at: string; // "YYYY-MM-DD HH:mm:ss"
  updated_at: string;
  username: string;
  avatar: string;
};

export default function Reports() {
  const navigate = useNavigate();

  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number>(0);

  const [openView, setOpenView] = useState(false);
  const [viewItem, setViewItem] = useState<ReportItem | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const statusColor: Record<
    string,
    "warning" | "info" | "success" | "red" | "gray"
  > = {
    pending: "warning",
    reviewed: "info",
    resolved: "success",
  };

  const statusName: Record<
    string,
    "รอการตรวจสอบ" | "ตรวจสอบแล้ว" | "แก้ไขแล้ว" | "ยกเลิก"
  > = {
    pending: "รอการตรวจสอบ",
    reviewed: "ตรวจสอบแล้ว",
    resolved: "แก้ไขแล้ว",
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

      const url = `${API_BASE}/api/admin/reports/list.php?page=${page}&limit=${limit}`;
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

      const list: ReportItem[] = (
        Array.isArray(body.data) ? body.data : []
      ).map((r: any) => ({
        id: Number(r.id) || 0,
        report_type: r.report_type ?? "-",
        target_id: Number(r.target_id) || 0,
        reporter_id: Number(r.reporter_id) || 0,
        reason: r.reason ?? "-",
        status: r.status ?? "pending",
        created_at: r.created_at ?? null,
        updated_at: r.updated_at ?? null,
        username: r.username ?? null,
        avatar: r.avatar ?? null,
      }));

      setItems(list);
      setTotal(Number(body.pagination?.total) || list.length);
      setTotalPages(Math.max(1, Number(body.pagination?.total_pages) || 1));
    } catch (e) {
      setError(getErrorMessage(e) || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // อัปเดต Report
  async function handleUpdateReviewed(r: ReportItem, status: string) {
    setLoadingMap((prev) => ({ ...prev, [r.id]: true }));
    try {
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";
      const UPDATE_URL = `${API_BASE}/api/admin/reports/update.php`;
      const body = {
        report_id: r.id,
        status: status,
      };
      const res = await fetch(UPDATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Server returned ${res.status}`);
      }
      setShow(true);
      setSuccessMsg(data.message || "อัปเดต สถานะ สำเร็จ");
      fetchReports();
    } catch (e) {
      setError(getErrorMessage(e) || "เกิดข้อผิดพลาด");
    } finally {
      setLoadingMap((prev) => ({ ...prev, [r.id]: false }));
    }
  }

  function onOpenView(item: ReportItem) {
    setViewItem(item);
    setOpenView(true);
  }

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <div className="p-4">
      <div className="max-w-screen-xxl mx-auto">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              รายงาน (Reports)
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              ตรวจสอบรายงานจากผู้ใช้
            </p>
          </div>

          {/* Controls: limit + refresh */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              แสดงต่อหน้า:
            </label>
            <div className="w-20">
              <Select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                sizing="md"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </Select>
            </div>
            <Button color="light" onClick={fetchReports} disabled={loading}>
              รีเฟรช
            </Button>
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

        {/* จำนวนทั้งหมด */}
        <div className="mb-4 flex justify-end text-sm text-gray-500 dark:text-gray-400">
          จำนวนทั้งหมด {total} รายการ
        </div>

        {/* Mobile: Card list */}
        <div className="space-y-3 md:hidden">
          {items.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              ไม่พบรายการรายงาน
            </div>
          ) : null}

          {items.map((r) => {
            return (
              <div
                key={r.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge size="sm" color={typeColor[r.report_type] ?? "gray"}>
                      {r.report_type}
                    </Badge>
                    <div className="flex flex-wrap items-center">
                      <Badge size="sm" color={statusColor[r.status] ?? "gray"}>
                        {statusName[r.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(r.created_at)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    Target ID:{" "}
                    <span className="font-semibold">{r.target_id || "-"}</span>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <img
                        className="h-6 w-6 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                        src={r.avatar || "/default_avatar.png"}
                      />
                      <span>{r.username || "-"}</span>
                    </div>
                  </div>
                </div>

                {r.reason && (
                  <p className="mt-2 text-sm text-gray-800 dark:text-gray-100">
                    {r.reason}
                  </p>
                )}

                <div className="mt-3 flex gap-4 dark:text-gray-100">
                  <Button size="xs" onClick={() => onOpenView(r)}>
                    ดูรายละเอียด
                  </Button>
                  <Dropdown label="อัปเดต" size="xs" dismissOnClick inline>
                    <DropdownItem
                      onClick={() => handleUpdateReviewed(r, "resolved")}
                    >
                      {loading ? (
                        <Spinner
                          aria-label="Spinner button example"
                          size="sm"
                          light
                        />
                      ) : (
                        <div>
                          <Badge size="sx" color="green">
                            แก้ไขแล้ว
                          </Badge>
                        </div>
                      )}
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => handleUpdateReviewed(r, "reviewed")}
                    >
                      {loading ? (
                        <Spinner
                          aria-label="Spinner button example"
                          size="sm"
                          light
                        />
                      ) : (
                        <div>
                          <Badge size="sx" color="info">
                            ตรวจสอบแล้ว
                          </Badge>
                        </div>
                      )}
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Table */}
        <div className="hidden overflow-x-auto md:block">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
            <Table className="min-w-[900px] table-fixed text-sm">
              <TableHead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-gray-800/90">
                <TableRow>
                  <TableHeadCell className="w-[4%]">ประเภท</TableHeadCell>
                  <TableHeadCell className="w-[4%]">เป้าหมาย</TableHeadCell>
                  <TableHeadCell className="w-[10%]">ผู้รายงาน</TableHeadCell>
                  <TableHeadCell className="w-[20%]">เหตุผล</TableHeadCell>
                  <TableHeadCell className="w-[8%]">สถานะ</TableHeadCell>
                  <TableHeadCell className="w-[8%]">สร้างเมื่อ</TableHeadCell>
                  <TableHeadCell className="w-[8%]">จัดการ</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {items.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-gray-500"
                    >
                      ไม่พบรายการรายงาน
                    </TableCell>
                  </TableRow>
                )}

                {items.map((r) => {
                  const loading = !!loadingMap[r.id];
                  return (
                    <TableRow
                      key={r.id}
                      className="bg-white transition-colors hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/40"
                    >
                      <TableCell>
                        <div className="flex flex-wrap items-center">
                          <Badge
                            size="sm"
                            color={typeColor[r.report_type] ?? "gray"}
                          >
                            {r.report_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Button
                          size="sm"
                          color={!r.target_id ? "default" : "light"}
                          onClick={() =>
                            navigate(`/admin/users/detail/${r.target_id}`)
                          }
                          disabled={!r.target_id}
                        >
                          {r.target_id || "ระบบ"}
                        </Button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="mb-2 flex items-center gap-2">
                          <img
                            className="h-6 w-6 flex-shrink-0 rounded-full object-cover ring-1 ring-gray-200"
                            src={r.avatar || "/default_avatar.png"}
                          />
                          <span>{r.username || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[560px] truncate">
                          {r.reason || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center">
                          <Badge
                            size="xs"
                            color={statusColor[r.status] ?? "gray"}
                          >
                            {statusName[r.status]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-4">
                          <Button size="xs" onClick={() => onOpenView(r)}>
                            ดูรายละเอียด
                          </Button>
                          <Dropdown
                            label="อัปเดต"
                            size="xs"
                            dismissOnClick
                            inline
                          >
                            <DropdownItem
                              onClick={() =>
                                handleUpdateReviewed(r, "resolved")
                              }
                            >
                              {loading ? (
                                <Spinner
                                  aria-label="Spinner button example"
                                  size="sm"
                                  light
                                />
                              ) : (
                                <div>
                                  <Badge size="sx" color="green">
                                    แก้ไขแล้ว
                                  </Badge>
                                </div>
                              )}
                            </DropdownItem>
                            <DropdownItem
                              onClick={() =>
                                handleUpdateReviewed(r, "reviewed")
                              }
                            >
                              {loading ? (
                                <Spinner
                                  aria-label="Spinner button example"
                                  size="sm"
                                  light
                                />
                              ) : (
                                <div>
                                  <Badge size="sx" color="info">
                                    ตรวจสอบแล้ว
                                  </Badge>
                                </div>
                              )}
                            </DropdownItem>
                          </Dropdown>
                        </div>
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
      </div>

      {/* View Modal */}
      <Modal show={openView} onClose={() => setOpenView(false)}>
        <ModalHeader>รายละเอียดรายงาน</ModalHeader>
        <ModalBody>
          {viewItem ? (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  size="sm"
                  color={typeColor[viewItem.report_type] ?? "gray"}
                >
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
                  <span className="font-medium">
                    {viewItem.target_id || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Reporter ID:</span>{" "}
                  <span className="font-medium">
                    {viewItem.reporter_id || "-"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Updated:</span>{" "}
                  <span className="font-medium">
                    {formatDate(viewItem.updated_at)}
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-gray-50 p-3 text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                {viewItem.reason || "— ไม่มีเหตุผล —"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">ไม่มีข้อมูล</div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
