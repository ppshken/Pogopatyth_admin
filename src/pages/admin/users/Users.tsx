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

/* ---------- Types ---------- */
type User = {
  id: number;
  username?: string;
  email: string;
  avatar?: string | null;
  role: string;
  level: number;
  status: string;
  created_at?: string | null;
};

type RawUser = {
  id?: number | string;
  username?: string | null;
  email?: string | null;
  avatar?: string | null;
  role?: string | null;
  level?: number | string | null;
  status?: string | null;
  created_at?: string | null;
};

/* ---------- Avatar helper (ตัวอักษรแรก + สีคงที่) ---------- */
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
function UserAvatar({
  src,
  name,
  id,
  size = 8, // 8=2rem, 10=2.5rem
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
        alt={name || (id ? `User #${id}` : "user")}
        className={`${sizeCls} rounded-full object-cover ring-1 ring-gray-200`}
      />
    );
  }
  const key = name?.toLowerCase() || `user_${id ?? 0}`;
  const color = AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length];
  return (
    <div
      className={`${sizeCls} rounded-full ${color} flex items-center justify-center font-semibold text-white uppercase ring-1 ring-black/10`}
      title={name || (id ? `User #${id}` : "user")}
    >
      {getInitial(name, id)}
    </div>
  );
}

/* ---------- Page ---------- */
export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const [search, setSearch] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const alert = location.state?.alert;
  const msg = location.state?.msg;

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";

      const url = `${API_BASE}/api/admin/users/list.php?page=${page}&limit=${limit}&search=${encodeURIComponent(
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

      const items: RawUser[] = Array.isArray(body.data) ? body.data : [];
      const normalized: User[] = items.map((u) => ({
        id: Number(u.id ?? 0),
        username: u.username ?? "-",
        email: u.email ?? "-",
        avatar: u.avatar ?? null,
        role: u.role ?? "User",
        level: Number(u.level ?? 0) || 0,
        status: String(u.status ?? "inactive"),
        created_at: u.created_at ?? null,
      }));

      setUsers(normalized);
      setTotalPages(Math.max(1, Number(body.pagination?.total_pages) || 1));
    } catch (err) {
      setError(getErrorMessage(err) || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: number) {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";

      const res = await fetch(`${API_BASE}/api/admin/users/delete.php`, {
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

      setSuccessMsg(body.message || "ลบผู้ใช้เรียบร้อยแล้ว");
      await fetchUsers();
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
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
    await deleteUser(id);
    handleCloseDelete();
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    if (alert && msg) {
      setSuccessMsg(msg);
      setShowAlert(true);
      const timer = setTimeout(() => {
        setShowAlert(false);
        navigate(location.pathname, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alert, msg, navigate, location.pathname]);

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header + Controls */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              ผู้ใช้งาน (Users)
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              จัดการบัญชีผู้ใช้ แก้ไข/ลบ และค้นหาผู้ใช้
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex w-full items-center gap-2 sm:w-[360px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา ชื่อ/อีเมล/บทบาท..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
              <Button
                onClick={() => {
                  setPage(1);
                  fetchUsers();
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

            <Button
              onClick={() => navigate("/admin/users/add")}
              className="sm:ml-2"
            >
              สร้างผู้ใช้ใหม่
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && showAlert && (
          <div className="mb-4">
            <AlertComponent message={successMsg} type="success" />
          </div>
        )}
        {error && (
          <div className="mb-4">
            <AlertComponent message={error} type="failure" />
          </div>
        )}

        {/* Mobile: Cards */}
        <div className="space-y-3 md:hidden">
          {users.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
              ไม่พบผู้ใช้
            </div>
          ) : null}

          {users.map((u) => (
            <div
              key={u.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0"
            >
              <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      src={u.avatar || undefined}
                      name={u.username}
                      id={u.id}
                      size={10}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-gray-900 dark:text-white">
                        {u.username ?? "-"}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <Badge color={u.status === "active" ? "success" : "red"}>
                    {u.status}
                  </Badge>
                </div>

                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="text-gray-500">Role:</span> {u.role}
                  </div>
                  <div>
                    <span className="text-gray-500">Level:</span> {u.level}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Created:</span>{" "}
                    {formatDate(u.created_at)}
                  </div>
                </div>

                <div className="mt-3">
                  <Dropdown label="เลือก" size="xs" dismissOnClick={true}>
                    <DropdownItem
                      onClick={() => navigate(`/admin/users/edit/${u.id}`)}
                    >
                      แก้ไข
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => navigate(`/admin/users/detail/${u.id}`)}
                    >
                      ดูรายละเอียด
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem onClick={() => handleOpenDelete(u.id)}>
                      <span className="text-red-600">ลบ</span>
                    </DropdownItem>
                  </Dropdown>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
            <Table className="min-w-[980px] table-fixed text-sm">
              <TableHead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-gray-800/90">
                <TableRow>
                  <TableHeadCell className="w-[26%]">ชื่อ</TableHeadCell>
                  <TableHeadCell className="w-[22%]">อีเมลล์</TableHeadCell>
                  <TableHeadCell className="w-[12%]">ระดับ</TableHeadCell>
                  <TableHeadCell className="w-[10%]">เลเวล</TableHeadCell>
                  <TableHeadCell className="w-[12%]">สถานะ</TableHeadCell>
                  <TableHeadCell className="w-[14%]">สร้างเมื่อ</TableHeadCell>
                  <TableHeadCell className="w-[8%]">จัดการ</TableHeadCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y">
                {users.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-gray-500"
                    >
                      ไม่พบผู้ใช้
                    </TableCell>
                  </TableRow>
                )}

                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    className="bg-white transition-colors hover:bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/40"
                  >
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2">
                        <UserAvatar
                          src={u.avatar || undefined}
                          name={u.username}
                          id={u.id}
                        />
                        <span className="truncate">{u.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="truncate">{u.email}</TableCell>
                    <TableCell className="truncate">{u.role}</TableCell>
                    <TableCell>{u.level}</TableCell>
                    <TableCell>
                      <Badge
                        size="sm"
                        color={u.status === "active" ? "success" : "red"}
                      >
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dropdown
                        label="เลือก"
                        size="xs"
                        dismissOnClick={true}
                        inline
                      >
                        <DropdownItem
                          onClick={() =>
                            navigate(`/admin/users/detail/${u.id}`)
                          }
                        >
                          ดูรายละเอียด
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => navigate(`/admin/users/edit/${u.id}`)}
                        >
                          แก้ไข
                        </DropdownItem>
                        <DropdownDivider />
                        <DropdownItem onClick={() => handleOpenDelete(u.id)}>
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

        {/* Delete modal */}
        {showDeleteModal && (
          <ModalComponent
            header="ยืนยันการลบ"
            msg="คุณต้องการลบผู้ใช้นี้หรือไม่?"
            id={deleteId ?? undefined}
            onConfirm={handleConfirmDelete}
            onClose={handleCloseDelete}
          />
        )}
      </div>
    </div>
  );
}
