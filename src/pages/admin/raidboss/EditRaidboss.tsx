import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Button,
  TextInput,
  Label,
  Select,
  Alert,
  Spinner,
} from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

type FormState = {
  pokemon_id: string;
  pokemon_name: string;
  pokemon_image: string;
  pokemon_tier: string;
  type: string;
  special: boolean;
  cp_normal_min: string;
  cp_normal_max: string;
  cp_boost_min: string;
  cp_boost_max: string;
  start_date: string;
  end_date: string;
  imageMode: "url" | "upload";
  pokemon_image_url: string;
  imageFile: File | null;
};

const tierOptions = ["1", "2", "3", "4", "5", "6"];
const typeOptions = ["normal", "shadow", "mega", "dynamax", "gigantamax"];

// "YYYY-MM-DD" -> "YYYY-MM-DD HH:mm:ss"
function fromInputValue(v?: string) {
  if (!v) return "";
  return `${v} 00:00:00`;
}
// "YYYY-MM-DD HH:mm:ss" (หรือ ISO) -> "YYYY-MM-DD"
function toDateInput(v?: string | null) {
  if (!v) return "";
  const s = String(v);
  if (s.includes("T")) return s.split("T")[0] || "";
  if (s.includes(" ")) return s.split(" ")[0] || "";
  return s.slice(0, 10);
}

export default function EditRaidboss() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    pokemon_id: "",
    pokemon_name: "",
    pokemon_image: "",
    pokemon_tier: "",
    type: "",
    special: false,
    cp_normal_min: "",
    cp_normal_max: "",
    cp_boost_min: "",
    cp_boost_max: "",
    start_date: "",
    end_date: "",
    imageMode: "url",
    pokemon_image_url: "",
    imageFile: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE as string;
  const GET_URL = `${API_BASE}/api/admin/raidboss/detail.php?id=${encodeURIComponent(
    id || "",
  )}`;
  const UPDATE_URL = `${API_BASE}/api/admin/raidboss/update.php`; // <- ปรับตามไฟล์จริง

  function change<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validate(): string | null {
    if (!form.pokemon_id.trim()) return "กรุณากรอก Pokemon ID";
    if (!/^\d+$/.test(form.pokemon_id.trim()))
      return "Pokemon ID ต้องเป็นตัวเลข";
    if (!form.pokemon_name.trim()) return "กรุณากรอกชื่อโปเกม่อน";
    if (!form.pokemon_tier.trim()) return "กรุณาเลือก Tier";
    if (!form.type.trim()) return "กรุณาเลือก Type";
    if (!form.start_date) return "กรุณาเลือกวันเริ่ม";
    if (!form.end_date) return "กรุณาเลือกวันสิ้นสุด";

    if (
      form.cp_normal_min ||
      form.cp_normal_max ||
      form.cp_boost_min ||
      form.cp_boost_max
    ) {
      const cpMin = form.cp_normal_min ? Number(form.cp_normal_min) : 0;
      const cpMax = form.cp_normal_max ? Number(form.cp_normal_max) : 0;
      if (cpMin && cpMax && cpMin > cpMax)
        return "CP Min ต้องไม่มากกว่า CP Max";

      const cpBoostMin = form.cp_boost_min ? Number(form.cp_boost_min) : 0;
      const cpBoostMax = form.cp_boost_max ? Number(form.cp_boost_max) : 0;
      if (cpBoostMin && cpBoostMax && cpBoostMin > cpBoostMax)
        return "CP Boost Min ต้องไม่มากกว่า CP Boost Max";
    }

    const start = new Date(form.start_date).getTime();
    const end = new Date(form.end_date).getTime();
    if (start && end && start > end) return "วันเริ่มต้องไม่มากกว่าวันสิ้นสุด";

    if (form.imageMode === "url") {
      if (
        form.pokemon_image_url &&
        !/^https?:\/\//i.test(form.pokemon_image_url)
      ) {
        return "รูปแบบ URL รูปไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)";
      }
    } else {
      if (!form.imageFile) return "กรุณาอัปโหลดไฟล์รูปหรือสลับไปโหมด URL";
      if (form.imageFile.size > 2 * 1024 * 1024)
        return "ไฟล์รูปต้องไม่เกิน 2MB";
    }
    return null;
  }

  // โหลดข้อมูลเดิมมาเติมในฟอร์ม
  useEffect(() => {
    (async () => {
      if (!id) {
        setError("ไม่พบ ID");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("auth_token") || "";
        const res = await fetch(GET_URL, {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const body = await res.json();
        if (!body?.success)
          throw new Error(body?.message || "โหลดข้อมูลไม่สำเร็จ");

        const b = body.data || body.boss || {};
        setForm({
          pokemon_id: String(b.pokemon_id ?? ""),
          pokemon_name: String(b.pokemon_name ?? ""),
          pokemon_image: String(b.pokemon_image ?? ""),
          pokemon_tier: String(b.pokemon_tier ?? ""),
          type: String(b.type ?? ""),
          special: Boolean(b.special) || false,
          cp_normal_min: String(b.cp_normal_min ?? ""),
          cp_normal_max: String(b.cp_normal_max ?? ""),
          cp_boost_min: String(b.cp_boost_min ?? ""),
          cp_boost_max: String(b.cp_boost_max ?? ""),
          start_date: toDateInput(b.start_date),
          end_date: toDateInput(b.end_date),
          imageMode: "url",
          pokemon_image_url: String(b.pokemon_image ?? ""),
          imageFile: null,
        });
      } catch (e) {
        setError(getErrorMessage(e) || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        id: Number(id),
        pokemon_id: Number(form.pokemon_id.trim()),
        pokemon_name: form.pokemon_name.trim(),
        pokemon_tier: form.pokemon_tier,
        type: form.type,
        special: form.special ? 1 : 0,
        cp_normal_min: form.cp_normal_min ? Number(form.cp_normal_min) : null,
        cp_normal_max: form.cp_normal_max ? Number(form.cp_normal_max) : null,
        cp_boost_min: form.cp_boost_min ? Number(form.cp_boost_min) : null,
        cp_boost_max: form.cp_boost_max ? Number(form.cp_boost_max) : null,
        start_date: fromInputValue(form.start_date),
        end_date: fromInputValue(form.end_date),
      };

      let res: Response;

      if (form.imageMode === "upload" && form.imageFile) {
        const fd = new FormData();
        fd.append("id", String(common.id));
        fd.append("pokemon_id", String(common.pokemon_id));
        fd.append("pokemon_name", common.pokemon_name);
        fd.append("pokemon_tier", String(common.pokemon_tier));
        fd.append("type", String(common.type));
        fd.append("special", String(common.special));
        if (common.cp_normal_min)
          fd.append("cp_normal_min", String(common.cp_normal_min));
        if (common.cp_normal_max)
          fd.append("cp_normal_max", String(common.cp_normal_max));
        if (common.cp_boost_min)
          fd.append("cp_boost_min", String(common.cp_boost_min));
        if (common.cp_boost_max)
          fd.append("cp_boost_max", String(common.cp_boost_max));
        fd.append("start_date", common.start_date);
        fd.append("end_date", common.end_date);
        fd.append("image", form.imageFile);

        res = await fetch(UPDATE_URL, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          body: fd,
        });
      } else {
        const body: any = { ...common };
        if (form.pokemon_image_url.trim()) {
          body.pokemon_image = form.pokemon_image_url.trim();
        }
        res = await fetch(UPDATE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Server returned ${res.status}`);
      }

      setSuccessMsg(data.message || "อัปเดต Raid Boss สำเร็จ");
      navigate("/admin/raidboss", {
        replace: true,
        state: { alert: "success", msg: data.message || "อัปเดตเรียบร้อย" },
      });
    } catch (e) {
      setError(getErrorMessage(e) || "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">กำลังโหลด...</div>;
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              แก้ไขบอส
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              แก้ไขข้อมูล Raid Boss (ID: {id})
            </p>
          </div>
          <div className="flex gap-2">
            <Button color="gray" onClick={() => navigate("/admin/raidboss")}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              aria-busy={submitting}
            >
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
          {/* Left: Basic Info + Stats */}
          <div className="space-y-4 md:col-span-2">
            {/* Card: Basic Info */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              <div className="p-4">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  ข้อมูลพื้นฐาน
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Pokemon ID</Label>
                    <TextInput
                      type="number"
                      placeholder="เช่น 384"
                      value={form.pokemon_id}
                      onChange={(e) => change("pokemon_id", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Pokemon Name</Label>
                    <TextInput
                      placeholder="เช่น Rayquaza"
                      value={form.pokemon_name}
                      onChange={(e) => change("pokemon_name", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Tier</Label>
                    <Select
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

                  <div>
                    <Label>Pokemon Type</Label>
                    <Select
                      value={form.type}
                      onChange={(e) => change("type", e.target.value)}
                      required
                    >
                      <option value="">เลือก Type</option>
                      {typeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Special (Optional)</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        id="special"
                        type="checkbox"
                        checked={form.special}
                        onChange={(e) => change("special", e.target.checked)}
                      />
                      <label
                        htmlFor="special"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        เป็นบอสพิเศษ (เช่น Shadow, Mega Evolution)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Combat Power Stats */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-red-500" />
              <div className="p-4">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  CP Stats
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>CP Normal Min</Label>
                    <TextInput
                      type="number"
                      inputMode="numeric"
                      placeholder="เช่น 1500"
                      value={form.cp_normal_min}
                      onChange={(e) => change("cp_normal_min", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>CP Normal Max</Label>
                    <TextInput
                      type="number"
                      inputMode="numeric"
                      placeholder="เช่น 1800"
                      value={form.cp_normal_max}
                      onChange={(e) => change("cp_normal_max", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>CP Boost Min</Label>
                    <TextInput
                      type="number"
                      inputMode="numeric"
                      placeholder="เช่น 1875"
                      value={form.cp_boost_min}
                      onChange={(e) => change("cp_boost_min", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>CP Boost Max</Label>
                    <TextInput
                      type="number"
                      inputMode="numeric"
                      placeholder="เช่น 2250"
                      value={form.cp_boost_max}
                      onChange={(e) => change("cp_boost_max", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Schedule */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="p-4">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  ช่วงเวลา
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Start Date</Label>
                    <TextInput
                      type="date"
                      value={form.start_date}
                      onChange={(e) => change("start_date", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <TextInput
                      type="date"
                      value={form.end_date}
                      onChange={(e) => change("end_date", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-cyan-500" />
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Button
                    size="xs"
                    color={form.imageMode === "url" ? "info" : "light"}
                    onClick={() => change("imageMode", "url")}
                    className="dark:text-white"
                  >
                    ใช้ URL
                  </Button>
                  <Button
                    size="xs"
                    color={form.imageMode === "upload" ? "info" : "light"}
                    onClick={() => change("imageMode", "upload")}
                    className="dark:text-white"
                  >
                    อัปโหลดไฟล์
                  </Button>
                </div>

                {form.imageMode === "url" ? (
                  <div className="space-y-2">
                    <Label>Pokemon Image (URL)</Label>
                    <TextInput
                      placeholder="https://..."
                      value={form.pokemon_image_url}
                      onChange={(e) =>
                        change("pokemon_image_url", e.target.value)
                      }
                    />
                    <div className="mt-2">
                      {form.pokemon_image_url ? (
                        <img
                          src={form.pokemon_image_url}
                          alt="preview"
                          className="h-28 w-28 rounded object-cover ring-1 ring-gray-200"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Upload File Image</Label>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-sm"
                      onChange={(e) =>
                        change("imageFile", e.target.files?.[0] || null)
                      }
                    />
                    <div className="mt-2">
                      {form.imageFile ? (
                        <img
                          src={URL.createObjectURL(form.imageFile)}
                          alt="preview"
                          className="h-28 w-28 rounded object-cover ring-1 ring-gray-200"
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
