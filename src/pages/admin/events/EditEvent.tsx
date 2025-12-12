import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router"; // ใช้ react-router
import { Button, Label, TextInput, Textarea } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

export default function EditEvent() {
  const { id } = useParams(); // รับ ID จาก URL
  const navigate = useNavigate();

  // State สำหรับ Form
  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    description: "",
    image: "",
  });

  // State สำหรับการโหลด
  const [fetching, setFetching] = useState(true); // โหลดข้อมูลเก่า
  const [saving, setSaving] = useState(false); // กำลังบันทึก
  const [error, setError] = useState<string | null>(null);

  // API Configuration
  const API_BASE =
    import.meta.env.VITE_API_BASE || "http://localhost/pogopartyth";

  // ✅ 1. ดึงข้อมูลเดิมเมื่อเข้าหน้านี้
  useEffect(() => {
    const fetchDetail = async () => {
      setFetching(true);
      setError(null);
      try {
        const token =
          localStorage.getItem("auth_token") || localStorage.getItem("token");

        // ต้องมี API get_by_id.php
        const res = await fetch(
          `${API_BASE}/api/admin/events/by_id.php?id=${id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        );

        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const body = await res.json();

        if (!body.success) throw new Error(body.message || "ไม่พบข้อมูล");

        const data = body.data;
        setFormData({
          id: data.id,
          title: data.title || "",
          description: data.description || "",
          image: data.image || "",
        });
      } catch (err) {
        setError(getErrorMessage(err) || "ไม่สามารถโหลดข้อมูลได้");
        // ถ้าหาไม่เจอ อาจจะเด้งกลับหน้า List
        // setTimeout(() => navigate("/admin/events"), 2000);
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchDetail();
  }, [id, API_BASE, navigate]);

  // ✅ 2. Handle Change Input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ 3. Submit Form (Save)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/admin/events/edit.php`, {
        method: "POST", // หรือ PUT ตาม Backend
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(formData),
      });

      const body = await res.json();

      if (!res.ok || body.success === false) {
        throw new Error(body.message || "บันทึกไม่สำเร็จ");
      }

      // ส่ง State กลับไปหน้ารายการเพื่อแสดง Alert
      navigate("/admin/events", {
        state: { alert: true, msg: "แก้ไขกิจกรรมเรียบร้อยแล้ว" },
      });
    } catch (err) {
      setError(getErrorMessage(err) || "เกิดข้อผิดพลาดขณะบันทึก");
    } finally {
      setSaving(false);
    }
  };

  // Loading State UI
  if (fetching) {
    return (
      <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
    );
  }

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">
          แก้ไขกิจกรรม (ID: {id})
        </h3>

        {error && (
          <div className="mb-4">
            <AlertComponent message={error} type="failure" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="title">หัวข้อกิจกรรม *</Label>
            </div>
            <TextInput
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Image URL */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="image">ลิงก์รูปภาพ (URL)</Label>
            </div>
            <TextInput
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="h-full w-full rounded border bg-gray-50 object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")} // ซ่อนถ้าโหลดรูปไม่ได้
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="description">รายละเอียด</Label>
            </div>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={20}
              required
            />
          </div>

          {/* Buttons */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              type="submit"
              disabled={saving}
              aria-busy={saving}
            >
              บันทึกการแก้ไข
            </Button>
            <Button color="gray" onClick={() => navigate("/admin/events")}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
