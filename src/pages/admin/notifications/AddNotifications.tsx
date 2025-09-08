// src/pages/admin/notifications/AddNotifications.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Button, Label, TextInput, Select, Textarea, Badge } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";
import { formatDate } from "../../../component/functions/formatDate";

type FormState = {
  title: string;
  message: string;
  target: "all" | "user" | "room";
  user_id: string; // when target=user
  room_id: string; // when target=room
};

const TITLE_MAX = 120;
const MESSAGE_MAX = 1000;

export default function AddNotifications() {
  const [form, setForm] = useState<FormState>({
    title: "",
    message: "",
    target: "all",
    user_id: "",
    room_id: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE as string;
  // ให้ตรงกับหลังบ้านของคุณ (create.php หรือ send.php ตามที่ตั้งไว้จริง)
  const CREATE_URL = `${API_BASE}/api/admin/notifications/create.php`;

  const msgCount = form.message.length;
  const titleCount = form.title.length;

  function change<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validate(): string | null {
    if (!form.title.trim()) return "กรุณากรอกหัวข้อ";
    if (form.title.trim().length > TITLE_MAX) return `หัวข้อต้องไม่เกิน ${TITLE_MAX} ตัวอักษร`;
    if (!form.message.trim()) return "กรุณากรอกข้อความ";
    if (form.message.trim().length > MESSAGE_MAX) return `ข้อความต้องไม่เกิน ${MESSAGE_MAX} ตัวอักษร`;

    if (form.target === "user") {
      if (!form.user_id.trim()) return "กรุณากรอก User ID";
      if (!/^\d+$/.test(form.user_id.trim())) return "User ID ต้องเป็นตัวเลข";
    }
    if (form.target === "room") {
      if (!form.room_id.trim()) return "กรุณากรอก Room ID";
      if (!/^\d+$/.test(form.room_id.trim())) return "Room ID ต้องเป็นตัวเลข";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const token = localStorage.getItem("auth_token") || "";
    
    try {
      // ✅ Normalize target ให้ตรงรูปแบบที่ API รอ
      let normalizedTarget: string = form.target;
      if (form.target === "user") normalizedTarget = `user:${Number(form.user_id.trim())}`;
      if (form.target === "room") normalizedTarget = `room:${Number(form.room_id.trim())}`;

      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        normalizedTarget, // ← ส่งเป็นสตริงเดียว (all / user:ID / room:ID)
        // ไม่ต้องส่ง user_id/room_id แยก ถ้าหลังบ้านไม่ได้รองรับ
      };

      const res = await fetch(CREATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data: { success?: boolean; message?: string } = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Server returned ${res.status}`);
      }

      setSuccessMsg(data.message || "ส่งการแจ้งเตือนเรียบร้อย");
      navigate("/admin/notifications", {
        state: { alert: "success", msg: data.message || "ส่งการแจ้งเตือนเรียบร้อย" },
      });
    } catch (e) {
      setError(getErrorMessage(e) || "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  const targetBadge = useMemo<"info" | "success" | "purple">(() => {
    if (form.target === "user") return "success";
    if (form.target === "room") return "purple";
    return "info";
  }, [form.target]);

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-5">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            ส่งการแจ้งเตือนใหม่
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            กำหนดหัวข้อ ข้อความ และกลุ่มเป้าหมายสำหรับการแจ้งเตือน
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4">
            <AlertComponent type="failure" message={error} />
          </div>
        )}
        {successMsg && (
          <div className="mb-4">
            <AlertComponent type="success" message={successMsg} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Form card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0"
          >
            <div className="h-1 w-full rounded-t-lg -mt-4 mb-4" />

            {/* Title */}
            <div className="mb-4">
              <Label>หัวข้อ</Label>
              <div className="relative">
                <TextInput
                  value={form.title}
                  onChange={(e) => change("title", e.target.value)}
                  placeholder="เช่น ประกาศระบบ / กิจกรรมพิเศษ"
                  required
                />
                <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {titleCount}/{TITLE_MAX}
                </div>
              </div>
            </div>

            {/* Target */}
            <div className="mb-4">
              <Label>กลุ่มเป้าหมาย</Label>
              <Select
                value={form.target}
                onChange={(e) => change("target", e.target.value as FormState["target"])}
              >
                <option value="all">ทั้งหมด</option>
                <option value="user">เฉพาะผู้ใช้ (ตาม User ID)</option>
                <option value="room">ตามห้อง (Room ID)</option>
              </Select>
            </div>

            {form.target === "user" && (
              <div className="mb-4">
                <Label>User ID</Label>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  placeholder="เช่น 42"
                  value={form.user_id}
                  onChange={(e) => change("user_id", e.target.value)}
                />
              </div>
            )}

            {form.target === "room" && (
              <div className="mb-4">
                <Label>Room ID</Label>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  placeholder="เช่น 59"
                  value={form.room_id}
                  onChange={(e) => change("room_id", e.target.value)}
                />
              </div>
            )}

            {/* Message */}
            <div className="mb-4">
              <Label>ข้อความ</Label>
              <div className="relative">
                <Textarea
                  rows={6}
                  value={form.message}
                  onChange={(e) => change("message", e.target.value)}
                  placeholder="พิมพ์ข้อความแจ้งเตือน…"
                  required
                />
                <div className="mt-1 text-right text-xs text-gray-400">
                  {msgCount}/{MESSAGE_MAX}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "กำลังส่ง..." : "ส่งประกาศ"}
              </Button>
              <Button color="light" type="button" onClick={() => navigate("/admin/notifications")}>
                ยกเลิก
              </Button>
            </div>
          </form>

          {/* Preview card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
            <div className="h-1 w-full rounded-t-lg -mt-4 mb-4" />
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                พรีวิวการแจ้งเตือน
              </h4>
              <Badge color={targetBadge} size="sm">
                {form.target}
              </Badge>
            </div>
            <div className="text-xs text-gray-500">
              จะส่งโดย <span className="font-medium">Admin</span> • {formatDate(new Date().toISOString())}
            </div>

            <div className="mt-3">
              <div className="text-base font-semibold text-gray-900 dark:text-white">
                {form.title || "หัวข้อการแจ้งเตือน"}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                {form.message || "ข้อความตัวอย่าง…"}
              </div>

              {form.target === "user" && form.user_id ? (
                <div className="mt-3 rounded-md bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                  ส่งถึงผู้ใช้: <span className="font-semibold">#{form.user_id}</span>
                </div>
              ) : null}

              {form.target === "room" && form.room_id ? (
                <div className="mt-3 rounded-md bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                  ส่งถึงห้อง: <span className="font-semibold">#{form.room_id}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
