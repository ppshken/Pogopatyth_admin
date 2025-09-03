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
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { ModalComponent } from "../../../component/modal";

type RaidRoom = {
  id: number;
  boss: string;
  pokemon_image: string;
  owner_name: string;
  max_members: number;
  member_total: number;
  created_at: string;
};

export default function Raidrooms() {
  const [rooms, setRooms] = useState<RaidRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  function formatDate(d: string) {
    try {
      return new Date(d).toLocaleString("th-TH");
    } catch {
      return d;
    }
  }

  async function fetchRooms() {
    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");
      const res = await fetch(
        `${API_BASE}/api/admin/rooms/list.php?page=${page}&limit=${limit}&search=${search}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const body = await res.json();

      if (!body.success) throw new Error(body.message || "API error");

      setRooms(body.data);
      setTotal(body.pagination.total);
      setTotalPages(body.pagination.total_pages);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRoom(id: number) {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${API_BASE}/api/admin/rooms/delete.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ id }),
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.message || `Server returned ${res.status}`);
      }

      setSuccessMsg(body.message || "ลบห้องเรียบร้อยแล้ว");
      fetchRooms();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  return (
    <div className="overflow-x-auto p-4">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Raid Rooms
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        จัดการห้อง Raid ที่ผู้ใช้สร้าง
      </p>

      {/* Search & Create */}
      <div className="my-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TextInput
            placeholder="ค้นหาชื่อบอส / เจ้าของ"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={() => fetchRooms()}>ค้นหา</Button>
        </div>
        <Button onClick={() => navigate("/admin/raidrooms/add")}>
          Create Room
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
        {rooms.length === 0 && !loading ? (
          <div className="rounded border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700">
            ไม่พบห้อง
          </div>
        ) : null}

        {rooms.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">
                {r.boss}
              </div>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {r.max_members} players
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              owner_name: {r.owner_name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Created: {formatDate(r.created_at)}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="xs"
                onClick={() => navigate(`/admin/raidrooms/edit/${r.id}`)}
              >
                Edit
              </Button>
              <Button
                size="xs"
                color="red"
                onClick={() => {
                  setDeleteId(r.id);
                  setShowDeleteModal(true);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block">
        <Table className="min-w-[800px]">
          <TableHead>
            <TableRow>
              <TableHeadCell>boss</TableHeadCell>
              <TableHeadCell>owner_name</TableHeadCell>
              <TableHeadCell>Players</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Action</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img
                      src={r.pokemon_image}
                      alt={r.boss}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span>{r.boss}</span>
                  </div>
                </TableCell>
                <TableCell>{r.owner_name}</TableCell>
                <TableCell>{r.member_total} / {r.max_members}</TableCell>
                <TableCell>{formatDate(r.created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/admin/raidrooms/edit/${r.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      color="red"
                      outline
                      onClick={() => {
                        setDeleteId(r.id);
                        setShowDeleteModal(true);
                      }}
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
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-600">รวม {total} ห้อง</span>
        <div className="flex items-center gap-2">
          <Button disabled={page <= 1} onClick={() => setPage((s) => s - 1)}>
            ก่อนหน้า
          </Button>
          <span>
            หน้า {page} / {totalPages || 1}
          </span>
          <Button
            disabled={page >= totalPages}
            onClick={() => setPage((s) => s + 1)}
          >
            ถัดไป
          </Button>
        </div>
      </div>

      {/* Modal Confirm Delete */}
      {showDeleteModal && (
        <ModalComponent
          header="ยืนยันการลบห้อง"
          msg="คุณต้องการลบห้องนี้หรือไม่?"
          id={deleteId ?? undefined}
          onConfirm={(id) => {
            if (id) deleteRoom(id);
            setShowDeleteModal(false);
          }}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
