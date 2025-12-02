import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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

/* ---------- Types ---------- */
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
  maximum: string;
  imageMode: "url" | "upload";
  pokemon_image_url: string;
  imageFile: File | null;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
};

// Type สำหรับข้อมูล Pokemon จาก API
type PokemonOption = {
  id: number;
  name: string;
};

/* ---------- Constants ---------- */
const tierOptions = ["1", "3", "4", "5", "6"]; // ปรับ Tier ตามเกมจริง (ปัจจุบันหลักๆ คือ 1, 3, 5, Mega/Primal คือ 6)
const typeOptions = ["normal", "shadow", "mega", "dynamax", "gigantamax"];

/* ---------- Utils ---------- */
// "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DD HH:mm:ss"
function fromInputValue(v?: string) {
  if (!v) return "";
  const [d, t] = v.split("T");
  const hhmm = (t || "00:00").length === 5 ? `${t}:00` : t || "00:00:00";
  return `${d} ${hhmm}`;
}

/* Avatar fallback */
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
function getInitial(name?: string, id?: string) {
  const base = (name && name.trim()) || (id ? String(id) : "?");
  return base.charAt(0).toUpperCase();
}
function FallbackAvatar({
  name,
  id,
  size = 28,
}: {
  name?: string;
  id?: string;
  size?: number;
}) {
  const key = name?.toLowerCase() || `mon_${id ?? ""}`;
  const color = AVATAR_COLORS[hashString(key) % AVATAR_COLORS.length];
  const cls = `rounded-lg ${color} flex items-center justify-center font-semibold uppercase text-white ring-1 ring-black/10`;
  return (
    <div
      className={cls}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, Math.floor(size * 0.42)),
      }}
      title={name || (id ? `#${id}` : "pokemon")}
    >
      {getInitial(name, id)}
    </div>
  );
}

export default function AddRaidboss() {
  const POKE_BASE =
    "https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/full";

  const buildPokeUrl = (rawId: string) => {
    const digits = rawId.replace(/\D/g, "");
    if (!digits) return "";
    const n = Number(digits);
    const idStr = n < 1000 ? String(n).padStart(3, "0") : String(n);
    return `${POKE_BASE}/${idStr}.png`;
  };

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
    maximum: "6",
    imageMode: "url",
    pokemon_image_url: "",
    imageFile: null,
  });

  // State สำหรับเก็บรายชื่อโปเกม่อน
  const [pokemonList, setPokemonList] = useState<PokemonOption[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // ดึงข้อมูล Pokemon จาก API
  useEffect(() => {
    const fetchPokemonList = async () => {
      try {
        const res = await fetch(
          "https://pogoapi.net/api/v1/pokemon_names.json",
        );
        const data = await res.json();

        // แปลง Object เป็น Array แล้วเรียงตาม ID
        const list: PokemonOption[] = Object.values(data)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
          }))
          .sort((a: any, b: any) => a.id - b.id);

        setPokemonList(list);
      } catch (err) {
        console.error("Failed to fetch pokemon names", err);
      } finally {
        setLoadingList(false);
      }
    };

    fetchPokemonList();
  }, []);

  // ฟังก์ชันเมื่อเลือก Dropdown Pokemon
  const handlePokemonSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;

    // หาข้อมูลจาก list
    const selectedPokemon = pokemonList.find(
      (p) => String(p.id) === selectedId,
    );

    if (selectedPokemon) {
      setForm((prev) => ({
        ...prev,
        pokemon_id: String(selectedPokemon.id),
        pokemon_name: selectedPokemon.name,
        pokemon_image_url: buildPokeUrl(String(selectedPokemon.id)), // Auto URL
      }));
    } else {
      // กรณีเลือก default
      setForm((prev) => ({
        ...prev,
        pokemon_id: "",
        pokemon_name: "",
        pokemon_image_url: "",
      }));
    }
  };

  const handleChange = (name: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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

  useEffect(() => {
    if (form.imageMode === "upload" && form.imageFile) {
      const url = URL.createObjectURL(form.imageFile);
      setUploadPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setUploadPreview(null);
  }, [form.imageMode, form.imageFile]);

  const previewSrc = useMemo(() => {
    if (form.imageMode === "upload") return uploadPreview || undefined;
    return form.pokemon_image_url || undefined;
  }, [form.imageMode, uploadPreview, form.pokemon_image_url]);

  function validate(): string | null {
    if (!form.pokemon_id.trim()) return "กรุณาเลือกโปเกม่อน";
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
        type: form.type,
        special: form.special ? 1 : 0,
        cp_normal_min: form.cp_normal_min ? Number(form.cp_normal_min) : null,
        cp_normal_max: form.cp_normal_max ? Number(form.cp_normal_max) : null,
        cp_boost_min: form.cp_boost_min ? Number(form.cp_boost_min) : null,
        cp_boost_max: form.cp_boost_max ? Number(form.cp_boost_max) : null,
        start_date: fromInputValue(form.start_date),
        end_date: fromInputValue(form.end_date),
        maximum: form.maximum ? Number(form.maximum) : null,
      };

      let res: Response;
      if (form.imageMode === "upload" && form.imageFile) {
        const fd = new FormData();
        Object.entries(common).forEach(([key, value]) => {
          if (value !== null) fd.append(key, String(value));
        });
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
              เลือกโปเกม่อนจากรายการ เพื่อเพิ่มเป็น Raid Boss
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
                  {/* --- ส่วนที่แก้ไข: Dropdown เลือก Pokemon --- */}
                  <div className="sm:col-span-2">
                    <Label htmlFor="pokemon_select">
                      เลือกโปเกม่อน (Auto ID & Name)
                    </Label>
                    <Select
                      id="pokemon_select"
                      value={form.pokemon_id}
                      onChange={handlePokemonSelect}
                      required
                      disabled={loadingList}
                    >
                      <option value="">
                        {loadingList
                          ? "กำลังโหลดรายชื่อ..."
                          : "-- เลือกโปเกม่อน --"}
                      </option>
                      {!loadingList &&
                        pokemonList.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{String(p.id).padStart(3, "0")} - {p.name}
                          </option>
                        ))}
                    </Select>
                  </div>
                  {/* --- จบส่วนแก้ไข --- */}

                  <div>
                    <Label htmlFor="pokemon_id">Pokemon ID (Auto)</Label>
                    <TextInput
                      id="pokemon_id"
                      value={form.pokemon_id}
                      readOnly
                      color="gray" // ให้ดูเหมือน Readonly
                    />
                  </div>

                  <div>
                    <Label htmlFor="pokemon_name">ชื่อโปเกม่อน (Auto)</Label>
                    <TextInput
                      id="pokemon_name"
                      value={form.pokemon_name}
                      readOnly
                      color="gray"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pokemon_tier">เทียร์</Label>
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
                    <Label htmlFor="type">Pokemon Type</Label>
                    <Select
                      id="type"
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

                  <div>
                    <Label htmlFor="maximum">จำนวนผู้เข้าร่วมสูงสุด</Label>
                    <TextInput
                      id="maximum"
                      type="number"
                      placeholder="เช่น 5"
                      value={form.maximum}
                      onChange={(e) => change("maximum", e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 sm:col-span-2">
                    <input
                      id="special"
                      type="checkbox"
                      checked={form.special}
                      onChange={(e) => change("special", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2"
                    />
                    <Label htmlFor="special" className="m-0 cursor-pointer">
                      Special Form (Shadow, Mega, etc.)
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Combat Power Stats */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-red-500" />
              <div className="p-4">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  CP Stats (Optional)
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="cp_normal_min">CP Normal Min</Label>
                    <TextInput
                      id="cp_normal_min"
                      type="number"
                      value={form.cp_normal_min}
                      onChange={(e) => change("cp_normal_min", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cp_normal_max">CP Normal Max</Label>
                    <TextInput
                      id="cp_normal_max"
                      type="number"
                      value={form.cp_normal_max}
                      onChange={(e) => change("cp_normal_max", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cp_boost_min">CP Boost Min</Label>
                    <TextInput
                      id="cp_boost_min"
                      type="number"
                      value={form.cp_boost_min}
                      onChange={(e) => change("cp_boost_min", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cp_boost_max">CP Boost Max</Label>
                    <TextInput
                      id="cp_boost_max"
                      type="number"
                      value={form.cp_boost_max}
                      onChange={(e) => change("cp_boost_max", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Image & Time */}
          <div className="space-y-4">
            {/* Card: Schedule */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="p-4">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                  ช่วงเวลา
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="start_date">วันที่เริ่มต้น</Label>
                    <TextInput
                      id="start_date"
                      type="datetime-local" // แนะนำใช้ datetime-local ถ้า backend รองรับ YYYY-MM-DD HH:mm
                      value={form.start_date}
                      onChange={(e) => change("start_date", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">วันที่สิ้นสุด</Label>
                    <TextInput
                      id="end_date"
                      type="datetime-local"
                      value={form.end_date}
                      min={form.start_date || undefined}
                      onChange={(e) => change("end_date", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Image */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:ring-0">
              <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-cyan-500" />
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
                    <Label htmlFor="pokemon_image_url">
                      Pokemon Image URL (Auto)
                    </Label>
                    <TextInput
                      id="pokemon_image_url"
                      placeholder="https://..."
                      value={form.pokemon_image_url}
                      onChange={(e) =>
                        change("pokemon_image_url", e.target.value)
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="imageFile">Upload Image</Label>
                    <input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
                      onChange={(e) =>
                        change("imageFile", e.target.files?.[0] || null)
                      }
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-col items-center">
                  <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    Preview
                  </div>
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt="preview"
                      className="h-28 w-28 rounded-lg bg-gray-50 object-contain ring-1 ring-gray-200"
                    />
                  ) : (
                    <FallbackAvatar
                      name={form.pokemon_name}
                      id={form.pokemon_id}
                      size={112}
                    />
                  )}
                  <div className="mt-2 text-center text-xs text-gray-500">
                    {form.pokemon_name || "ยังไม่ระบุชื่อ"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
