import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, TextInput, Label, Select, Alert } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

type FormState = {
  pokemon_id: string;
  pokemon_name: string;
  pokemon_tier: string;
  start_date: string; // input[type=date] -> "YYYY-MM-DD"
  end_date: string;   // input[type=date]
  imageMode: "url" | "upload";
  pokemon_image_url: string;
  imageFile: File | null;
};

type UpdateRaidbossPayload = {
  id: number;                       // ถ้าเป็นหน้า Edit ต้องมี id
  pokemon_id: number;
  pokemon_name: string;
  pokemon_tier: string;
  start_date: string;               // "YYYY-MM-DD HH:mm:ss"
  end_date: string;                 // "YYYY-MM-DD HH:mm:ss"
  pokemon_image?: string;           // ใส่เฉพาะมีค่า
};

const tierOptions = ["1", "2", "3", "4", "5", "6"];

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
    pokemon_tier: "",
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
    id || ""
  )}`;
  const UPDATE_URL = `${API_BASE}/api/admin/raidboss/update.php`; // <- ปรับตามไฟล์จริง

  function change<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

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
      if (form.imageFile.size > 2 * 1024 * 1024) return "ไฟล์รูปต้องไม่เกิน 2MB";
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
        if (!body?.success) throw new Error(body?.message || "โหลดข้อมูลไม่สำเร็จ");

        const b = body.data || body.boss || {};
        setForm({
          pokemon_id: String(b.pokemon_id ?? ""),
          pokemon_name: String(b.pokemon_name ?? ""),
          pokemon_tier: String(b.pokemon_tier ?? ""),
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
        fd.append("start_date", common.start_date);
        fd.append("end_date", common.end_date);
        fd.append("image", form.imageFile); // ชื่อฟิลด์ฝั่ง PHP ต้องรับ "image"

        res = await fetch(UPDATE_URL, {
          method: "POST",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
          body: fd, // ห้ามใส่ Content-Type เอง
        });
      } else {
        const body: UpdateRaidbossPayload = { ...common };
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
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Edit Raid Boss
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        แก้ไขข้อมูล Raid Boss (ID: {id})
      </p>

      {successMsg && (
        <div className="mt-3">
          <AlertComponent type="success" message={successMsg} />
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Alert color="failure">{error}</Alert>
        </div>
      )}

      <div className="max-w-xl space-y-4">
        <div>
          <Label>Pokemon ID</Label>
          <TextInput
            id="pokemon_id"
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
            id="pokemon_name"
            placeholder="เช่น Rayquaza"
            value={form.pokemon_name}
            onChange={(e) => change("pokemon_name", e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Pokemon Tier</Label>
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

        <div>
          <Label>Start Date</Label>
          <TextInput
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={(e) => change("start_date", e.target.value)}
            required
          />
        </div>

        <div>
          <Label>End Date</Label>
          <TextInput
            id="end_date"
            type="date"
            value={form.end_date}
            onChange={(e) => change("end_date", e.target.value)}
            required
          />
        </div>

        {/* Image mode switch */}
        <div className="sm:col-span-2">
          <div className="mb-2 flex items-center gap-2">
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
            <div>
              <Label>Pokemon Image (URL)</Label>
              <TextInput
                id="pokemon_image_url"
                placeholder="https://..."
                value={form.pokemon_image_url}
                onChange={(e) => change("pokemon_image_url", e.target.value)}
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
            <div>
              <Label>Upload File Image</Label>
              <input
                id="imageFile"
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
                onChange={(e) => change("imageFile", e.target.files?.[0] || null)}
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

      <div className="mt-6 flex items-center gap-2">
        <Button onClick={handleSubmit} disabled={submitting}>
          บันทึกการแก้ไข
        </Button>
        <Button color="gray" onClick={() => navigate("/admin/raidboss")}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
