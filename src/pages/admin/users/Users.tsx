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
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal";

type User = {
  id: number;
  name?: string;
  email: string;
  role: string;
  team: string;
  level: number;
  created_at?: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const alert = location.state?.alert;
  const msg = location.state?.msg;

  // state สำหรับ Modal ลบ
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // state สำหรับ Alert
  const [show, setShow] = useState(false);

  function formatDate(d?: string) {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  }

  async function fetchUsers() {
    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE;
      const url = `${API_BASE}/user/all.php?page=${page}&limit=${limit}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const body = await res.json();

      if (!body || body.success === false) {
        throw new Error(body?.message || "API error");
      }

      const items = Array.isArray(body.data) ? body.data : [];
      const normalized: User[] = items.map((u: any) => ({
        id: Number(u.id) || 0,
        name: u.trainer_name,
        email: u.email ?? "-",
        role: u.role ?? "User",
        team: u.team ?? "-",
        level: Number(u.level) || 0,
        created_at: u.created_at ?? null,
      }));

      setUsers(normalized);
      setTotal(Number(body.total) || 0);
      setTotalPages(Number(body.total_pages) || 0);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: number) {
    try {
      setLoading(true);
      setError(null);
      const API_BASE = import.meta.env.VITE_API_BASE;
      const res = await fetch(`${API_BASE}/user/delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.message || `Server returned ${res.status}`);
      }
      setSuccessMsg(body.message || "ลบผู้ใช้เรียบร้อยแล้ว");
      await fetchUsers();
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  }

  // เปิด modal ยืนยันลบ
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
  }, []);

  useEffect(() => {
    fetchUsers();
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

  return (
    <div className="overflow-x-auto p-4">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Users
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        User management.
      </p>
      <div className="m-2 mb-4 flex items-center justify-end">
        <div className="ml-4 flex items-center space-x-4">
          <div>{loading && <div className="text-sm text-gray-500">กำลังโหลด...</div>}</div>

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
            <Button onClick={() => navigate("/admin/users/add")}>
              Create Users
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

      {/* มือถือ: Card View */}
      <div className="space-y-3 md:hidden">
        {users.length === 0 && !loading ? (
          <div className="rounded border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700">
            ไม่พบผู้ใช้
          </div>
        ) : null}

        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">
                {u.name ?? "-"}
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                Lv {u.level}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <div className="break-words text-gray-700 dark:text-gray-200">
                <span className="font-medium">Email:</span> {u.email}
              </div>
              <div className="text-gray-700 dark:text-gray-200">
                <span className="font-medium">Role:</span> {u.role}
              </div>
              <div className="text-gray-700 dark:text-gray-200">
                <span className="font-medium">Team:</span> {u.team}
              </div>
              <div className="text-gray-700 dark:text-gray-200">
                <span className="font-medium">Created:</span>{" "}
                {formatDate(u.created_at)}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                size="xs"
                onClick={() => navigate(`/admin/users/edit/${u.id}`)}
              >
                Edit
              </Button>
              <Button size="xs" color="red" onClick={() => deleteUser(u.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[900px] table-fixed text-sm">
          <TableHead className="sticky top-0 z-10 bg-white dark:bg-gray-800">
            <TableRow>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Role</TableHeadCell>
              <TableHeadCell>Team</TableHeadCell>
              <TableHeadCell>Level</TableHeadCell>
              <TableHeadCell>Created At</TableHeadCell>
              <TableHeadCell>Action</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <TableCell>{user.name ?? "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.team}</TableCell>
                <TableCell>{user.level}</TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => navigate(`/admin/users/edit/${user.id}`)}>
                      Edit
                    </Button>
                    <Button color="red" outline onClick={() => handleOpenDelete(user.id)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">รวม {total} ผู้ใช้</span>
        <div className="flex items-center space-x-2">
          <Button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))}>
            ก่อนหน้า
          </Button>
          <span className="text-sm text-gray-600">
            หน้า {page} / {totalPages || 1}
          </span>
          <Button
            disabled={page >= (totalPages || 1)}
            onClick={() => setPage((s) => s + 1)}
          >
            ถัดไป
          </Button>
        </div>
      </div>

      {/* Modal ยืนยันลบ */}
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
  );
}
