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
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal";
import { PaginationComponent } from "../../../component/pagination";

type User = {
  id: number;
  username?: string;
  email: string;
  role: string;
  level: number;
  status: string;
  created_at?: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [search, setSearch] = useState(""); // ✅ state สำหรับค้นหา

  const navigate = useNavigate();
  const location = useLocation();
  const alert = location.state?.alert;
  const msg = location.state?.msg;

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      const token = localStorage.getItem("auth_token");

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

      const items = Array.isArray(body.data) ? body.data : [];
      const normalized: User[] = items.map((u: any) => ({
        id: Number(u.id) || 0,
        username: u.username ?? "-",
        email: u.email ?? "-",
        role: u.role ?? "User",
        level: Number(u.level) || 0,
        status: u.status,
        created_at: u.created_at ?? null,
      }));

      setUsers(normalized);
      setTotal(Number(body.pagination?.total) || 0);
      setTotalPages(Math.max(1, Number(body.pagination?.total_pages) || 1));
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
      const token = localStorage.getItem("auth_token");

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
      setShow(true);
      setTimeout(() => setShow(false), 3000);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาดในการลบ");
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

      {/* ✅ Search bar */}
      <div className="my-4 flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
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


      <div className="m-2 mb-4 flex items-center justify-end">
        <div className="ml-4 flex items-center space-x-4">
          <div>
            {loading && (
              <div className="text-sm text-gray-500">กำลังโหลด...</div>
            )}
          </div>

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
                {u.username ?? "-"}
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
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={
                    "rounded px-2 py-0.5 text-xs " +
                    (u.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-white"
                      : "bg-red-100 text-red-700 dark:bg-red-700 dark:text-white")
                  }
                >
                  {u.status}
                </span>
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
              <Button
                size="xs"
                color="red"
                onClick={() => handleOpenDelete(u.id)}
              >
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
              <TableHeadCell>Level</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
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
                <TableCell>{user.username ?? "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.level}</TableCell>
                <TableCell>
                  <Badge
                    size="sm"
                    color={user.status === "active" ? "success" : "red"}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      color="red"
                      outline
                      onClick={() => handleOpenDelete(user.id)}
                    >
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
      <PaginationComponent
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

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
