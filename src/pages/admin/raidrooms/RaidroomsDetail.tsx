// src/pages/admin/raidrooms/RaidroomsDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Badge,
  Button,
  Table,
  TableHead,
  TableHeadCell,
  TableRow,
  TableBody,
  TableCell,
  Spinner,
  Progress,
  Select,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { formatDate } from "../../../component/functions/formatDate";
import { ModalComponent } from "../../../component/modal";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

type Room = {
  id: number;
  raid_boss_id: number;
  pokemon_image: string | null;
  boss: string;
  start_time: string; // "YYYY-MM-DD HH:mm:ss"
  max_members: number;
  status: "active" | "invited" | "canceled" | "closed" | string;
  owner_id: number;
  note: string | null;
  avg_rating: string | number | null;
  review_count: number | null;
  created_at: string;
  owner_name?: string;
  owner_avatar?: string | null;
};

type Member = {
  id: number;
  room_id: number;
  user_id: number;
  role: "owner" | "member" | string;
  joined_at: string;
  friend_ready: 0 | 1 | number;
  friend_ready_at: string | null;
  username?: string;
  avatar?: string | null;
};

type RaidReview = {
  id: number;
  room_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar?: string | null;
};

type DetailResponse = {
  success: boolean;
  data?: {
    room: Room;
    members: Member[];
    member_total: number;
    reviews?: RaidReview[]; // 👈 เพิ่ม
  };
  message?: string;
};

export default function RaidroomsDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberTotal, setMemberTotal] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<RaidReview[]>([]);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [kickUserId, setKickUserId] = useState<number | null>(null);
  const [showKickModal, setShowKickModal] = useState(false);

  // countdown แบบเรียลไทม์
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // สีของสถานะ
  const statusColor: Record<
    string,
    "success" | "indigo" | "red" | "gray" | "warning" | "info"
  > = {
    active: "success",
    invited: "indigo",
    canceled: "red",
    closed: "gray",
  };

  // แปลงวันที่เวลาท้องถิ่นจากสตริง "YYYY-MM-DD HH:mm:ss"
  function parseLocalDate(s?: string | null): Date | null {
    if (!s) return null;
    const normalized = s.includes("T") ? s : s.replace(" ", "T");
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }
  // แปลงมิลลิวินาทีเป็นรูปแบบ "Xd HH:MM:SS"
  function formatDuration(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return d > 0 ? `${d}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
  }
  // คำนวณเวลานับถอยหลังและสี
  function getCountdown(start_time?: string | null, status?: string | null) {
    const start = parseLocalDate(start_time);
    if (!start) return { text: "-", color: "gray" as const };
    const diff = start.getTime() - now;
    if (diff <= 0 || status === "canceled" || status === "closed")
      return { text: "time out", color: "red" as const };
    const color =
      diff <= 5 * 60 * 1000
        ? ("warning" as const)
        : diff <= 60 * 60 * 1000
          ? ("success" as const)
          : ("info" as const);
    return { text: formatDuration(diff), color };
  }

  // ดึงรายละเอียดห้อง
  async function fetchDetail() {
    if (!id) {
      setError("ไม่พบรหัสห้อง");
      setLoading(false);
      return;
    }
    try {
      setRefreshing(true);
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";
      const url = `${API_BASE}/api/admin/rooms/detail.php?id=${encodeURIComponent(id)}`;

      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data: DetailResponse = await res.json();

      if (!res.ok || !data?.success || !data.data) {
        throw new Error(data?.message || `Server returned ${res.status}`);
      }

      setRoom(data.data.room);
      setMembers(Array.isArray(data.data.members) ? data.data.members : []);
      setMemberTotal(Number(data.data.member_total) || 0);
      setReviews(Array.isArray(data.data.reviews) ? data.data.reviews : []);
    } catch (e) {
      setError(getErrorMessage(e) || "โหลดรายละเอียดไม่สำเร็จ");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // เรียกใช้ตอนโหลดหน้าและเมื่อ id เปลี่ยน
  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cd = getCountdown(room?.start_time, room?.status);
  const isFull = room && memberTotal >= (room.max_members ?? 0);
  const capacityPct =
    room && room.max_members > 0
      ? Math.min(100, Math.round((memberTotal / room.max_members) * 100))
      : 0;

  // ตัวเลือกสถานะและ label ภาษาไทย
  const ROOM_STATUS_OPTIONS: Array<Room["status"]> = [
    "invited",
    "active",
    "closed",
    "canceled",
  ];
  // สถานะที่แสดงใน Select
  const STATUS_LABELS: Record<string, string> = {
    invited: "Invited",
    active: "Active",
    closed: "Closed",
    canceled: "Canceled",
  };

  const [statusDraft, setStatusDraft] = useState<Room["status"] | "">("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [alertUser, setAlertUser] = useState<string | null>(null);

  // ตั้งค่า statusDraft ตามค่าจากห้องเมื่อโหลดสำเร็จ
  useEffect(() => {
    if (room?.status) setStatusDraft(room.status);
  }, [room?.status]);

  // ฟังก์ชันบันทึกสถานะ
  async function handleSaveStatus() {
    if (!room || !statusDraft || statusDraft === room.status) return;

    try {
      setSavingStatus(true);
      setError(null);
      setStatusMsg(null);

      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";

      // ✅ กำหนด URL อัปเดตสถานะ (ปรับให้ตรงกับฝั่ง PHP ของคุณ)
      const UPDATE_STATUS_URL = `${API_BASE}/api/admin/rooms/update_status.php`;

      const res = await fetch(UPDATE_STATUS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ id: room.id, status: statusDraft }),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Server returned ${res.status}`);
      }

      // อัปเดตในหน้าให้ตรงกับที่เซฟแล้ว
      setRoom((prev) =>
        prev ? ({ ...prev, status: statusDraft } as Room) : prev,
      );
      setStatusMsg(data?.message || "อัปเดตสถานะห้องเรียบร้อยแล้ว");

      // เคลียร์ข้อความสำเร็จอัตโนมัติ
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (e) {
      setError(getErrorMessage(e) || "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setSavingStatus(false);
    }
  }

  // ฟังก์ชันลบห้อง
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
      if (!res.ok || body.success === false) {
        throw new Error(body.message || `Server returned ${res.status}`);
      }

      // ✅ ข้อความที่จะส่งกลับไปแสดงที่หน้ารายการ
      const msgText = body.message || "ลบห้องเรียบร้อยแล้ว";

      // ✅ กลับไปหน้ารายการ พร้อม state สำหรับแสดง Alert
      navigate("/admin/raidrooms", {
        replace: true, // กันผู้ใช้กด Back แล้วเจอหน้า detail ที่ถูกลบ
        state: { alert: "success", msg: msgText },
      });
    } catch (e) {
      setError(getErrorMessage(e) || "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setLoading(false);
    }
  }

  // ฟังก์ชันเตะสมาชิก
  async function kickMember(userId: number) {
    if (!room) return;
    try {
      setLoading(true);
      setError(null);
      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/admin/rooms/kick_member.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ room_id: room.id, user_id: userId }),
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.message || `Server returned ${res.status}`);
      }
      // รีเฟรชข้อมูลห้อง
      await fetchDetail();
      // แสดงข้อความเตะสมาชิก
      setAlertUser(body.message || "เตะสมาชิกเรียบร้อยแล้ว");
      // เคลียร์ข้อความสำเร็จอัตโนมัติ
      setTimeout(() => setAlertUser(null), 2500);
    } catch (e) {
      setAlertUser(getErrorMessage(e) || "เกิดข้อผิดพลาดในการเตะสมาชิก");
    } finally {
      setLoading(false);
      setKickUserId(null);
      setShowKickModal(false);
    }
  }

  // ฟังก์ชันเปิด/ปิด modal ลบห้อง
  const handleOpenDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // ฟังก์ชันเปิด/ปิด modal เตะสมาชิก
  const handleCloseDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  // ฟังก์ชันยืนยันการลบห้อง
  const handleConfirmDelete = async (id: number) => {
    await deleteRoom(id);
    handleCloseDelete();
  };

  // ฟังก์ชันเปิด/ปิด modal เตะสมาชิก
  const handleOpenKick = (userId: number) => {
    setKickUserId(userId);
    setShowKickModal(true);
  };

  // ฟังก์ชันปิด modal เตะสมาชิก
  const handleCloseKick = () => {
    setShowKickModal(false);
    setKickUserId(null);
  };

  return (
    <div className="p-4">
      {/* Top bar */}
      <div className="mx-auto mb-5 flex max-w-screen-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            รายละเอียดห้องบอส
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            ดูข้อมูลห้องที่เลือก พร้อมสมาชิกและสถานะล่าสุด
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            color="red"
            type="button"
            disabled={!room}
            onClick={() => room && handleOpenDelete(room.id)}
          >
            ลบ
          </Button>
          <Button
            color="light"
            onClick={fetchDetail}
            disabled={refreshing}
            aria-busy={refreshing}
          >
            {refreshing && <Spinner size="sm" className="mr-2" />}
            รีเฟรช
          </Button>
          <Button color="gray" onClick={() => navigate(-1)}>
            กลับ
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-auto mb-4 max-w-screen-xl">
          <AlertComponent type="failure" message={error} />
        </div>
      )}

      <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Main (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Hero card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {/* header stripe */}
            <div className="h-2 w-full" />

            <div className="p-5">
              <div className="flex items-start gap-4">
                {room?.pokemon_image ? (
                  <img
                    src={room.pokemon_image}
                    alt={room.boss}
                    className="h-20 w-20 flex-shrink-0 rounded-xl object-cover ring-1 ring-gray-200"
                  />
                ) : (
                  <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-gray-200" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
                      {room?.boss ?? "-"}
                    </h4>
                    {room?.status && (
                      <Badge color={statusColor[room.status] ?? "gray"}>
                        {room.status}
                      </Badge>
                    )}
                    {room && (
                      <Badge color={isFull ? "success" : "info"}>
                        {memberTotal}/{room.max_members}
                      </Badge>
                    )}
                    <Badge color={cd.color}>{cd.text}</Badge>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-3 dark:text-gray-200">
                    <div className="space-y-0.5">
                      <div className="text-gray-500 dark:text-gray-400">
                        เริ่ม
                      </div>
                      <div className="font-medium">
                        {formatDate(room?.start_time)}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-500 dark:text-gray-400">
                        สร้างเมื่อ
                      </div>
                      <div className="font-medium">
                        {formatDate(room?.created_at)}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-500 dark:text-gray-400">
                        เรตติ้ง
                      </div>
                      <div className="font-medium">
                        {room?.avg_rating
                          ? Number(room.avg_rating).toFixed(2)
                          : "-"}{" "}
                        <span className="text-xs text-gray-500">
                          ({room?.review_count ?? 0} รีวิว)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity progress */}
                  {room && (
                    <div className="mt-4">
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>ความจุสมาชิก</span>
                        <span>{capacityPct}%</span>
                      </div>
                      <Progress progress={capacityPct} />
                    </div>
                  )}
                </div>
              </div>

              {/* note */}
              {room?.note && (
                <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700 ring-1 ring-gray-100 dark:bg-gray-700/40 dark:text-gray-100 dark:ring-gray-700/60">
                  หมายเหตุ: {room.note}
                </div>
              )}

              {/* meta inline */}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200 dark:bg-gray-700/40 dark:ring-gray-700/60">
                  Room ID: {room?.id ?? "-"}
                </span>
                <span className="rounded-full bg-gray-50 px-3 py-1 ring-1 ring-gray-200 dark:bg-gray-700/40 dark:ring-gray-700/60">
                  Raid Boss ID: {room?.raid_boss_id ?? "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Members card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ผู้เข้าร่วม ({memberTotal})
              </div>
              <div className="text-xs text-gray-500">
                เรียงตามเวลาที่เข้าร่วม
              </div>
            </div>

            {/* Mobile list */}
            <div className="space-y-3 p-4 md:hidden">
              {members.length === 0 && (
                <div className="rounded border border-dashed p-4 text-center text-sm text-gray-500 dark:border-gray-600">
                  ยังไม่มีผู้เข้าร่วม
                </div>
              )}
              {members.map((m) => {
                const ready = Number(m.friend_ready) === 1;
                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            alt={m.username}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {m.username ?? `User #${m.user_id}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            เข้าร่วม: {formatDate(m.joined_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={m.role === "owner" ? "purple" : "gray"}>
                          {m.role}
                        </Badge>
                        {m.role === "owner" ? (
                          <Badge color="blue">เจ้าของห้อง</Badge>
                        ) : (
                          <Badge color={ready ? "success" : "gray"}>
                            {ready ? "เพิ่มเพื่อนแล้ว" : "ยังไม่เพิ่มเพื่อน"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row items-center gap-2 justify-between">
                      {m.friend_ready_at && (
                        <div className="text-xs text-gray-500">
                          เวลาเพิ่มเพื่อน: {formatDate(m.friend_ready_at)}
                        </div>
                      )}

                      {m.role !== "owner" && (
                        <div className="text-right">
                          <Button
                            size="xs"
                            color="red"
                            onClick={() => handleOpenKick(m.user_id)}
                          >
                            {" "}
                            เตะสมาชิก
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {alertUser && (
              <div className="p-3">
                <AlertComponent type="success" message={alertUser} />
              </div>
            )}

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table className="w-full table-auto text-sm">
                <TableHead>
                  <TableRow>
                    <TableHeadCell>ผู้ใช้งาน</TableHeadCell>
                    <TableHeadCell>ระดับ</TableHeadCell>
                    <TableHeadCell>สถานะ เพิ่มเพื่อน</TableHeadCell>
                    <TableHeadCell>เข้าร่วมเมื่อ</TableHeadCell>
                    <TableHeadCell className="hidden lg:table-cell">
                      เพิ่มเพื่อนเมื่อ
                    </TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {members.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-gray-500"
                      >
                        ยังไม่มีผู้เข้าร่วม
                      </TableCell>
                    </TableRow>
                  )}
                  {members.map((m) => {
                    const ready = Number(m.friend_ready) === 1;
                    return (
                      <TableRow
                        key={m.id}
                        className="bg-white dark:border-gray-700 dark:bg-gray-800"
                      >
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2">
                            {m.avatar ? (
                              <img
                                src={m.avatar}
                                alt={m.username}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300" />
                            )}
                            <span className="block max-w-[220px] truncate">
                              {m.username ?? `User #${m.user_id}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge color={m.role === "owner" ? "purple" : "gray"}>
                            {m.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {m.role === "owner" ? (
                            <Badge color="blue">เจ้าของห้อง</Badge>
                          ) : (
                            <Badge color={ready ? "success" : "gray"}>
                              {ready ? "เพิ่มเพื่อนแล้ว" : "ยังไม่เพิ่มเพื่อน"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(m.joined_at)}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap lg:table-cell">
                          <div className="flex flex-row items-center gap-3">
                            <div>
                              {m.friend_ready_at
                                ? formatDate(m.friend_ready_at)
                                : "-"}
                            </div>
                            <div>
                              {m.role !== "owner" && (
                                <Button
                                  size="xs"
                                  color="red"
                                  onClick={() => handleOpenKick(m.user_id)}
                                >
                                  เตะ
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Reviews card */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-700">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                รีวิว ({room?.review_count ?? 0}) — เฉลี่ย{" "}
                {room?.avg_rating ? Number(room.avg_rating).toFixed(2) : "-"} /
                5
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {reviews.length === 0 && (
                <div className="px-5 py-6 text-center text-sm text-gray-500">
                  ยังไม่มีรีวิว
                </div>
              )}

              {reviews.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-5 py-4">
                  {/* ถ้าได้เพิ่ม UserAvatar helper แล้ว ใช้แบบนี้:
            <UserAvatar src={r.avatar} name={r.username} userId={r.user_id} size="10" />
           ถ้ายังไม่ได้เพิ่ม ใช้ fallback ด้านล่าง */}
                  {r.avatar ? (
                    <img
                      src={r.avatar}
                      alt={r.username}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {r.username ?? `User #${r.user_id}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(r.created_at)}
                      </div>
                      <Badge color="yellow">{`${r.rating} ★`}</Badge>
                    </div>
                    {r.comment && (
                      <div className="mt-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-200">
                        {r.comment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-6">
          {/* Owner card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
              เจ้าของห้อง
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                {room?.owner_avatar ? (
                  <img
                    src={room.owner_avatar}
                    alt={room.owner_name}
                    className="h-12 w-12 rounded-full object-cover ring-1 ring-gray-200"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300" />
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {room?.owner_name ?? "-"}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {room?.owner_id ?? "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick summary */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
              สรุปห้อง
            </div>
            <div className="p-5 text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600 dark:text-gray-300">
                  จำนวนสมาชิก
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {memberTotal}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600 dark:text-gray-300">
                  ขีดจำกัด
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {room?.max_members ?? "-"}
                </span>
              </div>

              {/* 🔽 Dropdown เปลี่ยนสถานะห้อง */}
              <div className="mt-3">
                <label className="mb-1 block text-gray-600 dark:text-gray-300">
                  สถานะห้อง
                </label>
                <div className="flex items-center gap-2">
                  <Select
                    value={statusDraft}
                    onChange={(e) =>
                      setStatusDraft(e.target.value as Room["status"])
                    }
                    className="w-full"
                  >
                    {ROOM_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s] ?? s}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleSaveStatus}
                    disabled={
                      !room ||
                      !statusDraft ||
                      statusDraft === room?.status ||
                      savingStatus
                    }
                    aria-busy={savingStatus}
                  >
                    {savingStatus && <Spinner size="sm" className="mr-2" />}
                    บันทึก
                  </Button>
                </div>

                {/* ข้อความสำเร็จ (เล็ก ๆ) */}
                {statusMsg && (
                  <div className="mt-2 rounded border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {statusMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
              รายละเอียดเพิ่มเติม
            </div>
            <div className="p-5 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600 dark:text-gray-300">
                  Room ID
                </span>
                <span className="font-medium">{room?.id ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600 dark:text-gray-300">
                  Raid Boss ID
                </span>
                <span className="font-medium">{room?.raid_boss_id ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mx-auto mt-4 max-w-screen-xl">
          <AlertComponent type="info" message="กำลังโหลดข้อมูล..." />
        </div>
      )}

      {/* Modal ยืนยันลบ */}
      {showDeleteModal && (
        <ModalComponent
          header="ยืนยันการลบ"
          msg="คุณต้องการลบห้องนี้หรือไม่?"
          id={deleteId ?? undefined}
          onConfirm={handleConfirmDelete}
          onClose={handleCloseDelete}
        />
      )}

      {/* Modal ยืนยันลบ */}
      {showKickModal && (
        <ModalComponent
          header="ยืนยันการเตะสมาชิก"
          msg="คุณต้องการเตะสมาชิกท่านนี้หรือไม่?"
          id={kickUserId ?? undefined}
          onConfirm={kickMember}
          onClose={handleCloseKick}
        />
      )}
    </div>
  );
}
