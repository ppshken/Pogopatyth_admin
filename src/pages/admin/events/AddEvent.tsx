import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Label, TextInput, Textarea } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";
import { getErrorMessage } from "../../../component/functions/getErrorMessage";

export default function AddEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE || "http://localhost/pogopartyth";
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/admin/events/add.php`, {
        method: "POST",
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

      // ส่ง state กลับไปหน้ารายการเพื่อแสดง alert success
      navigate("/admin/events", {
        state: { alert: true, msg: "เพิ่มกิจกรรมสำเร็จเรียบร้อยแล้ว" },
      });
    } catch (err) {
      setError(getErrorMessage(err) || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mx-auto max-w-screen-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-5 text-xl font-semibold text-gray-900 dark:text-white">
          เพิ่มกิจกรรมใหม่
        </h3>

        {error && (
          <div className="mb-4">
            <AlertComponent message={error} type="failure" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="mb-2 block">
              <Label htmlFor="title">หัวข้อกิจกรรม *</Label>
            </div>
            <TextInput
              id="title"
              name="title"
              placeholder="เช่น Community Day ประจำเดือน..."
              required
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="image">ลิงก์รูปภาพ (URL)</Label>
            </div>
            <TextInput
              id="image"
              name="image"
              placeholder="https://..."
              value={formData.image}
              onChange={handleChange}
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="h-full w-full rounded border object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="description">รายละเอียด</Label>
            </div>
            <Textarea
              id="description"
              name="description"
              placeholder="รายละเอียดกิจกรรม..."
              rows={20}
              required
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
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
