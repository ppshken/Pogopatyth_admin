import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, TextInput, Label, Select, Alert, Spinner } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

/* ---------- Types ---------- */
type FormState = {
  pokemon_id: string;
  pokemon_name: string;
  pokemon_tier: string;
  start_date: string; // input[type=date] -> "YYYY-MM-DD"
  end_date: string;   // input[type=date] -> "YYYY-MM-DD"
  imageMode: "url" | "upload";
  pokemon_image_url: string;
  imageFile: File | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
};

/* ---------- Constants ---------- */
const tierOptions = ["1", "2", "3", "4", "5", "6"];

/* ---------- Utils ---------- */
// "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DD HH:mm:ss"
function fromInputValue(v?: string) {
  if (!v) return "";
  const [d, t] = v.split("T"); // ถ้าเป็น date จะไม่มีเวลา
  const hhmm = (t || "00:00").length === 5 ? `${t}:00` : t || "00:00:00";
  return `${d} ${hhmm}`;
}

/* Avatar fallback (ตัวอักษรแรก + สีคงที่) */
const AVATAR_COLORS = [
  "bg-rose-500","bg-orange-500","bg-amber-500","bg-lime-500",
  "bg-emerald-500","bg-teal-500","bg-cyan-500","bg-sky-500",
  "bg-blue-500","bg-indigo-500","bg-violet-500","bg-purple-500",
  "bg-fuchsia-500","bg-pink-500",
];
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function getInitial(name?: string, id?: string) {
  const base = (name && name.trim()) || (id ? String(id) : "?");
  return base.charAt(0).toUpperCase();
}
function FallbackAvatar({
  name,
  id,
  size = 28, // px
}: { name?: string; id?: string; size?: number }) {
  const key = (name?.toLowerCase() || `mon_${id ?? ""}`);
  const color = AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length];
  const cls = `rounded-lg ${color} flex items-center justify-center font-semibold uppercase text-white ring-1 ring-black/10`;
  return (
    <div
      className={cls}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.floor(size * 0.42)) }}
      title={name || (id ? `#${id}` : "pokemon")}
    >
      {getInitial(name, id)}
    </div>
  );
}

export default function AddRaidboss() {
  const [form, setForm] = useState<FormState>({
    pokemon_id: "",
    pokemon_name: "",
    pokemon_tier: "",
    start_date: "",
    end_date: "",
    imageMode: "url",
    pokemon_image_url: "",
    imageFile: null,
  });

  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE as string;
  const CREATE_URL = `${API_BASE}/api/admin/raidboss/add.php`;

  function change<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  // อัปเดต/ล้าง preview สำหรับไฟล์อัปโหลด
  useEffect(() => {
    if (form.imageMode === "upload" && form.imageFile) {
      const url = URL.createObjectURL(form.imageFile);
      setUploadPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setUploadPreview(null);
  }, [form.imageMode, form.imageFile]);

  // src พรีวิว (เลือกจาก URL หรือ upload)
  const previewSrc = useMemo(() => {
    if (form.imageMode === "upload") return uploadPreview || undefined;
    return form.pokemon_image_url || undefined;
  }, [form.imageMode, uploadPreview, form.pokemon_image_url]);

  function validate(): string | null {
    if (!form.pokemon_id.trim()) return "กรุณากรอก Pokemon ID";
    if (!/^\d+$/.test(form.pokemon_id.trim())) return "Pokemon ID ต้องเป็นตัวเลข";
    if (!form.pokemon_name.trim()) return "กรุณากรอกชื่อโปเกม่อน";
    if (!form.pokemon_tier.trim()) return "กรุณาเลือก Tier";
    if (!form.start_date) return "กรุณาเลือกวันเริ่ม";
    if (!form.end_date) return "กรุณาเลือกวันสิ้นสุด";

    const start = new Date(form.start_date).getTime();
    const end = new Date(form.end_date).getTime();
    if (start && end && start > end) return "วันเริ่มต้องไม่มากกว่าวันสิ้นสุด";

    if (form.imageMode === "url") {
      if (form.pokemon_image_url && !/^https?:\/\//i.test(form.pokemon_image_url)) {
        return "รูปแบบ URL รูปไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)";
      }
    } else {
      if (!form.imageFile) return "กรุณาอัปโหลดไฟล์รูปหรือสลับไปโหมด URL";
      if (!/^image\//.test(form.imageFile.type)) return "ไฟล์ต้องเป็นรูปภาพเท่านั้น";
      if (form.imageFile.size > 2 * 1024 * 1024) return "ไฟล์รูปต้องไม่เกิน 2MB";
    }
    return null;
  }

  async function handleSubmit() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const token = localStorage.getItem("auth_token") || "";

    try {
      const common = {
        pokemon_id: Number(form.pokemon_id.trim()),
        pokemon_name: form.pokemon_name.trim(),
        pokemon_tier: form.pokemon_tier,
        start_date: fromInputValue(form.start_date),
        end_date: fromInputValue(form.end_date),
      };

      let res: Response;
      if (form.imageMode === "upload" && form.imageFile) {
        const fd = new FormData();
        fd.append("pokemon_id", String(common.pokemon_id));
        fd.append("pokemon_name", common.pokemon_name);
        fd.append("pokemon_tier", String(common.pokemon_tier));
        fd.append("start_date", common.start_date);
        fd.append("end_date", common.end_date);
        fd.append("image", form.imageFile);

        res = await fetch(CREATE_URL, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          body: fd,
        });
      } else {
        const body: Record<string, unknown> = { ...common };
        if (form.pokemon_image_url.trim()) {
          body.pokemon_image = form.pokemon_image_url.trim();
        }
        res = await fetch(CREATE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(body),
        });
      }

      const data: ApiResponse = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Server returned ${res.status}`);
      }

      setSuccessMsg(data.message || "สร้าง Raid Boss สำเร็จ");
      navigate("/admin/raidboss");
    } catch (e) {
      setError(getErrorMessage(e) || "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              เพิ่มบอสใหม่
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              เพิ่มข้อมูลบอสใหม่ พร้อมตั้งช่วงวันที่และรูปภาพ
            </p>
          </div>
          <div className="flex gap-2">
            <Button color="gray" onClick={() => navigate("/admin/raidboss")}>
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} aria-busy={submitting}>
              {submitting && <Spinner size="sm" className="mr-2" />}
              บันทึก
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mb-4">
            <AlertComponent type="success" message={successMsg} />
          </div>
        )}
        {error && (
          <div className="mb-4">
            <Alert color="failure">{error}</Alert>
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Left: Basic + Schedule */}
          <div className="md:col-span-2 space-y-4">
            {/* Card: Basic info */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full" />
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="pokemon_id">Pokemon ID</Label>
                    <TextInput
                      id="pokemon_id"
                      type="number"
                      inputMode="numeric"
                      placeholder="เช่น 384"
                      value={form.pokemon_id}
                      onChange={(e) => change("pokemon_id", e.target.value)}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      ต้องเป็นตัวเลข เช่น 150 (Mewtwo), 384 (Rayquaza)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="pokemon_name">Pokemon Name</Label>
                    <TextInput
                      id="pokemon_name"
                      placeholder="เช่น Rayquaza"
                      value={form.pokemon_name}
                      onChange={(e) => change("pokemon_name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="pokemon_tier">Pokemon Tier</Label>
                    <Select
                      id="pokemon_tier"
                      value={form.pokemon_tier}
                      onChange={(e) => change("pokemon_tier", e.target.value)}
                      required
                    >
                      <option value="">เลือก Tier</option>
                      {tierOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Schedule */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full" />
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <TextInput
                      id="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => change("start_date", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <TextInput
                      id="end_date"
                      type="date"
                      value={form.end_date}
                      min={form.start_date || undefined}
                      onChange={(e) => change("end_date", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  ถ้าไม่ระบุเวลา ระบบจะตั้งเป็น 00:00:00 ของวันที่เลือก
                </p>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full" />
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Button
                    size="xs"
                    color={form.imageMode === "url" ? "info" : "light"}
                    onClick={() => change("imageMode", "url")}
                  >
                    ใช้ URL
                  </Button>
                  <Button
                    size="xs"
                    color={form.imageMode === "upload" ? "info" : "light"}
                    onClick={() => change("imageMode", "upload")}
                  >
                    อัปโหลดไฟล์
                  </Button>
                </div>

                {form.imageMode === "url" ? (
                  <div className="space-y-2">
                    <Label htmlFor="pokemon_image_url">Pokemon Image URL</Label>
                    <TextInput
                      id="pokemon_image_url"
                      placeholder="https://..."
                      value={form.pokemon_image_url}
                      onChange={(e) => change("pokemon_image_url", e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      รองรับลิงก์ http/https เท่านั้น
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="imageFile">Upload Image</Label>
                    <input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
                      onChange={(e) => change("imageFile", e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-gray-500">
                      ไฟล์ไม่เกิน 2MB (PNG/JPG/WebP)
                    </p>
                  </div>
                )}

                {/* Preview */}
                <div className="mt-4">
                  <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Preview
                  </div>
                  <div className="flex items-center gap-3">
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt="preview"
                        className="h-28 w-28 rounded-lg object-cover ring-1 ring-gray-200"
                      />
                    ) : (
                      <FallbackAvatar name={form.pokemon_name} id={form.pokemon_id} size={112} />
                    )}
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      <div>
                        <span className="text-gray-500">Name:</span>{" "}
                        <span className="font-medium">{form.pokemon_name || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ID:</span>{" "}
                        <span className="font-medium">{form.pokemon_id || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tier:</span>{" "}
                        <span className="font-medium">{form.pokemon_tier || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions (duplicate for mobile ergonomics) */}
                <div className="mt-4 flex gap-2 md:hidden">
                  <Button color="gray" className="flex-1" onClick={() => navigate("/admin/raidboss")}>
                    ยกเลิก
                  </Button>
                  <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Spinner size="sm" className="mr-2" />}
                    บันทึก
                  </Button>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
              แนะนำ: ตั้งช่วงวันที่ให้ครอบคลุมการหมุนเวียนบอส และตั้งรูปภาพให้ตรงตามบอสเพื่อให้ผู้ใช้จดจำได้ง่าย
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
