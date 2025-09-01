import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Label, TextInput, Select } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";

export default function EditUser() {
  const { id } = useParams<{ id: string }>();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [status, setStatus] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [alertshow, setAlertshow] = useState(false);
  const [alertmessage, setAlertmessage] = useState("");
  const navigate = useNavigate();

  async function fetchUser() {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const res = await fetch(
        `${API_BASE}/api/admin/users/detail.php?user_id=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "ไม่พบข้อมูลผู้ใช้");
      }
      const u = data.data;

      // set ค่าไปที่ state เพื่อแสดงในฟอร์ม
      setEmail(u.email ?? "");
      setUsername(u.username ?? "");
      setFriendCode(u.friend_code ?? "");
      setLevel(Number(u.level) || "");
      setStatus(u.status);
    } catch (err: any) {
      console.error(err.message);
      setAlertmessage(err.message);
      setAlertshow(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchUser();
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE;
      const token = localStorage.getItem("auth_token");

      const res = await fetch(`${API_BASE}/api/admin/users/update.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          id,
          email,
          username: username,
          password: password || undefined, // ส่งเฉพาะถ้าเปลี่ยน
          friend_code: friendCode,
          level,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "บันทึกไม่สำเร็จ");
      }

      // redirect กลับหน้า users พร้อม alert
      navigate("/admin/users", {
        state: { alert: "success", msg: data.message || "อัปเดตเรียบร้อย" },
      });
    } catch (err: any) {
      setAlertmessage(err.message || "เกิดข้อผิดพลาด");
      setAlertshow(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h3 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Edit User
      </h3>

      {alertshow && (
        <div className="mb-4">
          <AlertComponent message={alertmessage} type="failure" />
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@flowbite.com"
            required
            shadow
          />
        </div>

        <div>
          <Label>Username</Label>
          <TextInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            shadow
          />
        </div>

        <div>
          <Label>Password (ถ้าไม่เปลี่ยนให้เว้นว่าง)</Label>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <Label>Friend Code</Label>
          <TextInput
            type="text"
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value)}
          />
        </div>

        <div>
          <Label>Level</Label>
          <TextInput
            type="number"
            value={level === "" ? "" : String(level)}
            onChange={(e) =>
              setLevel(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="1-50"
          />
        </div>

        <div>
          <Label>Status</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading} className="cursor-pointer">
            {loading ? "Loading..." : "Save"}
          </Button>
          <Button
            type="button"
            onClick={() => navigate(-1)}
            color="light"
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
