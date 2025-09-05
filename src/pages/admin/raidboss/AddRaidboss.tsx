import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, TextInput, Label, Select, Alert, Spinner } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";

type FormState = {
  pokemon_id: string;
  pokemon_name: string;
  pokemon_tier: string;
  start_date: string; // input[type=datetime-local] -> "YYYY-MM-DDTHH:mm"
  end_date: string;   // input[type=datetime-local]
  imageMode: "url" | "upload";
  pokemon_image_url: string;
  imageFile: File | null;
};

const tierOptions = ["1", "2", "3", "4", "5", "Mega", "Shadow", "Elite"];

// แปลงค่า input datetime-local -> รูปแบบที่ API ต้องการ "YYYY-MM-DD HH:mm:ss"
function fromInputValue(v?: string) {
  if (!v) return "";
  const [d, t] = v.split("T");
  const hhmm = (t || "00:00").length === 5 ? `${t}:00` : (t || "00:00:00");
  return `${d} ${hhmm}`;
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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE as string;
  const CREATE_URL = `${API_BASE}/api/admin/raidboss/add.php`; // <- ปรับตามไฟล์จริง

  function change<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function validate(): string | null {
    if (!form.pokemon_id.trim()) return "กรุณากรอก Pokemon ID";
    if (!/^\d+$/.test(form.pokemon_id.trim())) return "Pokemon ID ต้องเป็นตัวเลข";
    if (!form.pokemon_name.trim()) return "กรุณากรอกชื่อโปเกม่อน";
    if (!form.pokemon_tier.trim()) return "กรุณาเลือก Tier";
    if (!form.start_date) return "กรุณาเลือกวันเวลาเริ่ม";
    if (!form.end_date) return "กรุณาเลือกวันเวลาสิ้นสุด";

    const start = new Date(form.start_date).getTime();
    const end = new Date(form.end_date).getTime();
    if (start && end && start > end) return "วันเริ่มต้องไม่มากกว่าวันสิ้นสุด";

    if (form.imageMode === "url") {
      // ไม่บังคับใส่รูปก็ได้ แต่ถ้าใส่ ต้องเป็น http(s)
      if (form.pokemon_image_url && !/^https?:\/\//i.test(form.pokemon_image_url)) {
        return "รูปแบบ URL รูปไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)";
      }
    } else {
      if (!form.imageFile) return "กรุณาอัปโหลดไฟล์รูปหรือสลับไปโหมด URL";
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
          headers: { Authorization: token ? `Bearer ${token}` : "" }, // ห้ามเซ็ต Content-Type เองเวลาใช้ FormData
          body: fd,
        });
      } else {
        const body: any = { ...common };
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

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || `Server returned ${res.status}`);
      }

      setSuccessMsg(data.message || "สร้าง Raid Boss สำเร็จ");
      // กลับไปหน้ารายการ (ปรับ path ตาม routing จริง)
      navigate("/admin/raidboss");
    } catch (e: any) {
      setError(e.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Add Raid Boss</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        เพิ่มข้อมูล Raid Boss ใหม่ (รองรับรูปแบบ URL หรืออัปโหลดไฟล์)
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
            type="datetime-local"
            value={form.start_date}
            onChange={(e) => change("start_date", e.target.value)}
            required
          />
        </div>

        <div>
          <Label>End Date</Label>
          <TextInput
            id="end_date"
            type="datetime-local"
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
              <Label>Pokemon Images</Label>
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
        <Button onClick={handleSubmit} disabled={submitting} >
          บันทึก
        </Button>
        <Button color="gray" onClick={() => navigate("/admin/raidboss")}>
          ยกเลิก
        </Button>
      </div>
    </div>
  );
}
