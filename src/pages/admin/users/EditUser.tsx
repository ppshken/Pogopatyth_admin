import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Label, TextInput, Select } from "flowbite-react";
import { AlertComponent } from "../../../component/alert";

export default function EditUser() {
  const { id } = useParams<{ id: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [friendCode, setFriendCode] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [team, setTeam] = useState("Mystic");
  const [loading, setLoading] = useState(false);
  const [alertshow, setAlertshow] = useState(false);
  const [alertmessage, setAlertmessage] = useState("");
  const navigate = useNavigate();

  async function fetchUser() {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_BASE;
      const res = await fetch(`${API_BASE}/user/by_id.php?user_id=${id}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "ไม่พบข้อมูลผู้ใช้");
      }
      const u = data.data;

      // set ค่าไปที่ state เพื่อแสดงในฟอร์ม
      setEmail(u.email ?? "");
      setTrainerName(u.trainer_name ?? "");
      setFriendCode(u.friend_code ?? "");
      setLevel(Number(u.level) || "");
      setTeam(u.team ?? "Mystic");
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
      const res = await fetch(`${API_BASE}/user/update.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          email,
          password: password || undefined, // ส่งเฉพาะถ้าเปลี่ยน
          trainer_name: trainerName,
          friend_code: friendCode,
          level,
          team,
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
          <Label>Password (ถ้าไม่เปลี่ยนให้เว้นว่าง)</Label>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <Label>Trainer Name</Label>
          <TextInput
            type="text"
            value={trainerName}
            onChange={(e) => setTrainerName(e.target.value)}
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
          <Label>Team</Label>
          <Select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option>Mystic</option>
            <option>Valor</option>
            <option>Instinct</option>
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
